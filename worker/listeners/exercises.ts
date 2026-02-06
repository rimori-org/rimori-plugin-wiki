import { RimoriClient } from '@rimori/client';
import { ExerciseTemplate } from '../../src/types/exercises';

export interface GetExercisesParams {
  limit?: number;
  topic?: string;
}

export interface ExerciseWithShortId {
  id: string; // last 8 characters of UUID
  uuid: string; // original UUID
  title: string;
  keywords: string[];
  description: string;
  grammar_level: string;
  exercise_type: string;
  content_status: string;
  created_at: string;
}

export interface GetExercisesResponse {
  exercises: ExerciseWithShortId[];
}

/**
 * Extracts the last 8 characters of a UUID as a short identifier.
 */
function getShortId(uuid: string): string {
  return uuid.slice(-8);
}

export default function initExercisesListener(client: RimoriClient) {
  client.event.respond<GetExercisesParams>(
    ['grammar.requestExercises', 'self.grammar.requestExercises'],
    async ({ data }) => {
      const { limit = 10, topic } = data || {};

      // console.log('requesting exercises', data);

      let exercises: ExerciseTemplate[];

      if (topic) {
        // Use semantic similarity search when topic is provided
        exercises = await client.sharedContent.searchByTopic<ExerciseTemplate>(
          'exercise_templates',
          topic,
          limit
        );
      } else {
        // Fetch all exercises without topic filtering
        exercises = await client.sharedContent.getAll<ExerciseTemplate>(
          'exercise_templates',
          limit
        );
      }

      // Sort exercises by created_at ascending (oldest first)
      const sortedExercises = [...exercises].sort((a, b) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return dateA - dateB;
      });

      return {
        exercises: sortedExercises.map(exercise => {
          return {
            id: getShortId(exercise.id),
            uuid: exercise.id,
            title: exercise.title,
            keywords: exercise.keywords,
            description: exercise.description,
            grammar_level: exercise.grammar_level,
            exercise_type: exercise.exercise_type,
            content_status: exercise.content_status,
            created_at: exercise.created_at,
          };
        })
      }
    }
  );
}
