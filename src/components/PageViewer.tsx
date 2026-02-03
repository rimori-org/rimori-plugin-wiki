import { Edit, Trash2, Globe, Lock } from 'lucide-react';
import { useTranslation } from '@rimori/react-client';
import { WikiPage } from '../types/wiki';
import { MarkdownEditor } from './MarkdownEditor';
import { CommentsSection } from './CommentsSection';
import { Button } from '@/components/ui/button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
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
import { Fragment } from 'react';

interface PageViewerProps {
  page: WikiPage;
  breadcrumb: WikiPage[];
  children: WikiPage[];
  onEdit: () => void;
  onDelete: () => void;
  onTogglePublish: () => void;
  onNavigate: (pageId: string) => void;
  isOwner: boolean;
}

export const PageViewer = ({
  page,
  breadcrumb,
  children,
  onEdit,
  onDelete,
  onTogglePublish,
  onNavigate,
  isOwner,
}: PageViewerProps) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col h-full overflow-y-auto p-6">
      {breadcrumb.length > 1 && (
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            {breadcrumb.map((crumb, idx) => (
              <Fragment key={crumb.id}>
                {idx > 0 && <BreadcrumbSeparator />}
                <BreadcrumbItem>
                  <BreadcrumbLink
                    className="cursor-pointer hover:text-primary transition-colors"
                    onClick={() => onNavigate(crumb.id)}
                  >
                    {crumb.icon && <span className="mr-1">{crumb.icon}</span>}
                    {crumb.title}
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      )}

      <div className="flex flex-col items-start justify-between mb-3 mr-8">
        <div className="flex-1 min-w-0">
          <h1 className="flex-1 text-4xl font-bold tracking-tight flex items-center gap-3">
            {page.icon && <span className="text-4xl">{page.icon}</span>}
            {page.title}
          </h1>
          {page.description && (
            <p className="text-muted-foreground mt-2 text-base leading-relaxed">{page.description}</p>
          )}
        </div>
        {isOwner && (
          <div className="flex items-center gap-0.5 shrink-0 mt-1">
            <Button variant="ghost" className="h-8 rounded-lg px-1" onClick={onEdit}>
              <Edit size={15} />
              Edit
            </Button>
            <Button variant="ghost" className="h-8 rounded-lg px-1" onClick={onTogglePublish}>
              {page.guild_id ? <Globe size={15} /> : <Lock size={15} />}
              {page.guild_id ? 'Publish' : 'Unpublish'}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" className="h-8 rounded-lg px-1">
                  <Trash2 size={15} />
                  Delete
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
          </div>
        )}
        {page.action_label && (
          <span className="inline-flex items-center text-xs px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-medium">
            {page.action_label}
          </span>
        )}
      </div>

      <div className="flex-1 px-1">
        <MarkdownEditor key={page.id} content={page.content || ''} editable={false} className="min-h-[200px]" />
      </div>

      {page.show_children && children.length > 0 && (
        <div className="mt-6 pt-4">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
            {t('wiki.page.subpages')}
          </h3>
          <div className="grid gap-2">
            {children.map((child) => (
              <button
                key={child.id}
                onClick={() => onNavigate(child.id)}
                className="flex items-center gap-2.5 text-sm px-3 py-2.5 rounded-lg border border-border hover:bg-accent hover:border-accent transition-colors duration-150 text-left"
              >
                <span className="text-lg">{child.icon || '📄'}</span>
                <span className="font-medium">{child.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <CommentsSection pageId={page.id} />
    </div>
  );
};
