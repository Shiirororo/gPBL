export type ChallengeDifficulty = "easy" | "medium" | "hard";

export interface Challenge {
  challenge_id: number;
  title: string;
  description: string;
  difficulty: ChallengeDifficulty;
  hint: string | null;
  starter_code: string | null;
  score: number;
  categories: string[] | null;
  learning_status: string | null;
  example_of_correct_code: string | null;
  acceptance_rate: string;
  passed_testcases: number;
  total_testcases: number;
  completion_rate: number;
}

export interface ChallengeApiError {
  error?: string;
  detail?: string;
}
