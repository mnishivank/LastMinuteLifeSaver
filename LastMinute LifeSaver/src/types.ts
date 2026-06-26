export type Status = "pending" | "in-progress" | "completed" | "paused";

export interface Task {
  id: string;
  title: string;
  description: string;
  deadline: string; // ISO String
  estimatedTime: number; // in hours
  status: Status;
  progress: number;
  startedAt?: string; // ISO String for when it was marked in-progress
  timeElapsed?: number; // seconds elapsed so far
  completedAt?: string; // ISO String for when it was completed
}

export interface Goal {
  id: string;
  title: string;
  targetDate: string;
  completionPercentage: number;
  streak: number;
}

export interface Habit {
  id: string;
  title: string;
  frequency: "daily" | "weekly";
  streak: number;
}

export interface AiTaskInsight {
  insight: string;
  recommendation: string;
  focusArea: string;
}

export interface AiSubtask {
  title: string;
  duration: string;
  description: string;
}

export interface AiScheduleItem {
  timeBlock: string;
  taskTitle: string;
  reason: string;
}
