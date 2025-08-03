import { useState, useEffect } from 'react';
import { Project, Alert } from '../types';
import { generateMilestones, generateAlerts, validateProject, sanitizeProjectData } from '../utils/projectUtils';

const STORAGE_KEY = 'personal-projects';

// Interfaces pour le parsing JSON
interface SavedProject extends Omit<Project, 'createdAt' | 'updatedAt' | 'milestones'> {
  createdAt: string;
  updatedAt: string;
  milestones: SavedMilestone[];
}

interface SavedMilestone extends Omit<Project['milestones'][0], 'tasks'> {
  tasks: SavedTask[];
}

interface SavedTask extends Omit<Project['milestones'][0]['tasks'][0], 'plannedDate' | 'completedDate'> {
  plannedDate: string;
  completedDate?: string;
}

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  // Charger les projets depuis le localStorage
  useEffect(() => {
    try {
      const savedProjects = localStorage.getItem(STORAGE_KEY);
      if (savedProjects) {
        const parsedProjects = JSON.parse(savedProjects) as SavedProject[];
        const convertedProjects: Project[] = parsedProjects.map((p: SavedProject) => ({
          ...p,
          createdAt: new Date(p.createdAt),
          updatedAt: new Date(p.updatedAt),
          milestones: p.milestones.map((m: SavedMilestone) => ({
            ...m,
            tasks: m.tasks.map((t: SavedTask) => ({
              ...t,
              plannedDate: new Date(t.plannedDate),
              completedDate: t.completedDate ? new Date(t.completedDate) : undefined
            }))
          }))
        }));
        setProjects(convertedProjects);
        setAlerts(generateAlerts(convertedProjects));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des projets:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Sauvegarder dans le localStorage à chaque modification
  useEffect(() => {
    if (!loading) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
        setAlerts(generateAlerts(projects));
      } catch (error) {
        console.error('Erreur lors de la sauvegarde des projets:', error);
        // Optionnel: afficher une notification à l'utilisateur
      }
    }
  }, [projects, loading]);

  // Fonction pour récupérer les données en cas d'erreur
  const recoverFromBackup = () => {
    try {
      const backup = localStorage.getItem(`${STORAGE_KEY}-backup`);
      if (backup) {
        const parsedBackup = JSON.parse(backup) as SavedProject[];
        const convertedBackup: Project[] = parsedBackup.map((p: SavedProject) => ({
          ...p,
          createdAt: new Date(p.createdAt),
          updatedAt: new Date(p.updatedAt),
          milestones: p.milestones.map((m: SavedMilestone) => ({
            ...m,
            tasks: m.tasks.map((t: SavedTask) => ({
              ...t,
              plannedDate: new Date(t.plannedDate),
              completedDate: t.completedDate ? new Date(t.completedDate) : undefined
            }))
          }))
        }));
        setProjects(convertedBackup);
        setAlerts(generateAlerts(convertedBackup));
        return true;
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des données de sauvegarde:', error);
    }
    return false;
  };

  const createProject = (projectData: Omit<Project, 'id' | 'milestones' | 'createdAt' | 'updatedAt'>) => {
    // Validation des données
    const validation = validateProject(projectData);
    if (!validation.isValid) {
      throw new Error(`Données de projet invalides: ${validation.errors.join(', ')}`);
    }

    const newProject: Project = {
      ...projectData,
      id: `project-${Date.now()}`,
      milestones: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Nettoyer les données
    const sanitizedProject = sanitizeProjectData(newProject);

    // Générer les jalons automatiquement
    sanitizedProject.milestones = generateMilestones(sanitizedProject);
    
    setProjects(prev => [...prev, sanitizedProject]);
    return sanitizedProject;
  };

  const updateProject = (projectId: string, updates: Partial<Project>) => {
    // Validation des mises à jour (seulement les champs présents)
    const validation = validateProject(updates);
    if (!validation.isValid) {
      console.error('Erreur de validation:', validation.errors);
      throw new Error(`Données de mise à jour invalides: ${validation.errors.join(', ')}`);
    }

    setProjects(prev => 
      prev.map(project => {
        if (project.id !== projectId) return project;
        
        const updatedProject = { ...project, ...updates, updatedAt: new Date() };
        return sanitizeProjectData(updatedProject);
      })
    );
  };

  const deleteProject = (projectId: string) => {
    setProjects(prev => prev.filter(project => project.id !== projectId));
  };

  const toggleTaskComplete = (projectId: string, milestoneId: string, taskId: string) => {
    setProjects(prev => 
      prev.map(project => {
        if (project.id !== projectId) return project;
        
        return {
          ...project,
          milestones: project.milestones.map(milestone => {
            if (milestone.id !== milestoneId) return milestone;
            
            return {
              ...milestone,
              tasks: milestone.tasks.map(task => {
                if (task.id !== taskId) return task;
                
                const isCompleted = task.status === 'completed';
                return {
                  ...task,
                  status: isCompleted ? 'pending' : 'completed',
                  completedDate: isCompleted ? undefined : new Date()
                };
              })
            };
          }),
          updatedAt: new Date()
        };
      })
    );
  };

  const acknowledgeAlert = (alertId: string) => {
    setAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, acknowledged: true }
          : alert
      )
    );
  };

  return {
    projects,
    alerts: alerts.filter(a => !a.acknowledged),
    loading,
    createProject,
    updateProject,
    deleteProject,
    toggleTaskComplete,
    acknowledgeAlert,
    recoverFromBackup
  };
};