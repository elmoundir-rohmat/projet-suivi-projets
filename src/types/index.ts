export interface Project {
  id: string;
  name: string;
  objective: string;
  description: string;
  estimatedDuration: number; // en jours
  milestones: Milestone[];
  status: 'draft' | 'active' | 'completed' | 'paused';
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  updatedAt: Date;
}

export interface Milestone {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  estimatedDuration: number; // en jours
  tasks: Task[];
  status: 'pending' | 'active' | 'completed';
  goNoGoDecision?: GoNoGoDecision;
  order: number;
}

export interface Task {
  id: string;
  milestoneId: string;
  description: string;
  plannedDate: Date;
  completedDate?: Date;
  status: 'pending' | 'completed';
  isOverdue: boolean;
}

export interface GoNoGoDecision {
  decision: 'go' | 'no-go' | 'undecided';
  criteria: string[];
  notes: string;
  completionPercentage: number;
  decidedAt: Date;
}

export interface Alert {
  id: string;
  type: 'delay' | 'milestone' | 'decision';
  severity: 'low' | 'medium' | 'high';
  message: string;
  projectId: string;
  milestoneId?: string;
  taskId?: string;
  createdAt: Date;
  acknowledged: boolean;
}

export type ViewMode = 'dashboard' | 'project-detail' | 'timeline' | 'calendar';