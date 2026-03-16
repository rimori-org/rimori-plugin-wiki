import { ChevronRight, ChevronDown, Plus, Trash2, ArrowRight, Globe, Lock } from 'lucide-react';
import { TreeNode, WikiPage } from '../types/wiki';
import { useTranslation } from '@rimori/react-client';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface WikiTreeProps {
  tree: TreeNode[];
  selectedPageId: string | null;
  onSelect: (pageId: string) => void;
  onToggle: (pageId: string) => void;
  onAddSubpage: (parentId: string | null) => void;
  onDelete: (page: WikiPage) => void;
  onMove: (page: WikiPage) => void;
  onTogglePublish: (page: WikiPage) => void;
  onPublishForAll?: (page: WikiPage) => void;
  onUnpublishForAll?: (page: WikiPage) => void;
  getPublicityLevel: (page: WikiPage) => 'own' | 'guild' | 'lang';
  mode: 'private' | 'public';
  onModeChange: (mode: 'private' | 'public') => void;
  currentUserId: string | null;
  isModerator?: boolean;
  isShadowGuild?: boolean;
}

function TreeNodeItem({
  node,
  depth,
  selectedPageId,
  onSelect,
  onToggle,
  onAddSubpage,
  onDelete,
  onMove,
  onTogglePublish,
  onPublishForAll,
  onUnpublishForAll,
  getPublicityLevel,
  mode,
  currentUserId,
  isModerator,
  isShadowGuild,
}: WikiTreeProps & { node: TreeNode; depth: number }) {
  const { t } = useTranslation();
  const hasChildren = node.children.length > 0;
  const isSelected = selectedPageId === node.page.id;
  const isOwner = node.page.created_by === currentUserId || (isModerator && mode === 'public');
  const publicityLevel = getPublicityLevel(node.page);

  return (
    <div className="mb-0.5">
      <ContextMenu>
        <ContextMenuTrigger>
          <div
            className={`flex items-center gap-1.5 px-2 py-1.5 cursor-pointer rounded-lg text-sm transition-colors duration-150 mx-1 ${
              isSelected
                ? 'bg-primary/10 text-primary dark:bg-primary/15 font-medium'
                : 'hover:bg-accent text-foreground/80 hover:text-foreground'
            }`}
            style={{ paddingLeft: `${depth * 16 + 8}px` }}
            onClick={() => onSelect(node.page.id)}
          >
            <button
              className="w-4 h-4 flex items-center justify-center shrink-0 text-muted-foreground"
              onClick={(e) => {
                e.stopPropagation();
                if (hasChildren) onToggle(node.page.id);
              }}
            >
              {hasChildren ? (
                node.expanded ? (
                  <ChevronDown size={14} />
                ) : (
                  <ChevronRight size={14} />
                )
              ) : (
                <span className="w-3" />
              )}
            </button>
            <span className="w-5 text-center shrink-0">{node.page.icon || '📄'}</span>
            <span className="truncate flex-1">{node.page.title}</span>
            {publicityLevel === 'lang' ? (
              <Globe size={11} className="shrink-0 text-green-500/70" />
            ) : publicityLevel === 'guild' ? (
              <Globe size={11} className="shrink-0 text-primary/60" />
            ) : (
              <Lock size={11} className="shrink-0 text-muted-foreground/50" />
            )}
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={() => onAddSubpage(node.page.id)}>
            <Plus size={14} className="mr-2" />
            {t('wiki.tree.newSubpage')}
          </ContextMenuItem>
          {isOwner && (
            <>
              <ContextMenuItem onClick={() => onMove(node.page)}>
                <ArrowRight size={14} className="mr-2" />
                {t('wiki.tree.move')}
              </ContextMenuItem>
              {!isShadowGuild && publicityLevel !== 'lang' && (
                <ContextMenuItem onClick={() => onTogglePublish(node.page)}>
                  {publicityLevel === 'guild' ? (
                    <>
                      <Lock size={14} className="mr-2" />
                      {t('wiki.tree.unpublishFromGuild')}
                    </>
                  ) : (
                    <>
                      <Globe size={14} className="mr-2" />
                      {t('wiki.tree.publishInGuild')}
                    </>
                  )}
                </ContextMenuItem>
              )}
              {onPublishForAll && publicityLevel !== 'lang' && (
                <ContextMenuItem onClick={() => onPublishForAll(node.page)}>
                  <Globe size={14} className="mr-2" />
                  {t('wiki.tree.publishForAll')}
                </ContextMenuItem>
              )}
              {onUnpublishForAll && publicityLevel === 'lang' && (
                <ContextMenuItem onClick={() => onUnpublishForAll(node.page)}>
                  <Lock size={14} className="mr-2" />
                  {t('wiki.tree.unpublishForAll')}
                </ContextMenuItem>
              )}
              <ContextMenuItem className="text-red-600" onClick={() => onDelete(node.page)}>
                <Trash2 size={14} className="mr-2" />
                {t('wiki.tree.delete')}
              </ContextMenuItem>
            </>
          )}
        </ContextMenuContent>
      </ContextMenu>
      {node.expanded &&
        node.children.map((child) => (
          <TreeNodeItem
            key={child.page.id}
            node={child}
            depth={depth + 1}
            tree={[]}
            onModeChange={() => null}
            selectedPageId={selectedPageId}
            onSelect={onSelect}
            onToggle={onToggle}
            onAddSubpage={onAddSubpage}
            onDelete={onDelete}
            onMove={onMove}
            onTogglePublish={onTogglePublish}
            onPublishForAll={onPublishForAll}
            onUnpublishForAll={onUnpublishForAll}
            getPublicityLevel={getPublicityLevel}
            mode={mode}
            currentUserId={currentUserId}
            isModerator={isModerator}
            isShadowGuild={isShadowGuild}
          />
        ))}
    </div>
  );
}

export const WikiTree = ({
  tree,
  selectedPageId,
  onSelect,
  onToggle,
  onAddSubpage,
  onDelete,
  onMove,
  onTogglePublish,
  onPublishForAll,
  onUnpublishForAll,
  getPublicityLevel,
  mode,
  onModeChange,
  currentUserId,
  isModerator,
  isShadowGuild,
}: WikiTreeProps) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col h-full">
      <Tabs value={mode} onValueChange={(v) => onModeChange(v as 'private' | 'public')}>
        <TabsList className="w-full rounded-none pt-1.5">
          <TabsTrigger value="private" className="flex-1">
            {t('wiki.tabs.private')}
          </TabsTrigger>
          <TabsTrigger value="public" className="flex-1">
            {t('wiki.tabs.public')}
          </TabsTrigger>
        </TabsList>
      </Tabs>
      <div className="flex-1 overflow-y-auto py-1.5">
        {tree.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-3 py-8 text-muted-foreground">
            <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center text-xl">📄</div>
            <p className="text-sm text-center">{t('wiki.tree.emptyTree')}</p>
          </div>
        ) : (
          tree.map((node) => (
            <TreeNodeItem
              key={node.page.id}
              node={node}
              depth={0}
              tree={tree}
              selectedPageId={selectedPageId}
              onSelect={onSelect}
              onToggle={onToggle}
              onAddSubpage={onAddSubpage}
              onModeChange={onModeChange}
              onDelete={onDelete}
              onMove={onMove}
              onTogglePublish={onTogglePublish}
              onPublishForAll={onPublishForAll}
              onUnpublishForAll={onUnpublishForAll}
              getPublicityLevel={getPublicityLevel}
              mode={mode}
              currentUserId={currentUserId}
              isModerator={isModerator}
              isShadowGuild={isShadowGuild}
            />
          ))
        )}
      </div>
      <button
        onClick={() => onAddSubpage(null)}
        className="flex items-center gap-1.5 text-sm text-primary hover:bg-primary/10 w-full px-3 py-2 rounded-lg transition-colors duration-150 font-medium mb-1"
      >
        <Plus size={15} />
        {t('wiki.tree.newPage')}
      </button>
    </div>
  );
};
