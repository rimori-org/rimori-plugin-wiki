import { RimoriClient, setupWorker } from '@rimori/client';
import initExercisesListener from './listeners/exercises';
import initPagesListener from './listeners/pages';
import initPageSearchListener from './listeners/page-search';

setupWorker('pl1410555270', async (client: RimoriClient) => {
  initExercisesListener(client);
  initPagesListener(client);
  initPageSearchListener(client);
  await client.plugin.setSettings({ is_inited: true });
});
