import { useState, useEffect, useCallback, useRef } from 'react';
import { MarkdownEditor, useRimori, useTranslation } from '@rimori/react-client';
import { WikiPage } from '../../types/wiki';
import { Globe, Lock, Pencil, Plus } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type SidebarMode = 'view' | 'edit' | 'add';

function getPagesInTreeOrder(pages: WikiPage[]): { page: WikiPage; depth: number }[] {
  const result: { page: WikiPage; depth: number }[] = [];

  function traverse(page: WikiPage, depth: number) {
    result.push({ page, depth });
    const children = pages.filter((p) => p.parent_id === page.id).sort((a, b) => a.sort_order - b.sort_order);
    children.forEach((c) => traverse(c, depth + 1));
  }

  const roots = pages.filter((p) => !p.parent_id).sort((a, b) => a.sort_order - b.sort_order);
  roots.forEach((r) => traverse(r, 0));

  return result;
}

export default function BrowseSidebar() {
  const plugin = useRimori();
  const { t } = useTranslation();
  const [privatePages, setPrivatePages] = useState<WikiPage[]>([]);
  const [publicPages, setPublicPages] = useState<WikiPage[]>([]);
  const [selectedPage, setSelectedPage] = useState<WikiPage | null>(null);
  const [mode, setMode] = useState<SidebarMode>('view');
  const [activeTab, setActiveTab] = useState('private');
  const [guildId, setGuildId] = useState<string | null>(() => plugin.plugin.getGuildInfo().id);

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
    const { data: privData } = await plugin.db
      .from('pages')
      .select('*')
      .not('guild_id', 'is', null)
      .order('sort_order', { ascending: true });
    if (privData) setPrivatePages(privData as WikiPage[]);

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
      const isPrivate = activeTab === 'private';
      const relevantPages = isPrivate ? privatePages : publicPages;
      const maxSort = relevantPages.reduce((max, p) => Math.max(max, p.sort_order), 0);

      const newPage: Partial<WikiPage> = {
        title: editTitle.trim(),
        icon: editIcon.trim() || null,
        description: editDescription.trim() || null,
        content: editContentRef.current,
        parent_id: editParentId,
        sort_order: maxSort + 1,
        action_label: null,
        guild_id: isPrivate ? guildId : null,
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
  const orderedPages = getPagesInTreeOrder(currentTabPages);
  const allPages = [...privatePages, ...publicPages];
  const availableParents = allPages.filter((p) => (mode === 'edit' ? p.id !== selectedPage?.id : true));

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

  const renderSelectedPage = () => (
    <div className="pt-3 border-t flex flex-col gap-2 flex-1 min-h-0 overflow-y-auto">
      <div className="flex items-center gap-1">
        <Select value={selectedPage?.id || ''} onValueChange={handleSelectPage}>
          <SelectTrigger className="flex-1 h-auto items-center text-xl font-semibold border-0 shadow-none px-1 py-0.5 focus:ring-0 focus:ring-offset-0 bg-transparent [&>span]:line-clamp-none [&>span]:text-left [&>span]:whitespace-normal">
            <SelectValue placeholder={t('wiki.sidebar.selectPage')} />
          </SelectTrigger>
          <SelectContent>
            {orderedPages.map(({ page, depth }) => (
              <SelectItem key={page.id} value={page.id} style={{ paddingLeft: `${32 + depth * 12}px` }}>
                {page.icon && `${page.icon} `}
                {page.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-1 shrink-0">
          {selectedPage && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={startEdit} title={t('wiki.sidebar.edit')}>
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
        <MarkdownEditor
          key={selectedPage.id}
          content={selectedPage.content}
          editable={false}
          className="text-sm px-1"
        />
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-full p-2">
      <Tabs
        defaultValue="private"
        onValueChange={(tab) => {
          setActiveTab(tab);
          setSelectedPage(null);
          if (mode === 'add') setEditParentId(null);
        }}
      >
        <div className="flex items-center justify-between px-2 mb-2 pr-8">
          <h2 className="text-3xl font-semibold">{t('wiki.title')}</h2>
          <TabsList >
            <TabsTrigger value="private" className="gap-1 text-xs px-2">
              <Lock size={11} /> {t('wiki.tabs.private')}
            </TabsTrigger>
            <TabsTrigger value="public" className="gap-1 text-xs px-2">
              <Globe size={11} /> {t('wiki.tabs.public')}
            </TabsTrigger>
          </TabsList>
        </div>
      </Tabs>
      {mode === 'view' && renderSelectedPage()}
      {(mode === 'edit' || mode === 'add') && renderEditForm()}
    </div>
  );
}
