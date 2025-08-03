import React, { useState, useEffect } from 'react';
import { useProjects } from './hooks/useProjects';
import { Dashboard } from './components/Dashboard';
import { ProjectDetail } from './components/ProjectDetail';
import { Project } from './types';

function App() {
  const { 
    projects, 
    alerts, 
    loading, 
    createProject, 
    updateProject, 
    toggleTaskComplete 
  } = useProjects();
  
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Synchroniser selectedProject avec les données les plus récentes
  useEffect(() => {
    if (selectedProject) {
      const updatedProject = projects.find(p => p.id === selectedProject.id);
      if (updatedProject) {
        setSelectedProject(updatedProject);
      }
    }
  }, [projects, selectedProject]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de vos projets...</p>
        </div>
      </div>
    );
  }

  if (selectedProject) {
    return (
      <ProjectDetail 
        project={selectedProject}
        onBack={() => setSelectedProject(null)}
        onToggleTask={toggleTaskComplete}
        onUpdateProject={(projectId, updates) => {
          updateProject(projectId, updates);
          // Mettre à jour le projet sélectionné avec les données mises à jour
          const updatedProject = projects.find(p => p.id === projectId);
          if (updatedProject) {
            // Si on met à jour les jalons, recalculer la durée totale
            if (updates.milestones) {
              const newTotalDuration = updates.milestones.reduce((total, milestone) => total + milestone.estimatedDuration, 0);
              setSelectedProject({ 
                ...updatedProject, 
                ...updates,
                estimatedDuration: newTotalDuration
              });
            } else {
              setSelectedProject({ ...updatedProject, ...updates });
            }
          }
        }}
      />
    );
  }

  return (
    <Dashboard
      projects={projects}
      alerts={alerts}
      onCreateProject={createProject}
      onSelectProject={setSelectedProject}
      onUpdateProject={updateProject}
    />
  );
}

export default App;