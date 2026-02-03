import { useState, useEffect, useCallback, useRef } from 'react';
import { useRimori, useTranslation } from '@rimori/react-client';
import { WikiPage } from '../../types/wiki';
import { Globe, Lock, ChevronRight, ChevronDown, Pencil, Plus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MarkdownEditor } from '../../components/MarkdownEditor';

type SidebarMode = 'view' | 'edit' | 'add';

interface SidebarTreeNodeProps {
  page: WikiPage;
  allPages: WikiPage[];
  expandedIds: Set<string>;
  selectedId: string | null;
  onToggle: (id: string) => void;
  onNavigate: (pageId: string) => void;
}

function SidebarTreeNode({ page, allPages, expandedIds, selectedId, onToggle, onNavigate }: SidebarTreeNodeProps) {
  const children = allPages.filter((p) => p.parent_id === page.id).sort((a, b) => a.sort_order - b.sort_order);
  const hasChildren = children.length > 0;
  const isExpanded = expandedIds.has(page.id);
  const isSelected = selectedId === page.id;

  return (
    <div>
      <div
        className={
          'flex items-center gap-1 px-2 py-1.5 cursor-pointer rounded text-sm ' +
          (isSelected ? 'bg-primary/10 text-primary dark:bg-primary/20' : 'hover:bg-gray-100 dark:hover:bg-gray-800')
        }
        onClick={() => onNavigate(page.id)}
      >
        {hasChildren ? (
          <button
            className="w-4 h-4 flex items-center justify-center shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              onToggle(page.id);
            }}
          >
            {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>
        ) : (
          <span className="w-4" />
        )}
        <span className="w-4 text-center shrink-0 text-xs">{page.icon || '📄'}</span>
        <span className="truncate">{page.title}</span>
      </div>
      {isExpanded &&
        children.map((child) => (
          <div key={child.id} className="pl-3">
            <SidebarTreeNode
              page={child}
              allPages={allPages}
              expandedIds={expandedIds}
              selectedId={selectedId}
              onToggle={onToggle}
              onNavigate={onNavigate}
            />
          </div>
        ))}
    </div>
  );
}

export default function BrowseSidebar() {
  const plugin = useRimori();
  const { t } = useTranslation();
  const [privatePages, setPrivatePages] = useState<WikiPage[]>([]);
  const [publicPages, setPublicPages] = useState<WikiPage[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [selectedPage, setSelectedPage] = useState<WikiPage | null>(null);
  const [mode, setMode] = useState<SidebarMode>('view');
  const [activeTab, setActiveTab] = useState('private');
  const [guildId, setGuildId] = useState<string | null>(null);

  // Edit/Add form state
  const [editTitle, setEditTitle] = useState('');
  const [editIcon, setEditIcon] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editParentId, setEditParentId] = useState<string | null>(null);
  const editContentRef = useRef('');

  useEffect(() => {
    const cleanup = plugin.plugin.onRimoriInfoUpdate((info) => {
      setGuildId(info.guild?.id || null);
    });
    return cleanup;
  }, [plugin.plugin]);

  const fetchPages = useCallback(async () => {
    // Private pages have guild_id set (scoped to user's personal guild)
    const { data: privData } = await plugin.db
      .from('pages')
      .select('*')
      .not('guild_id', 'is', null)
      .order('sort_order', { ascending: true });
    if (privData) setPrivatePages(privData as WikiPage[]);

    // Public pages have guild_id = null (visible to everyone)
    const { data: pubData } = await plugin.db
      .from('pages')
      .select('*')
      .is('guild_id', null)
      .order('sort_order', { ascending: true });
    if (pubData) setPublicPages(pubData as WikiPage[]);
  }, [plugin.db]);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  const toggleExpanded = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleSelectPage = useCallback(
    (pageId: string) => {
      const allPages = [...privatePages, ...publicPages];
      const page = allPages.find((p) => p.id === pageId) || null;
      setSelectedPage(page);
      setMode('view');
    },
    [privatePages, publicPages],
  );

  const startEdit = useCallback(() => {
    if (!selectedPage) return;
    setEditTitle(selectedPage.title);
    setEditIcon(selectedPage.icon || '');
    setEditDescription(selectedPage.description || '');
    setEditParentId(selectedPage.parent_id);
    editContentRef.current = selectedPage.content || '';
    setMode('edit');
  }, [selectedPage]);

  const startAdd = useCallback(() => {
    setEditTitle('');
    setEditIcon('');
    setEditDescription('');
    setEditParentId(selectedPage?.id || null);
    editContentRef.current = '';
    setMode('add');
  }, [selectedPage]);

  const handleCancel = useCallback(() => {
    setMode('view');
  }, []);

  const handleSave = useCallback(async () => {
    if (!editTitle.trim()) return;

    if (mode === 'edit' && selectedPage) {
      await plugin.db
        .from('pages')
        .update({
          title: editTitle.trim(),
          icon: editIcon.trim() || null,
          description: editDescription.trim() || null,
          content: editContentRef.current,
          parent_id: editParentId,
        })
        .eq('id', selectedPage.id);

      setSelectedPage((prev) =>
        prev
          ? {
              ...prev,
              title: editTitle.trim(),
              icon: editIcon.trim() || null,
              description: editDescription.trim() || null,
              content: editContentRef.current,
              parent_id: editParentId,
            }
          : null,
      );
    } else if (mode === 'add') {
      const currentPages = activeTab === 'private' ? privatePages : publicPages;
      const maxSort = currentPages.reduce((max, p) => Math.max(max, p.sort_order), 0);

      const newPage: Partial<WikiPage> = {
        title: editTitle.trim(),
        icon: editIcon.trim() || null,
        description: editDescription.trim() || null,
        content: editContentRef.current,
        parent_id: editParentId,
        sort_order: maxSort + 1,
        show_children: false,
        action_label: null,
        guild_id: activeTab === 'private' ? guildId : null,
      };

      const { data } = await plugin.db.from('pages').insert(newPage).select('*');
      if (data && data[0]) {
        setSelectedPage(data[0] as WikiPage);
      }
    }

    await fetchPages();
    setMode('view');
  }, [
    mode,
    selectedPage,
    editTitle,
    editIcon,
    editDescription,
    editParentId,
    activeTab,
    privatePages,
    publicPages,
    guildId,
    plugin.db,
    fetchPages,
  ]);

  const currentTabPages = activeTab === 'private' ? privatePages : publicPages;
  const availableParents = currentTabPages.filter((p) => (mode === 'edit' ? p.id !== selectedPage?.id : true));

  const renderTree = (pages: WikiPage[]) => {
    const roots = pages.filter((p) => !p.parent_id);
    if (roots.length === 0) {
      return <p className="text-sm text-gray-500 px-3 py-2">{t('wiki.tree.emptyTree')}</p>;
    }
    return roots.map((page) => (
      <SidebarTreeNode
        key={page.id}
        page={page}
        allPages={pages}
        expandedIds={expandedIds}
        selectedId={selectedPage?.id || null}
        onToggle={toggleExpanded}
        onNavigate={handleSelectPage}
      />
    ));
  };

  const renderEditForm = () => (
    <div className="mt-3 border-t pt-2 flex flex-col gap-2 px-1">
      <h3 className="text-sm font-semibold">
        {mode === 'edit' ? t('wiki.editor.editPage') : t('wiki.editor.newPage')}
      </h3>
      <div className="flex gap-2">
        <div className="w-14">
          <Label className="text-xs text-muted-foreground">{t('wiki.editor.icon')}</Label>
          <Input
            value={editIcon}
            onChange={(e) => setEditIcon(e.target.value)}
            placeholder="📄"
            className="text-center text-lg h-9 mt-1"
            maxLength={2}
          />
        </div>
        <div className="flex-1">
          <Label className="text-xs text-muted-foreground">{t('wiki.editor.title')}</Label>
          <Input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder={t('wiki.page.titlePlaceholder')}
            className="h-9 mt-1"
          />
        </div>
      </div>
      <div>
        <Label className="text-xs text-muted-foreground">{t('wiki.editor.description')}</Label>
        <Input
          value={editDescription}
          onChange={(e) => setEditDescription(e.target.value)}
          placeholder={t('wiki.page.descriptionPlaceholder')}
          className="h-9 mt-1"
        />
      </div>
      <div>
        <Label className="text-xs text-muted-foreground">{t('wiki.editor.parentPage')}</Label>
        <Select value={editParentId || '__root__'} onValueChange={(v) => setEditParentId(v === '__root__' ? null : v)}>
          <SelectTrigger className="mt-1 h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__root__">{t('wiki.page.moveToRoot')}</SelectItem>
            {availableParents.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.icon && `${p.icon} `}
                {p.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs text-muted-foreground">{t('wiki.editor.content')}</Label>
        <MarkdownEditor
          key={mode === 'edit' ? `edit-${selectedPage?.id}` : 'add-new'}
          content={editContentRef.current}
          editable={true}
          onUpdate={(val) => {
            editContentRef.current = val;
          }}
          className="mt-1 min-h-[150px]"
        />
      </div>
      <div className="flex gap-2 justify-end pt-1">
        <Button variant="outline" size="sm" onClick={handleCancel}>
          {t('wiki.page.cancel')}
        </Button>
        <Button size="sm" onClick={handleSave} disabled={!editTitle.trim()}>
          {t('wiki.page.save')}
        </Button>
      </div>
    </div>
  );

  const renderSelectedPage = () => {
    return (
      <div className="mt-3 border-t pt-3 flex flex-col gap-2">
        <div className="flex items-center justify-between pl-1">
          {selectedPage ? (
            <h3 className="text-xl font-semibold truncate">
              {selectedPage.icon && <span className="mr-1">{selectedPage.icon}</span>}
              {selectedPage.title}
            </h3>
          ) : (
            <span />
          )}
          <div className="flex gap-1 shrink-0">
            {selectedPage && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={startEdit}
                title={t('wiki.sidebar.edit')}
              >
                <Pencil size={14} />
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={startAdd} title={t('wiki.tree.newPage')}>
              <Plus size={14} />
            </Button>
          </div>
        </div>
        {selectedPage?.description && <p className="text-sm text-muted-foreground px-1">{selectedPage.description}</p>}
        {selectedPage?.content && (
          <ScrollArea className="max-h-[300px] px-1">
            <MarkdownEditor key={selectedPage.id} content={selectedPage.content} editable={false} className="text-sm" />
          </ScrollArea>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full p-2">
      <div className="flex items-center justify-between px-2 mb-2 pr-5">
        <h2 className="text-2xl font-semibold">{t('wiki.title')}</h2>
      </div>
      <Tabs defaultValue="private" className="flex-1 flex flex-col" onValueChange={setActiveTab}>
        <TabsList className="w-full">
          <TabsTrigger value="private" className="flex-1 gap-1">
            <Lock size={12} /> {t('wiki.tabs.private')}
          </TabsTrigger>
          <TabsTrigger value="public" className="flex-1 gap-1">
            <Globe size={12} /> {t('wiki.tabs.public')}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="private" className="flex-1">
          <ScrollArea className="max-h-[200px]">{renderTree(privatePages)}</ScrollArea>
        </TabsContent>
        <TabsContent value="public" className="flex-1">
          <ScrollArea className="max-h-[200px]">{renderTree(publicPages)}</ScrollArea>
        </TabsContent>
      </Tabs>

      {mode === 'view' && renderSelectedPage()}
      {(mode === 'edit' || mode === 'add') && renderEditForm()}
    </div>
  );
}
