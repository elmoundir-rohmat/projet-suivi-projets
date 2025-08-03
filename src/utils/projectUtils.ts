import { Project, Milestone, Task, Alert } from '../types';

// Jalons types par défaut selon la nature du projet
const DEFAULT_MILESTONES = [
  { name: 'Étude de marché', percentage: 20 },
  { name: 'Conception MVP', percentage: 25 },
  { name: 'Développement', percentage: 30 },
  { name: 'Tests utilisateurs', percentage: 15 },
  { name: 'Lancement', percentage: 10 }
];

export const generateMilestones = (project: Project): Milestone[] => {
  const milestones: Milestone[] = [];
  let currentDate = new Date();
  
  DEFAULT_MILESTONES.forEach((template, index) => {
    const duration = Math.ceil((project.estimatedDuration * template.percentage) / 100);
    const milestone: Milestone = {
      id: `milestone-${project.id}-${index}`,
      projectId: project.id,
      name: template.name,
      description: `Phase ${index + 1} du projet ${project.name}`,
      estimatedDuration: duration,
      tasks: generateTasksForMilestone(`milestone-${project.id}-${index}`, duration, currentDate),
      status: index === 0 ? 'active' : 'pending',
      order: index
    };
    
    milestones.push(milestone);
    currentDate = new Date(currentDate.getTime() + duration * 24 * 60 * 60 * 1000);
  });
  
  return milestones;
};

export const generateTasksForMilestone = (milestoneId: string, duration: number, startDate: Date): Task[] => {
  const tasks: Task[] = [];
  
  for (let i = 0; i < duration; i++) {
    const taskDate = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
    const task: Task = {
      id: `task-${milestoneId}-${i}`,
      milestoneId,
      description: `Tâche jour ${i + 1}`,
      plannedDate: taskDate,
      status: 'pending',
      isOverdue: taskDate < new Date() && taskDate.toDateString() !== new Date().toDateString()
    };
    tasks.push(task);
  }
  
  return tasks;
};

export const calculateProjectProgress = (project: Project): number => {
  const totalTasks = project.milestones.reduce((acc, m) => acc + m.tasks.length, 0);
  const completedTasks = project.milestones.reduce(
    (acc, m) => acc + m.tasks.filter(t => t.status === 'completed').length, 
    0
  );
  return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
};

export const calculateMilestoneProgress = (milestone: Milestone): number => {
  const totalTasks = milestone.tasks.length;
  const completedTasks = milestone.tasks.filter(t => t.status === 'completed').length;
  return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
};

export const getOverdueTasks = (projects: Project[]): Task[] => {
  const overdueTasks: Task[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  projects.forEach(project => {
    project.milestones.forEach(milestone => {
      milestone.tasks.forEach(task => {
        const taskDate = new Date(task.plannedDate);
        taskDate.setHours(0, 0, 0, 0);
        if (taskDate < today && task.status === 'pending') {
          overdueTasks.push({ ...task, isOverdue: true });
        }
      });
    });
  });
  
  return overdueTasks;
};

export const generateAlerts = (projects: Project[]): Alert[] => {
  const alerts: Alert[] = [];
  const overdueTasks = getOverdueTasks(projects);
  
  // Alertes pour tâches en retard
  overdueTasks.forEach(task => {
    const project = projects.find(p => 
      p.milestones.some(m => m.id === task.milestoneId)
    );
    
    if (project) {
      alerts.push({
        id: `alert-${task.id}`,
        type: 'delay',
        severity: 'medium',
        message: `Tâche en retard dans le projet "${project.name}"`,
        projectId: project.id,
        taskId: task.id,
        createdAt: new Date(),
        acknowledged: false
      });
    }
  });

  // Alertes pour jalons qui approchent de leur deadline
  projects.forEach(project => {
    project.milestones.forEach(milestone => {
      if (milestone.status === 'active') {
        const pendingTasks = milestone.tasks.filter(t => t.status === 'pending');
        const totalTasks = milestone.tasks.length;
        const completedTasks = totalTasks - pendingTasks.length;
        const progress = (completedTasks / totalTasks) * 100;
        
        // Alerte si le jalon est à moins de 20% de progression et qu'il y a des tâches en retard
        if (progress < 20 && pendingTasks.some(t => t.isOverdue)) {
          alerts.push({
            id: `alert-milestone-${milestone.id}`,
            type: 'milestone',
            severity: 'high',
            message: `Jalon "${milestone.name}" en retard dans le projet "${project.name}"`,
            projectId: project.id,
            milestoneId: milestone.id,
            createdAt: new Date(),
            acknowledged: false
          });
        }
      }
    });
  });

  // Alertes pour décisions Go/No-Go en attente
  projects.forEach(project => {
    project.milestones.forEach(milestone => {
      if (milestone.status === 'active' && milestone.goNoGoDecision?.decision === 'undecided') {
        alerts.push({
          id: `alert-decision-${milestone.id}`,
          type: 'decision',
          severity: 'medium',
          message: `Décision Go/No-Go en attente pour le jalon "${milestone.name}"`,
          projectId: project.id,
          milestoneId: milestone.id,
          createdAt: new Date(),
          acknowledged: false
        });
      }
    });
  });
  
  return alerts;
};

export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(date);
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'completed': return 'text-green-600 bg-green-100';
    case 'active': return 'text-blue-600 bg-blue-100';
    case 'draft': return 'text-gray-600 bg-gray-100';
    case 'pending': return 'text-gray-600 bg-gray-100';
    case 'paused': return 'text-orange-600 bg-orange-100';
    default: return 'text-gray-600 bg-gray-100';
  }
};

export const getPriorityColor = (priority: string): string => {
  switch (priority) {
    case 'high': return 'text-red-600 bg-red-100';
    case 'medium': return 'text-orange-600 bg-orange-100';
    case 'low': return 'text-green-600 bg-green-100';
    default: return 'text-gray-600 bg-gray-100';
  }
};

// Fonction de validation des données de projet
export const validateProject = (project: Partial<Project>): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Validation du nom (si présent)
  if (project.name !== undefined && (!project.name || project.name.trim().length === 0)) {
    errors.push('Le nom du projet est requis');
  }
  
  // Validation de l'objectif (si présent)
  if (project.objective !== undefined && (!project.objective || project.objective.trim().length === 0)) {
    errors.push('L\'objectif du projet est requis');
  }
  
  // Validation de la description (si présente)
  if (project.description !== undefined && (!project.description || project.description.trim().length === 0)) {
    errors.push('La description du projet est requise');
  }
  
  // Validation de la durée estimée (si présente)
  if (project.estimatedDuration !== undefined && (!project.estimatedDuration || project.estimatedDuration <= 0)) {
    errors.push('La durée estimée doit être supérieure à 0');
  }
  
  // Validation de la priorité (si présente)
  if (project.priority !== undefined && (!project.priority || !['low', 'medium', 'high'].includes(project.priority))) {
    errors.push('La priorité doit être low, medium ou high');
  }
  
  // Validation du statut (si présent)
  if (project.status !== undefined && (!project.status || !['draft', 'active', 'completed', 'paused'].includes(project.status))) {
    errors.push('Le statut doit être draft, active, completed ou paused');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Fonction pour nettoyer les données avant sauvegarde
export const sanitizeProjectData = (project: Project): Project => {
  return {
    ...project,
    name: project.name.trim(),
    objective: project.objective.trim(),
    description: project.description.trim(),
    milestones: project.milestones.map(milestone => ({
      ...milestone,
      name: milestone.name.trim(),
      description: milestone.description?.trim() || '',
      tasks: milestone.tasks.map(task => ({
        ...task,
        description: task.description.trim()
      }))
    }))
  };
};