import { useState, useRef } from 'react';
import { useTranslation } from '@rimori/react-client';
import { WikiPage } from '../types/wiki';
import { MarkdownEditor } from './MarkdownEditor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
    show_children: boolean;
    action_label: string | null;
  }) => void;
  onCancel: () => void;
}

export const PageEditor = ({ page, allPages, initialParentId, onSave, onCancel }: PageEditorProps) => {
  const { t } = useTranslation();
  const [title, setTitle] = useState(page?.title || '');
  const [description, setDescription] = useState(page?.description || '');
  const [icon, setIcon] = useState(page?.icon || '');
  const contentRef = useRef(page?.content || '');
  const [parentId, setParentId] = useState<string | null>(page?.parent_id ?? initialParentId ?? null);
  const [showChildren, setShowChildren] = useState(page?.show_children || false);
  const [actionLabel, setActionLabel] = useState(page?.action_label || '');

  const availableParents = allPages.filter((p) => p.id !== page?.id);

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      content: contentRef.current,
      description: description.trim(),
      icon: icon.trim(),
      parent_id: parentId,
      show_children: showChildren,
      action_label: actionLabel.trim() || null,
    });
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight">
          {page ? t('wiki.editor.editPage') : t('wiki.editor.newPage')}
        </h2>
      </div>

      <div className="space-y-5 mb-6">
        <div className="flex gap-3 mr-12">
          <div className="w-24">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {t('wiki.editor.icon')}
            </Label>
            <Select value={icon || '📄'} onValueChange={setIcon}>
              <SelectTrigger className="text-center text-xl h-12 mt-1.5">
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
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('wiki.page.titlePlaceholder')}
              className="text-lg h-12 mt-1.5 font-medium"
            />
          </div>
        </div>

        <div className="mr-12">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {t('wiki.editor.description')}
          </Label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('wiki.page.descriptionPlaceholder')}
            className="mt-1.5"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
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
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {t('wiki.editor.actionLabel')}
            </Label>
            <Input
              value={actionLabel}
              onChange={(e) => setActionLabel(e.target.value)}
              placeholder={t('wiki.editor.actionLabelPlaceholder')}
              className="mt-1.5"
            />
            <p className="text-xs text-muted-foreground mt-1">{t('wiki.editor.actionLabelHint')}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
          <Switch checked={showChildren} onCheckedChange={setShowChildren} id="show-children" />
          <Label htmlFor="show-children" className="text-sm cursor-pointer">
            {t('wiki.editor.showChildren')}
          </Label>
        </div>
      </div>

      <div className="flex-1 minddddd-h-[300px] mb-6">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">
          {t('wiki.editor.content')}
        </Label>
        <MarkdownEditor
          content={contentRef.current}
          editable={true}
          onUpdate={(val) => {
            contentRef.current = val;
          }}
          className="min-h-[300px]"
        />
      </div>

      <div className="flex justify-center gap-3">
        <Button variant="outline" onClick={onCancel} className="px-6">
          {t('wiki.page.cancel')}
        </Button>
        <Button onClick={handleSave} disabled={!title.trim()} className="px-6">
          {t('wiki.page.save')}
        </Button>
      </div>
    </div>
  );
};
