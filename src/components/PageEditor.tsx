import { useState, useRef } from 'react';
import { MarkdownEditor, useTranslation } from '@rimori/react-client';
import { WikiPage } from '../types/wiki';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Globe, Lock, Trash2, Users } from 'lucide-react';

const LANGUAGE_LEVELS = ['Pre-A1', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'Post-C2'] as const;
const SKILL_TYPES = ['reading', 'writing', 'grammar', 'speaking', 'listening', 'understanding'] as const;

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

interface PageEditorProps {
  page: WikiPage | null;
  allPages: WikiPage[];
  initialParentId?: string | null;
  onSave: (data: {
    title: string;
    content: string;
    description: string;
    icon: string;
    parent_id: string | null;
    min_skill_level: string | null;
    skill_level_type: string | null;
  }) => void;
  onCancel: () => void;
  onTogglePublish?: () => void;
  onPublishForAll?: () => void;
  onUnpublishForAll?: () => void;
  onDelete?: () => void;
  publicityLevel?: 'own' | 'guild' | 'lang';
  isShadowGuild?: boolean;
  isModerator?: boolean;
}

export const PageEditor = ({
  page,
  allPages,
  initialParentId,
  onSave,
  onCancel,
  onTogglePublish,
  onPublishForAll,
  onUnpublishForAll,
  onDelete,
  publicityLevel,
  isShadowGuild,
  isModerator,
}: PageEditorProps) => {
  const { t } = useTranslation();
  const [title, setTitle] = useState(page?.title || '');
  const [description, setDescription] = useState(page?.description || '');
  const [icon, setIcon] = useState(page?.icon || '');
  const [initialContent] = useState(page?.content || '');
  const contentRef = useRef(initialContent);
  const [parentId, setParentId] = useState<string | null>(page?.parent_id ?? initialParentId ?? null);
  const [skillLevelType, setSkillLevelType] = useState<string>(page?.skill_level_type || '');
  const [minSkillLevel, setMinSkillLevel] = useState<string>(page?.min_skill_level || '');

  const availableParents = allPages.filter((p) => p.id !== page?.id);
  const orderedParents = getPagesInTreeOrder(availableParents);

  const handleSave = async () => {
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      content: contentRef.current,
      description: description.trim(),
      icon: icon.trim(),
      parent_id: parentId,
      min_skill_level: skillLevelType && minSkillLevel ? minSkillLevel : null,
      skill_level_type: skillLevelType || null,
    });
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-48px)] overflow-y-auto p-2 pb-4">
      <div className="mb-6 flex items-center gap-3">
        <h2 className="text-2xl font-bold tracking-tight">
          {page ? t('wiki.editor.editPage') : t('wiki.editor.newPage')}
        </h2>
        {page && publicityLevel && (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
              publicityLevel === 'lang'
                ? 'bg-green-500/15 text-green-600 dark:text-green-400'
                : publicityLevel === 'guild'
                  ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                  : 'bg-muted text-muted-foreground'
            }`}
          >
            {publicityLevel === 'lang' ? (
              <Globe size={12} />
            ) : publicityLevel === 'guild' ? (
              <Users size={12} />
            ) : (
              <Lock size={12} />
            )}
            {publicityLevel === 'lang'
              ? t('wiki.editor.publicityPublic')
              : publicityLevel === 'guild'
                ? t('wiki.editor.publicityGuild')
                : t('wiki.editor.publicityPrivate')}
          </span>
        )}
      </div>

      <div className="space-y-5 mb-6">
        <div className="flex gap-3 @sm:mr-12">
          <div className="w-24">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {t('wiki.editor.icon')}
            </Label>
            <Select value={icon || '📄'} onValueChange={setIcon}>
              <SelectTrigger className="text-center mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {[
                  '📄',
                  '📚',
                  '📖',
                  '📝',
                  '✏️',
                  '🔬',
                  '🧪',
                  '🧠',
                  '💡',
                  '🎓',
                  '🌍',
                  '📊',
                  '📈',
                  '🔧',
                  '⚙️',
                  '🎨',
                  '🎵',
                  '📐',
                  '🔑',
                  '⭐',
                ].map((emoji) => (
                  <SelectItem key={emoji} value={emoji} className="text-xl text-center">
                    {emoji}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {t('wiki.editor.title')}
            </Label>
            <Input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('wiki.page.titlePlaceholder')}
              className="mt-1.5 font-medium"
            />
          </div>
        </div>

        <div className="@sm:mr-12">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {t('wiki.editor.descriptionOptional')}
          </Label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('wiki.page.descriptionPlaceholder')}
            className="mt-1.5"
          />
        </div>

        <div>
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {t('wiki.editor.parentPage')}
          </Label>
          <Select value={parentId || '__root__'} onValueChange={(v) => setParentId(v === '__root__' ? null : v)}>
            <SelectTrigger className="mt-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__root__">{t('wiki.page.moveToRoot')}</SelectItem>
              {orderedParents.map(({ page: p, depth }) => (
                <SelectItem key={p.id} value={p.id} style={{ paddingLeft: `${32 + depth * 16}px` }}>
                  {p.icon && `${p.icon} `}
                  {p.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {page && publicityLevel && publicityLevel !== 'own' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {t('wiki.editor.skillLevelType')}
              </Label>
              <Select
                value={skillLevelType || '__none__'}
                onValueChange={(v) => {
                  setSkillLevelType(v === '__none__' ? '' : v);
                  if (v === '__none__') setMinSkillLevel('');
                }}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">{t('wiki.editor.skillLevelTypeNone')}</SelectItem>
                  {SKILL_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {t(`wiki.editor.skill_${type}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1.5">{t('wiki.editor.skillLevelTypeHint')}</p>
            </div>

            <div>
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {t('wiki.editor.minSkillLevel')}
              </Label>
              <Select
                value={minSkillLevel || '__none__'}
                onValueChange={(v) => setMinSkillLevel(v === '__none__' ? '' : v)}
                disabled={!skillLevelType}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">{t('wiki.editor.minSkillLevelNone')}</SelectItem>
                  {LANGUAGE_LEVELS.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <div className="flex-1 min-h-[300px] mb-6">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">
            {t('wiki.editor.content')}
          </Label>
          <MarkdownEditor
            content={initialContent}
            editable={true}
            onUpdate={(val) => {
              contentRef.current = val;
            }}
            className="min-h-[300px]"
          />
        </div>
      </div>

      <div className="flex justify-between items-center shrink-0 gap-3">
        {page && (onTogglePublish || onPublishForAll || onUnpublishForAll || onDelete) && (
          <div className="flex gap-2 flex-wrap">
            {onTogglePublish && (!isShadowGuild || isModerator) && (
              <Button variant="outline" onClick={onTogglePublish} className="px-3">
                {publicityLevel === 'guild' ? <Lock size={15} /> : <Users size={15} />}
                {publicityLevel === 'guild' ? t('wiki.page.unpublishFromGuild') : t('wiki.page.publishInGuild')}
              </Button>
            )}
            {onPublishForAll && publicityLevel !== 'lang' && (
              <Button variant="outline" onClick={onPublishForAll} className="px-3">
                <Globe size={15} />
                {t('wiki.page.publishForAll')}
              </Button>
            )}
            {onUnpublishForAll && publicityLevel === 'lang' && (
              <Button variant="outline" onClick={onUnpublishForAll} className="px-3">
                <Lock size={15} />
                {t('wiki.page.unpublishForAll')}
              </Button>
            )}
            {onDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="px-3 text-destructive hover:text-destructive">
                    <Trash2 size={15} />
                    {t('wiki.page.delete')}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t('wiki.page.delete')}</AlertDialogTitle>
                    <AlertDialogDescription>{t('wiki.page.confirmDelete')}</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t('wiki.page.cancel')}</AlertDialogCancel>
                    <AlertDialogAction onClick={onDelete}>{t('wiki.page.delete')}</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        )}
        <div className="flex gap-3 ml-auto">
          <Button variant="outline" onClick={onCancel} className="px-6">
            {t('wiki.page.cancel')}
          </Button>
          <Button
            onClick={() => void handleSave()}
            disabled={!title.trim()}
            className="px-6 bg-gray-900 text-white hover:bg-gray-700 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white"
          >
            {t('wiki.page.save')}
          </Button>
        </div>
      </div>
    </div>
  );
};
