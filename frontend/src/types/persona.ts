export interface Persona {
  id: string;
  name: string;
  title: string;
  avatar: string;
  color: string;
  description: string;
  prompt: string;
}

export interface PHQ9Assessment {
  id: string;
  user_id: string;
  score: number;
  risk_category: string;
  answers: number[];
  ai_explanation: string;
  created_at: string;
}

export interface GAD7Assessment {
  id: string;
  user_id: string;
  score: number;
  anxiety_level: string;
  answers: number[];
  ai_explanation: string;
  created_at: string;
}

export interface AIMemory {
  id: string;
  user_id: string;
  category: "goal" | "mood_pattern" | "journal_insight" | "habit" | "assessment" | "therapist_pref" | "coping_technique";
  memory_text: string;
  weight: number;
  updated_at: string;
}

export interface TimelineItem {
  id: string;
  type: "chat" | "mood" | "journal" | "assessment" | "cbt" | "insight";
  title: string;
  content: string;
  category: string;
  timestamp: string;
  meta?: Record<string, any>;
}

export interface PersonalizedInsight {
  id: string;
  type: "correlation" | "habit" | "wellness" | "clinical";
  icon: string;
  title: string;
  description: string;
  recommendation: string;
}

export interface WellnessScoreBreakdown {
  mood: number;
  sleep: number;
  stress: number;
  journal: number;
  habits: number;
  meditation: number;
}

export interface WellnessScore {
  id: string;
  user_id: string;
  total_score: number;
  breakdown: WellnessScoreBreakdown;
  created_at: string;
}
