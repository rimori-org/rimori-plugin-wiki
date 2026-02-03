import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRimori, useTranslation } from '@rimori/react-client';
import { WikiTree } from '../../components/WikiTree';
import { PageViewer } from '../../components/PageViewer';
import { PageEditor } from '../../components/PageEditor';
import { useWikiPages } from '../../hooks/useWikiPages';
import { WikiPage as WikiPageType } from '../../types/wiki';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

export default function WikiPage() {
  const { pageId } = useParams<{ pageId?: string }>();
  const navigate = useNavigate();
  const plugin = useRimori();
  const { t } = useTranslation();
  const { toast } = useToast();

  const [mode, setMode] = useState<'private' | 'public'>('public');
  const [editing, setEditing] = useState(false);
  const [editingPage, setEditingPage] = useState<WikiPageType | null>(null);
  const [newPageParentId, setNewPageParentId] = useState<string | null | undefined>(undefined);
  const [moveDialogPage, setMoveDialogPage] = useState<WikiPageType | null>(null);
  const [moveTargetId, setMoveTargetId] = useState<string | null>(null);
  const [guildId, setGuildId] = useState<string | null>(null);

  useEffect(() => {
    const cleanup = plugin.plugin.onRimoriInfoUpdate((info) => {
      setGuildId(info.guild?.id || null);
    });
    return cleanup;
  }, [plugin.plugin]);

  const { pages, tree, toggleExpanded, expandToPage, getBreadcrumb, getPage, getChildren, refetch } =
    useWikiPages(mode);

  const currentUserId = plugin.plugin.getUserInfo().user_id;
  const selectedPage = pageId ? getPage(pageId) : undefined;

  useEffect(() => {
    if (pageId) expandToPage(pageId);
  }, [pageId, expandToPage]);

  // Listen for action triggers
  useEffect(() => {
    const listener = plugin.event.onMainPanelAction(async ({ page_id, achievement_topic }) => {
      if (page_id) {
        navigate(`/wiki/${page_id}`);
      }
      if (achievement_topic) {
        plugin.event.emitAccomplishment({
          type: 'macro',
          skillCategory: 'learning',
          accomplishmentKeyword: achievement_topic,
          errorRatio: 0,
          durationMinutes: 1,
          description: 'Visited a wiki page',
        });
      }
    }, 'wiki_page');
    return () => listener.off();
  }, [plugin.event, navigate]);

  const handleSelect = useCallback(
    (id: string) => {
      setEditing(false);
      navigate(`/wiki/${id}`);
    },
    [navigate],
  );

  const handleAddSubpage = useCallback((parentId: string | null) => {
    setNewPageParentId(parentId);
    setEditingPage(null);
    setEditing(true);
  }, []);

  const handleEdit = useCallback(() => {
    if (selectedPage) {
      setEditingPage(selectedPage);
      setNewPageParentId(undefined);
      setEditing(true);
    }
  }, [selectedPage]);

  const handleSave = useCallback(
    async (data: {
      title: string;
      content: string;
      description: string;
      icon: string;
      parent_id: string | null;
      show_children: boolean;
      action_label: string | null;
      guild_id?: string;
    }) => {
      const guildInfo = plugin.plugin.getGuildInfo();
      if (mode === 'private') {
        data.guild_id = guildInfo.id;
      }
      if (editingPage) {
        const { error } = await plugin.db.from('pages').update(data).eq('id', editingPage.id);
        if (error) {
          toast({ variant: 'destructive', description: error.message });
          return;
        }
      } else {
        const { error } = await plugin.db.from('pages').insert(data);
        if (error) {
          toast({ variant: 'destructive', description: error.message });
          return;
        }
      }
      setEditing(false);
      setEditingPage(null);
      setNewPageParentId(undefined);
      await refetch();
    },
    [editingPage, plugin.db, refetch, toast],
  );

  const handleDelete = useCallback(
    async (page?: WikiPageType) => {
      const target = page || selectedPage;
      if (!target) return;
      const { error } = await plugin.db.from('pages').delete().eq('id', target.id);
      if (error) {
        toast({ variant: 'destructive', description: error.message });
        return;
      }
      if (pageId === target.id) navigate('/wiki');
      setEditing(false);
      await refetch();
    },
    [selectedPage, pageId, plugin.db, navigate, refetch, toast],
  );

  const handleTogglePublish = useCallback(
    async (page?: WikiPageType) => {
      const target = page || selectedPage;
      if (!target) return;
      // guild_id set = private, guild_id null = public
      // To publish: set guild_id to null. To unpublish: set guild_id to user's guild.
      const newGuildId = target.guild_id ? null : guildId;
      const { error } = await plugin.db.from('pages').update({ guild_id: newGuildId }).eq('id', target.id);
      if (error) {
        toast({ variant: 'destructive', description: error.message });
        return;
      }
      await refetch();
    },
    [selectedPage, plugin.db, guildId, refetch, toast],
  );

  const handleMove = useCallback(async () => {
    if (!moveDialogPage) return;
    const { error } = await plugin.db.from('pages').update({ parent_id: moveTargetId }).eq('id', moveDialogPage.id);
    if (error) {
      toast({ variant: 'destructive', description: error.message });
      return;
    }
    setMoveDialogPage(null);
    await refetch();
  }, [moveDialogPage, moveTargetId, plugin.db, refetch, toast]);

  return (
    <div className="flex flex-col h-screen bg-background">
      <div className="flex flex-1 min-h-0">
        <div className="w-64 border-r border-border bg-muted/20 flex flex-col shrink-0">
          <h1 className="text-4xl font-bold p-2 text-center bg-slate-800">Wiki</h1>
          <WikiTree
            tree={tree}
            selectedPageId={pageId || null}
            onSelect={handleSelect}
            onToggle={toggleExpanded}
            onAddSubpage={handleAddSubpage}
            onDelete={(page) => handleDelete(page)}
            onMove={(page) => {
              setMoveDialogPage(page);
              setMoveTargetId(page.parent_id);
            }}
            onTogglePublish={(page) => handleTogglePublish(page)}
            mode={mode}
            onModeChange={(v) => setMode(v)}
            currentUserId={currentUserId}
          />
        </div>

        <div className="flex-1 min-w-0">
          {editing ? (
            <PageEditor
              page={editingPage}
              allPages={pages}
              initialParentId={newPageParentId}
              onSave={handleSave}
              onCancel={() => {
                setEditing(false);
                setEditingPage(null);
                setNewPageParentId(undefined);
              }}
            />
          ) : selectedPage ? (
            <PageViewer
              page={selectedPage}
              breadcrumb={getBreadcrumb(selectedPage.id)}
              children={getChildren(selectedPage.id)}
              onEdit={handleEdit}
              onDelete={() => handleDelete()}
              onTogglePublish={() => handleTogglePublish()}
              onNavigate={handleSelect}
              isOwner={selectedPage.created_by === currentUserId}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
              <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center text-3xl">📝</div>
              <p className="text-sm">{t('wiki.page.noPageSelected')}</p>
            </div>
          )}
        </div>
      </div>

      <Dialog open={!!moveDialogPage} onOpenChange={(open) => !open && setMoveDialogPage(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('wiki.page.moveTo')}</DialogTitle>
          </DialogHeader>
          <Select
            value={moveTargetId || '__root__'}
            onValueChange={(v) => setMoveTargetId(v === '__root__' ? null : v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__root__">{t('wiki.page.moveToRoot')}</SelectItem>
              {pages
                .filter((p) => p.id !== moveDialogPage?.id)
                .map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.icon && `${p.icon} `}
                    {p.title}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setMoveDialogPage(null)}>
              {t('wiki.page.cancel')}
            </Button>
            <Button onClick={handleMove}>{t('wiki.page.moveConfirm')}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
