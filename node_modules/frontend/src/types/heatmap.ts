export interface HeatmapDay {
  date: string; // YYYY-MM-DD
  score: number; // 0-100
}

export interface DayDetailsMood {
  mood_score: number;
  note?: string | null;
}

export interface DayDetailsJournal {
  title?: string | null;
  content: string;
}

export interface DayDetailsCBT {
  trigger_event?: string | null;
  rational_thought?: string | null;
  alternative_thought?: string | null;
}

export interface DayDetailsPHQ9 {
  score: number;
  risk_category: string;
}

export interface DayDetailsGAD7 {
  score: number;
  anxiety_level: string;
}

export interface DayDetails {
  date: string;
  mood: DayDetailsMood | null;
  journals: DayDetailsJournal[];
  cbt_worksheets: DayDetailsCBT[];
  phq9: DayDetailsPHQ9 | null;
  gad7: DayDetailsGAD7 | null;
  habit_completions: Record<string, unknown>[];
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
