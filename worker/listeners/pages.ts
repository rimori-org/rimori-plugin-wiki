import { RimoriClient } from '@rimori/client';

export interface CreatePageParams {
  title: string;
  content: string;
  description?: string;
  icon?: string;
  /** Find or create a root page by this title (e.g. "Grammar tips") */
  parent_title?: string;
  /** Direct parent page ID (takes priority over parent_title) */
  parent_id?: string;
}

export interface CreatePageResponse {
  page: { id: string; title: string; parent_id: string | null } | null;
  error?: string;
}

export interface AppendSectionParams {
  pageId: string;
  title: string;
  content: string;
}

export interface AppendSectionResponse {
  success: boolean;
  error?: string;
}

export default function initPagesListener(client: RimoriClient) {
  client.event.respond<AppendSectionParams>(
    ['self.pages.requestAppendSection', 'pl1410555270.pages.requestAppendSection'],
    async ({ data }): Promise<AppendSectionResponse> => {
      if (!data?.pageId || !data?.title || !data?.content) {
        return { success: false, error: 'pageId, title and content are required' };
      }

      try {
        const { data: page, error: fetchError } = await client.db
          .from<{ id: string; content: string | null }>('pages')
          .select('id, content')
          .eq('id', data.pageId)
          .single();

        if (fetchError || !page) {
          return { success: false, error: `Failed to fetch page: ${fetchError?.message}` };
        }

        const newSection = `\n\n---\n\n## ${data.title}\n\n${data.content}`;
        const updatedContent = (page.content || '') + newSection;

        const { error: updateError } = await client.db
          .from('pages')
          .update({ content: updatedContent })
          .eq('id', data.pageId);

        if (updateError) {
          return { success: false, error: `Failed to update page: ${updateError.message}` };
        }

        return { success: true };
      } catch (error) {
        return { success: false, error: `Unexpected error: ${(error as Error).message}` };
      }
    },
  );

  client.event.respond<CreatePageParams>(
    ['self.pages.requestCreatePage', 'pl1410555270.pages.requestCreatePage'],
    async ({ data }): Promise<CreatePageResponse> => {
      if (!data?.title || !data?.content) {
        return { page: null, error: 'title and content are required' };
      }

      try {
        let parentId = data.parent_id || null;

        // If parent_title provided, find or create the root page
        if (data.parent_title && !parentId) {
          const { data: existingParents, error: findError } = await client.db
            .from<{ id: string; title: string; parent_id: string | null }>('pages')
            .select('id')
            .eq('title', data.parent_title)
            .is('parent_id', null)
            .is('guild_id', null)
            .limit(1);

          if (findError) {
            return { page: null, error: `Failed to find parent: ${findError.message}` };
          }

          if (existingParents && existingParents.length > 0) {
            parentId = existingParents[0].id;
          } else {
            // Create the root page
            const { data: newParent, error: createError } = await client.db
              .from<{ id: string; title: string }>('pages')
              .insert({
                title: data.parent_title,
                icon: '📚',
                content: null,
                description: null,
              })
              .select('id')
              .single();

            if (createError || !newParent) {
              return { page: null, error: `Failed to create parent page: ${createError?.message}` };
            }

            parentId = newParent.id;
          }
        }

        // Create the page
        const { data: newPage, error: insertError } = await client.db
          .from<{ id: string; title: string; parent_id: string | null }>('pages')
          .insert({
            title: data.title,
            content: data.content,
            description: data.description || null,
            icon: data.icon || '💡',
            parent_id: parentId,
          })
          .select('id, title, parent_id')
          .single();

        if (insertError || !newPage) {
          return { page: null, error: `Failed to create page: ${insertError?.message}` };
        }

        return { page: newPage };
      } catch (error) {
        return { page: null, error: `Unexpected error: ${(error as Error).message}` };
      }
    },
  );
}
