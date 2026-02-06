import { RimoriClient, setupWorker } from '@rimori/client';
import initExercisesListener from './listeners/exercises';

setupWorker('pl1410555270', async (client: RimoriClient) => {
  initExercisesListener(client);
});
