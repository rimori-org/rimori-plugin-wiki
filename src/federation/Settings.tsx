import { lazy, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { injectFederationCss } from '@rimori/react-client';
import cssText from '../federation.css?inline';

const SettingsPage = lazy(() => import('../pages/settings/SettingsPage'));
const queryClient = new QueryClient();

injectFederationCss('rimori-plugin-wiki', cssText);

export default function WikiSettingsFederated() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="overflow-y-hidden">
          <h1 className="text-2xl md:text-3xl font-bold pb-3">Wiki Settings</h1>
          <Suspense fallback={null}>
            <div className="@container">
              <SettingsPage />
            </div>
          </Suspense>
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
