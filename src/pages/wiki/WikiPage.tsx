import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRimori, useTranslation } from '@rimori/react-client';
import { WikiTree } from '../../components/WikiTree';
import { PageViewer } from '../../components/PageViewer';
import { PageEditor } from '../../components/PageEditor';
import { useWikiPages } from '../../hooks/useWikiPages';
import { WikiPage as WikiPageType } from '../../types/wiki';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Globe, Lock, Plus } from 'lucide-react';

function getPagesInTreeOrder(pages: WikiPageType[]): { page: WikiPageType; depth: number }[] {
  const result: { page: WikiPageType; depth: number }[] = [];
  function traverse(page: WikiPageType, depth: number) {
    result.push({ page, depth });
    const children = pages.filter((p) => p.parent_id === page.id).sort((a, b) => a.sort_order - b.sort_order);
    children.forEach((c) => traverse(c, depth + 1));
  }
  const roots = pages.filter((p) => !p.parent_id).sort((a, b) => a.sort_order - b.sort_order);
  roots.forEach((r) => traverse(r, 0));
  return result;
}

export default function WikiPage() {
  const { pageId } = useParams<{ pageId?: string }>();
  const navigate = useNavigate();
  const plugin = useRimori();
  const { t } = useTranslation();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const isMainPanel = plugin.plugin.applicationMode === 'main';

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
      min_skill_level: string | null;
      skill_level_type: string | null;
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
        setEditing(false);
        setEditingPage(null);
        setNewPageParentId(undefined);
        await refetch();
      } else {
        const { data: newPage, error } = await plugin.db.from('pages').insert(data).select('*').single();
        if (error) {
          toast({ variant: 'destructive', description: error.message });
          return;
        }
        setEditing(false);
        setEditingPage(null);
        setNewPageParentId(undefined);
        await refetch();
        if (newPage) {
          navigate(`/wiki/${newPage.id}`);
        }
      }
    },
    [editingPage, plugin.db, plugin.plugin, mode, refetch, toast, navigate],
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

  const orderedPages = getPagesInTreeOrder(pages.filter((p) => p.id !== moveDialogPage?.id));

  const renderContent = () => {
    if (editing) {
      return (
        <PageEditor
          key={editingPage?.id ?? `new-${newPageParentId ?? 'root'}`}
          page={editingPage}
          allPages={pages}
          initialParentId={newPageParentId}
          onSave={handleSave}
          onCancel={() => {
            setEditing(false);
            setEditingPage(null);
            setNewPageParentId(undefined);
          }}
          onTogglePublish={editingPage ? () => handleTogglePublish() : undefined}
          onDelete={editingPage ? () => handleDelete() : undefined}
          isPublic={editingPage ? !editingPage.guild_id : undefined}
        />
      );
    }
    if (selectedPage) {
      return (
        <PageViewer
          page={selectedPage}
          breadcrumb={getBreadcrumb(selectedPage.id)}
          children={getChildren(selectedPage.id)}
          onEdit={handleEdit}
          onNavigate={handleSelect}
          isOwner={selectedPage.created_by === currentUserId}
          showComments={isMainPanel}
          mobileMode={isMobile}
        />
      );
    }
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
        <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center text-3xl">📝</div>
        <p className="text-sm">{t('wiki.page.noPageSelected')}</p>
      </div>
    );
  };

  if (isMobile) {
    const mobileOrderedPages = getPagesInTreeOrder(pages);
    return (
      <div className="flex flex-col h-screen bg-background">
        <div className="flex flex-col gap-1 px-2 pt-2 pb-1 border-b border-border bg-muted/20 shrink-0">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">Wiki</h1>
            <div className="flex items-center gap-1 mr-10">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleAddSubpage(null)}>
                <Plus size={15} />
              </Button>
              <Tabs
                value={mode}
                onValueChange={(v) => {
                  setMode(v as 'private' | 'public');
                  setEditing(false);
                }}
              >
                <TabsList className="h-7">
                  <TabsTrigger value="private" className="gap-1 text-xs px-2 h-5">
                    <Lock size={10} /> {t('wiki.tabs.private')}
                  </TabsTrigger>
                  <TabsTrigger value="public" className="gap-1 text-xs px-2 h-5">
                    <Globe size={10} /> {t('wiki.tabs.public')}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
          <Select
            value={pageId || ''}
            onValueChange={(v) => {
              if (v) handleSelect(v);
            }}
          >
            <SelectTrigger className="w-full border-0 shadow-none bg-transparent px-0 h-auto text-lg font-semibold focus:ring-0 focus:ring-offset-0 [&>svg]:hidden">
              <SelectValue placeholder={t('wiki.sidebar.selectPage')} />
            </SelectTrigger>
            <SelectContent>
              {mobileOrderedPages.map(({ page, depth }) => (
                <SelectItem key={page.id} value={page.id} style={{ paddingLeft: `${32 + depth * 12}px` }}>
                  {page.icon && `${page.icon} `}
                  {page.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 min-h-0 overflow-hidden">{renderContent()}</div>

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
                {orderedPages.map(({ page, depth }) => (
                  <SelectItem key={page.id} value={page.id} style={{ paddingLeft: `${32 + depth * 12}px` }}>
                    {page.icon && `${page.icon} `}
                    {page.title}
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

        <div className="flex-1 min-w-0">{renderContent()}</div>
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
              {orderedPages.map(({ page, depth }) => (
                <SelectItem key={page.id} value={page.id} style={{ paddingLeft: `${32 + depth * 12}px` }}>
                  {page.icon && `${page.icon} `}
                  {page.title}
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
