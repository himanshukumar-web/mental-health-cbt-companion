export interface HeatmapDay {
  date: string; // YYYY-MM-DD
  score: number; // 0-100
}

export interface DayDetails {
  date: string;
  mood: any | null;
  journals: any[];
  cbt_worksheets: any[];
  phq9: any | null;
  gad7: any | null;
  habit_completions: any[];
  summary: string;
}

export interface DailyChallenge {
  id: string;
  user_id: string;
  title: string;
  target: number;
  current: number;
  reward_xp: number;
  date: string;
  completed: boolean;
}

export interface UserStreak {
  current_streak: number;
  longest_streak: number;
  last_activity_date: string;
}

export type ExportCategory = "all" | "timeline" | "mood" | "journal" | "assessments" | "report";
export type ExportFormat = "pdf" | "csv" | "json";
