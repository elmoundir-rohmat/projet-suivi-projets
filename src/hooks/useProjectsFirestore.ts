import { useState, useEffect } from 'react';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where,
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../auth/AuthContext';
import { Project, Milestone, Task, Alert } from '../types';

export function useProjectsFirestore() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();

  // Écouter les changements des projets de l'utilisateur connecté
  useEffect(() => {
    if (!currentUser) {
      setProjects([]);
      setAlerts([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Créer une requête pour récupérer les projets de l'utilisateur connecté
      // Temporairement sans orderBy pour éviter l'index
      const projectsQuery = query(
        collection(db, 'projects'),
        where('userId', '==', currentUser.uid)
        // orderBy('createdAt', 'desc') // Commenté temporairement
      );

      // Écouter les changements en temps réel
      const unsubscribe = onSnapshot(projectsQuery, (snapshot) => {
        const projectsData: Project[] = [];
        const alertsData: Alert[] = [];

        snapshot.forEach((doc) => {
          const project = { id: doc.id, ...doc.data() } as Project;
          projectsData.push(project);

          // Vérifier les alertes (projets en retard ou avec des tâches en retard)
          // Ne pas inclure les projets archivés dans les alertes
          if (project.status !== 'archived') {
            const hasOverdueTasks = project.milestones?.some(milestone => 
              milestone.tasks?.some(task => task.isOverdue)
            );
            
            if (hasOverdueTasks) {
              alertsData.push({
                id: `alert-${project.id}`,
                type: 'delay',
                severity: 'high',
                message: `Le projet "${project.name}" a des tâches en retard`,
                projectId: project.id,
                createdAt: new Date(),
                acknowledged: false
              });
            }
          }
        });

        // Trier les projets côté client pour l'instant
        projectsData.sort((a, b) => {
          const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
          const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
          return dateB.getTime() - dateA.getTime();
        });

        setProjects(projectsData);
        setAlerts(alertsData);
        setLoading(false);
        setError(null);
      }, (error) => {
        console.error('Erreur lors de la récupération des projets:', error);
        setError(`Erreur Firestore: ${error.message}`);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (error: any) {
      console.error('Erreur lors de la configuration Firestore:', error);
      setError(`Erreur de configuration: ${error.message}`);
      setLoading(false);
    }
  }, [currentUser]);

  // Créer un nouveau projet
  const createProject = async (projectData: Omit<Project, 'id' | 'userId' | 'createdAt' | 'milestones' | 'updatedAt'>) => {
    if (!currentUser) {
      throw new Error('Utilisateur non connecté');
    }

    try {
      console.log('Création du projet:', projectData);
      
      const newProject = {
        ...projectData,
        userId: currentUser.uid,
        milestones: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      console.log('Projet à créer:', newProject);
      
      const docRef = await addDoc(collection(db, 'projects'), newProject);
      console.log('Projet créé avec ID:', docRef.id);
      
    } catch (error: any) {
      console.error('Erreur lors de la création du projet:', error);
      setError(`Erreur création projet: ${error.message}`);
      throw error;
    }
  };

  // Mettre à jour un projet
  const updateProject = async (projectId: string, updates: Partial<Project>) => {
    if (!currentUser) {
      throw new Error('Utilisateur non connecté');
    }

    try {
      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour du projet:', error);
      setError(`Erreur mise à jour: ${error.message}`);
      throw error;
    }
  };

  // Archiver un projet
  const archiveProject = async (projectId: string) => {
    if (!currentUser) {
      throw new Error('Utilisateur non connecté');
    }

    try {
      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, {
        status: 'archived',
        archivedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error: any) {
      console.error('Erreur lors de l\'archivage du projet:', error);
      setError(`Erreur archivage: ${error.message}`);
      throw error;
    }
  };

  // Restaurer un projet archivé
  const restoreProject = async (projectId: string) => {
    if (!currentUser) {
      throw new Error('Utilisateur non connecté');
    }

    try {
      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, {
        status: 'active',
        archivedAt: null,
        updatedAt: serverTimestamp()
      });
    } catch (error: any) {
      console.error('Erreur lors de la restauration du projet:', error);
      setError(`Erreur restauration: ${error.message}`);
      throw error;
    }
  };

  // Supprimer un projet
  const deleteProject = async (projectId: string) => {
    if (!currentUser) {
      throw new Error('Utilisateur non connecté');
    }

    try {
      await deleteDoc(doc(db, 'projects', projectId));
    } catch (error: any) {
      console.error('Erreur lors de la suppression du projet:', error);
      setError(`Erreur suppression: ${error.message}`);
      throw error;
    }
  };

  // Basculer l'état d'une tâche
  const toggleTaskComplete = async (projectId: string, milestoneId: string, taskId: string) => {
    if (!currentUser) {
      throw new Error('Utilisateur non connecté');
    }

    try {
      const project = projects.find(p => p.id === projectId);
      if (!project || !project.milestones) return;

      const milestoneIndex = project.milestones.findIndex(m => m.id === milestoneId);
      if (milestoneIndex === -1) return;

      const updatedMilestones = [...project.milestones];
      const milestone = updatedMilestones[milestoneIndex];
      if (!milestone || !milestone.tasks) return;

      const taskIndex = milestone.tasks.findIndex(t => t.id === taskId);
      if (taskIndex === -1) return;

      const updatedTasks = [...milestone.tasks];
      const task = updatedTasks[taskIndex];
      
      updatedTasks[taskIndex] = {
        ...task,
        status: task.status === 'completed' ? 'pending' : 'completed',
        completedDate: task.status === 'completed' ? undefined : new Date()
      };

      updatedMilestones[milestoneIndex] = {
        ...milestone,
        tasks: updatedTasks
      };

      await updateProject(projectId, { milestones: updatedMilestones });
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour de la tâche:', error);
      setError(`Erreur tâche: ${error.message}`);
      throw error;
    }
  };

  return {
    projects,
    alerts,
    loading,
    error,
    createProject,
    updateProject,
    archiveProject,
    restoreProject,
    deleteProject,
    toggleTaskComplete
  };
} 