import { useRef, useState } from 'react';
import { useTranslation } from '@rimori/react-client';
import { Markdown } from 'tiptap-markdown';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import StarterKit from '@tiptap/starter-kit';
import { PiCodeBlock } from 'react-icons/pi';
import { TbBlockquote } from 'react-icons/tb';
import { GoListOrdered } from 'react-icons/go';
import { AiOutlineUnorderedList } from 'react-icons/ai';
import { EditorProvider, useCurrentEditor } from '@tiptap/react';
import { LuClipboardPaste, LuHeading1, LuHeading2, LuHeading3 } from 'react-icons/lu';
import { FaBold, FaCode, FaItalic, FaParagraph, FaStrikethrough } from 'react-icons/fa';
import { Level } from '@tiptap/extension-heading';

interface EditorButtonProps {
  action: string;
  isActive?: boolean;
  label: string | React.ReactNode;
  disabled?: boolean;
}

const EditorButton = ({ action, isActive, label, disabled }: EditorButtonProps): JSX.Element | null => {
  const { editor } = useCurrentEditor();

  if (!editor) {
    return null;
  }

  const baseClass =
    'w-8 h-8 flex items-center justify-center rounded-md transition-colors duration-150 ' +
    (isActive
      ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground'
      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground');

  if (action.toLowerCase().includes('heading')) {
    const level = parseInt(action[action.length - 1]);
    return (
      <button
        onClick={() =>
          editor
            .chain()
            .focus()
            .toggleHeading({ level: level as Level })
            .run()
        }
        className={baseClass}
      >
        {label}
      </button>
    );
  }

  return (
    <button
      onClick={() => editor.chain().focus()[action]().run()}
      disabled={disabled ? !editor.can().chain().focus()[action]().run() : false}
      className={baseClass}
    >
      {label}
    </button>
  );
};

const AppendMarkdownButton = (): JSX.Element | null => {
  const { editor } = useCurrentEditor();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');

  if (!editor) return null;

  const handleAppend = (): void => {
    if (!text.trim()) return;

    const currentMarkdown: string = editor.storage.markdown.getMarkdown();
    const combined = currentMarkdown + '\n\n' + text;
    editor.commands.setContent(combined);
    editor.commands.focus('end');
    setText('');
    setOpen(false);
  };

  const baseClass =
    'w-8 h-8 flex items-center justify-center rounded-md transition-colors duration-150 ' +
    'text-muted-foreground hover:bg-accent hover:text-accent-foreground';

  return (
    <>
      <button onClick={() => setOpen(true)} className={baseClass} title={t('wiki.editor.appendMarkdown')}>
        <LuClipboardPaste size={'18px'} />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('wiki.editor.appendMarkdownTitle')}</DialogTitle>
            <DialogDescription>{t('wiki.editor.appendMarkdownDescription')}</DialogDescription>
          </DialogHeader>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t('wiki.editor.appendMarkdownPlaceholder')}
            className="min-h-[200px] font-mono text-sm"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t('wiki.page.cancel')}
            </Button>
            <Button onClick={handleAppend} disabled={!text.trim()}>
              {t('wiki.editor.appendMarkdownConfirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

const MenuBar = (): JSX.Element | null => {
  const { editor } = useCurrentEditor();

  if (!editor) {
    return null;
  }

  return (
    <div className="bg-muted/50 border-b border-border text-base flex flex-row flex-wrap items-center gap-0.5 p-1.5">
      <EditorButton action="toggleBold" isActive={editor.isActive('bold')} label={<FaBold />} disabled />
      <EditorButton action="toggleItalic" isActive={editor.isActive('italic')} label={<FaItalic />} disabled />
      <EditorButton action="toggleStrike" isActive={editor.isActive('strike')} label={<FaStrikethrough />} disabled />
      <EditorButton action="toggleCode" isActive={editor.isActive('code')} label={<FaCode />} disabled />
      <EditorButton action="setParagraph" isActive={editor.isActive('paragraph')} label={<FaParagraph />} />
      <EditorButton
        action="setHeading1"
        isActive={editor.isActive('heading', { level: 1 })}
        label={<LuHeading1 size={'24px'} />}
      />
      <EditorButton
        action="setHeading2"
        isActive={editor.isActive('heading', { level: 2 })}
        label={<LuHeading2 size={'24px'} />}
      />
      <EditorButton
        action="setHeading3"
        isActive={editor.isActive('heading', { level: 3 })}
        label={<LuHeading3 size={'24px'} />}
      />
      <EditorButton
        action="toggleBulletList"
        isActive={editor.isActive('bulletList')}
        label={<AiOutlineUnorderedList size={'24px'} />}
      />
      <EditorButton
        action="toggleOrderedList"
        isActive={editor.isActive('orderedList')}
        label={<GoListOrdered size={'24px'} />}
      />
      <EditorButton
        action="toggleCodeBlock"
        isActive={editor.isActive('codeBlock')}
        label={<PiCodeBlock size={'24px'} />}
      />
      <EditorButton
        action="toggleBlockquote"
        isActive={editor.isActive('blockquote')}
        label={<TbBlockquote size={'24px'} />}
      />
      <div className="w-px h-5 bg-border mx-0.5" />
      <AppendMarkdownButton />
    </div>
  );
};

const extensions = [
  StarterKit.configure({
    bulletList: {
      HTMLAttributes: {
        class: 'list-disc list-inside dark:text-white p-1 mt-1 [&_li]:mb-1 [&_p]:inline m-0',
      },
    },
    orderedList: {
      HTMLAttributes: {
        className: 'list-decimal list-inside dark:text-white p-1 mt-1 [&_li]:mb-1 [&_p]:inline m-0',
      },
    },
  }),
  Markdown,
];

interface Props {
  content?: string;
  editable: boolean;
  className?: string;
  onUpdate?: (content: string) => void;
}

export const MarkdownEditor = (props: Props): JSX.Element => {
  const initialContentRef = useRef(props.content);

  return (
    <div
      className={
        'text-md overflow-hidden rounded-lg ' +
        (props.editable ? 'border border-border bg-card shadow-sm' : 'bg-transparent') +
        ' ' +
        (props.className || '')
      }
    >
      <EditorProvider
        key={props.editable ? 'editable' : 'readonly'}
        slotBefore={props.editable ? <MenuBar /> : null}
        extensions={extensions}
        content={initialContentRef.current}
        editable={props.editable}
        onUpdate={(e) => {
          if (props.onUpdate) props.onUpdate(e.editor.storage.markdown.getMarkdown());
        }}
      ></EditorProvider>
    </div>
  );
};
