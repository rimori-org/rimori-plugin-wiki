import { RimoriClient } from '@rimori/client';

export interface SearchPagesParams {
  query: string;
  limit?: number;
}

export interface SearchPagesResponse {
  pages: Array<{
    id: string;
    title: string;
    description: string | null;
    similarity: number;
  }>;
}

export default function initPageSearchListener(client: RimoriClient) {
  client.event.respond<SearchPagesParams>(
    ['self.pages.requestSearch', 'pl1410555270.pages.requestSearch'],
    async ({ data }): Promise<SearchPagesResponse> => {
      if (!data?.query) {
        return { pages: [] };
      }

      try {
        const results = await client.db.vectorSearch<{
          id: string;
          title: string;
          description: string | null;
        }>({
          tableName: 'pages',
          query: data.query,
          limit: data.limit ?? 3,
          threshold: 0.4,
          selectColumns: ['id', 'title', 'description'],
        });

        return {
          pages: results.map((r) => ({
            id: r.id,
            title: r.title,
            description: r.description,
            similarity: r.similarity,
          })),
        };
      } catch (error) {
        console.error('Wiki page search failed:', error);
        return { pages: [] };
      }
    },
  );
}
