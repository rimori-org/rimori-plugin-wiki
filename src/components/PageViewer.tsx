import { WikiPage } from '../types/wiki';
import { Button } from '@/components/ui/button';
import { CommentsSection } from './CommentsSection';
import { Edit } from 'lucide-react';
import { MarkdownEditor, useTranslation } from '@rimori/react-client';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Fragment } from 'react';

interface PageViewerProps {
  page: WikiPage;
  breadcrumb: WikiPage[];
  children: WikiPage[];
  onEdit: () => void;
  onNavigate: (pageId: string) => void;
  isOwner: boolean;
  showComments?: boolean;
  mobileMode?: boolean;
}

export const PageViewer = ({
  page,
  breadcrumb,
  children,
  onEdit,
  onNavigate,
  isOwner,
  showComments = true,
  mobileMode = false,
}: PageViewerProps) => {
  const { t } = useTranslation();
  const isPrivate = !page.guild_id;
  const displayTitle = isPrivate ? page.title : t(page.title);
  const displayDescription = page.description && (isPrivate ? page.description : t(page.description));
  const displayContent = isPrivate ? page.content || '' : t(page.content || '');

  return (
    <div className="relative flex flex-col h-full overflow-y-auto p-2 md:p-3">
      {mobileMode && isOwner && (
        <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-8 w-8 z-10" onClick={onEdit}>
          <Edit size={16} />
        </Button>
      )}

      {!mobileMode && breadcrumb.length > 1 && (
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

      {!mobileMode && (
        <div className="flex flex-col mb-3 mr-8">
          <div className="flex items-center justify-between">
            <h1 className="flex-1 text-4xl font-bold tracking-tight flex items-center gap-3">
              {page.icon && <span className="text-4xl">{page.icon}</span>}
              {displayTitle}
            </h1>
            {isOwner && (
              <Button variant="ghost" className="h-8 rounded-lg px-2 shrink-0" onClick={onEdit}>
                <Edit size={15} />
                {t('wiki.sidebar.edit')}
              </Button>
            )}
          </div>
          {page.description && (
            <p className="text-muted-foreground mt-2 text-base leading-relaxed">{displayDescription}</p>
          )}
        </div>
      )}

      <div className="flex-1 px-1">
        <MarkdownEditor key={page.id} content={displayContent} editable={false} className="min-h-[200px]" />
      </div>

      {children.length > 0 && (
        <div className="mt-6 pt-4">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
            {t('wiki.page.subpages')}
          </h3>
          <div className="grid gap-2">
            {children.map((child) => (
              <button
                key={child.id}
                onClick={() => onNavigate(child.id)}
                className="flex items-center gap-2.5 text-sm px-3 py-2.5 rounded-lg border border-gray-600 hover:bg-accent hover:border-accent transition-colors duration-150 text-left"
              >
                <span className="text-lg">{child.icon || '📄'}</span>
                <span className="font-medium">{child.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {showComments && <CommentsSection pageId={page.id} />}
    </div>
  );
};
