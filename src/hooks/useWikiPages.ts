import { useState, useEffect, useCallback } from 'react';
import { useRimori } from '@rimori/react-client';
import { WikiPage, TreeNode } from '../types/wiki';

function buildTree(pages: WikiPage[], expandedIds: Set<string>): TreeNode[] {
  const map = new Map<string | null, WikiPage[]>();
  for (const page of pages) {
    const parentId = page.parent_id;
    if (!map.has(parentId)) map.set(parentId, []);
    map.get(parentId)!.push(page);
  }

  function buildNodes(parentId: string | null): TreeNode[] {
    const children = map.get(parentId) || [];
    children.sort((a, b) => a.sort_order - b.sort_order);
    return children.map((page) => ({
      page,
      children: buildNodes(page.id),
      expanded: expandedIds.has(page.id),
    }));
  }

  return buildNodes(null);
}

function getAncestorIds(pages: WikiPage[], pageId: string): string[] {
  const ancestors: string[] = [];
  const pageMap = new Map(pages.map((p) => [p.id, p]));
  let current = pageMap.get(pageId);
  while (current?.parent_id) {
    ancestors.push(current.parent_id);
    current = pageMap.get(current.parent_id);
  }
  return ancestors;
}

export function useWikiPages(mode: 'private' | 'public') {
  const plugin = useRimori();
  const [pages, setPages] = useState<WikiPage[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const fetchPages = useCallback(async () => {
    setLoading(true);
    let query = plugin.db.from('pages').select('*');
    if (mode === 'private') {
      // Private pages have guild_id set (scoped to user's personal guild)
      query = query.not('guild_id', 'is', null);
    } else {
      // Public pages have guild_id = null (visible to everyone)
      query = query.is('guild_id', null);
    }
    const { data, error } = await query.order('sort_order', { ascending: true });
    if (!error && data) {
      setPages(data as WikiPage[]);
    }
    setLoading(false);
  }, [plugin.db, mode]);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  const toggleExpanded = useCallback((pageId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(pageId)) {
        next.delete(pageId);
      } else {
        next.add(pageId);
      }
      return next;
    });
  }, []);

  const expandToPage = useCallback(
    (pageId: string) => {
      const ancestors = getAncestorIds(pages, pageId);
      setExpandedIds((prev) => {
        const next = new Set(prev);
        for (const id of ancestors) next.add(id);
        return next;
      });
    },
    [pages],
  );

  const tree = buildTree(pages, expandedIds);

  const getBreadcrumb = useCallback(
    (pageId: string): WikiPage[] => {
      const path: WikiPage[] = [];
      const pageMap = new Map(pages.map((p) => [p.id, p]));
      let current = pageMap.get(pageId);
      while (current) {
        path.unshift(current);
        current = current.parent_id ? pageMap.get(current.parent_id) : undefined;
      }
      return path;
    },
    [pages],
  );

  const getPage = useCallback(
    (pageId: string): WikiPage | undefined => {
      return pages.find((p) => p.id === pageId);
    },
    [pages],
  );

  const getChildren = useCallback(
    (pageId: string): WikiPage[] => {
      return pages.filter((p) => p.parent_id === pageId).sort((a, b) => a.sort_order - b.sort_order);
    },
    [pages],
  );

  return {
    pages,
    tree,
    loading,
    expandedIds,
    toggleExpanded,
    expandToPage,
    getBreadcrumb,
    getPage,
    getChildren,
    refetch: fetchPages,
  };
}
