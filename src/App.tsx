import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { PluginProvider } from '@rimori/react-client';
import { lazy } from 'react';

const queryClient = new QueryClient();

const WikiPage = lazy(() => import('./pages/wiki/WikiPage'));
const BrowseSidebar = lazy(() => import('./pages/sidebar/BrowseSidebar'));
const SettingsPage = lazy(() => import('./pages/settings/SettingsPage'));
const NotFoundPage = lazy(() => import('./pages/NotFound'));

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <PluginProvider pluginId="pl1410555270">
        <div className="text-gray-900 dark:text-gray-200 min-h-[550px]">
          <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
              <Route path="/wiki" element={<WikiPage />} />
              <Route path="/wiki/action" element={<WikiPage />} />
              <Route path="/wiki/:pageId" element={<WikiPage />} />
              <Route path="/wiki/:pageId/edit" element={<WikiPage />} />
              <Route path="/sidebar/browse" element={<BrowseSidebar />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </HashRouter>
        </div>
      </PluginProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
