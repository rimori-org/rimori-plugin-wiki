import { lazy, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { injectFederationCss } from '@rimori/react-client';
import cssText from '../federation.css?inline';

const WikiPage = lazy(() => import('../pages/wiki/WikiPage'));
const NotFoundPage = lazy(() => import('../pages/NotFound'));

const queryClient = new QueryClient();

injectFederationCss('rimori-plugin-wiki', cssText);

export default function MainPanelFederated() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <div className="text-gray-900 dark:text-gray-200">
          <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Suspense fallback={null}>
              <Routes>
                <Route path="/wiki" element={<WikiPage />} />
                <Route path="/wiki/action" element={<WikiPage />} />
                <Route path="/wiki/:pageId" element={<WikiPage />} />
                <Route path="/wiki/:pageId/edit" element={<WikiPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
          </HashRouter>
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
