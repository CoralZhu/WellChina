import { generateCarePreparation } from './carePreparationGenerator';
import { isSupabaseEnabled, supabase } from './supabase';
import type { CarePreparationInput, CarePreparationResult } from '../types/workflow';

type CarePlanSource = 'claude' | 'mock';

type CarePlanResponse = {
  result: CarePreparationResult;
  source: CarePlanSource;
};

export async function generateCarePlan(
  input: CarePreparationInput,
): Promise<CarePlanResponse> {
  if (isSupabaseEnabled() && supabase) {
    try {
      const { data, error } = await supabase.functions.invoke('care-plan', {
        body: input,
      });

      if (!error && data) {
        return {
          result: data as CarePreparationResult,
          source: 'claude',
        };
      }

      if (error) {
        console.error('Failed to generate care plan with Claude:', error);
      }
    } catch (error) {
      console.error('Failed to generate care plan with Claude:', error);
    }
  }

  return {
    result: generateCarePreparation(input),
    source: 'mock',
  };
}
