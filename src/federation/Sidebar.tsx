import { lazy, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { injectFederationCss } from '@rimori/react-client';
import cssText from '../federation.css?inline';

const WikiPage = lazy(() => import('../pages/wiki/WikiPage'));
const queryClient = new QueryClient();

injectFederationCss('rimori-plugin-wiki', cssText);

export default function SidebarFederated({ actionKey }: { actionKey: string }) {
  if (actionKey !== 'browse') return null;

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Suspense fallback={null}>
          <div className="@container">
            <MemoryRouter initialEntries={['/wiki']}>
              <Routes>
                <Route path="/wiki" element={<WikiPage />} />
                <Route path="/wiki/:pageId" element={<WikiPage />} />
              </Routes>
            </MemoryRouter>
          </div>
        </Suspense>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
