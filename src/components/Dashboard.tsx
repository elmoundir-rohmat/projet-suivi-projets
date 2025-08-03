import React, { useState } from 'react';
import { Plus, BarChart3, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { Project, Alert } from '../types';
import { ProjectCard } from './ProjectCard';
import { ProjectForm } from './ProjectForm';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';

interface DashboardProps {
  projects: Project[];
  alerts: Alert[];
  onCreateProject: (project: Omit<Project, 'id' | 'milestones' | 'createdAt' | 'updatedAt'>) => void;
  onSelectProject: (project: Project) => void;
  onUpdateProject: (projectId: string, updates: Partial<Project>) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  projects,
  alerts,
  onCreateProject,
  onSelectProject,
  onUpdateProject
}) => {
  const [showProjectForm, setShowProjectForm] = useState(false);

  const activeProjects = projects.filter(p => p.status === 'active');
  const completedProjects = projects.filter(p => p.status === 'completed');
  const pausedProjects = projects.filter(p => p.status === 'paused');
  const draftProjects = projects.filter(p => p.status === 'draft');

  const handleUpdateStatus = (projectId: string, status: Project['status']) => {
    onUpdateProject(projectId, { status });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Mes Projets</h1>
              <p className="text-gray-600 mt-1">Gérez vos projets entrepreneuriaux en toute simplicité</p>
            </div>
            <Button onClick={() => setShowProjectForm(true)}>
              <Plus size={20} className="mr-2" />
              Nouveau projet
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="text-blue-600" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{projects.length}</p>
                <p className="text-gray-600 text-sm">Projets total</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="text-green-600" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{completedProjects.length}</p>
                <p className="text-gray-600 text-sm">Terminés</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="text-orange-600" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{activeProjects.length}</p>
                <p className="text-gray-600 text-sm">En cours</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="text-red-600" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{alerts.length}</p>
                <p className="text-gray-600 text-sm">Alertes</p>
              </div>
            </div>
          </div>
        </div>

        {/* Alertes */}
        {alerts.length > 0 && (
          <div className="bg-orange-50 border-l-4 border-orange-400 p-4 mb-8 rounded-r-lg">
            <div className="flex items-center">
              <AlertCircle className="text-orange-400 mr-3" size={20} />
              <div>
                <h3 className="text-orange-800 font-medium">Alertes actives</h3>
                <p className="text-orange-700 text-sm mt-1">
                  Vous avez {alerts.length} alerte{alerts.length > 1 ? 's' : ''} nécessitant votre attention.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Projets en brouillon */}
        {draftProjects.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Projets en brouillon</h2>
              <Badge variant="default">{draftProjects.length}</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {draftProjects.map(project => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onSelect={onSelectProject}
                  onUpdateStatus={handleUpdateStatus}
                />
              ))}
            </div>
          </div>
        )}

        {/* Projets actifs */}
        {activeProjects.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Projets actifs</h2>
              <Badge variant="info">{activeProjects.length}</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeProjects.map(project => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onSelect={onSelectProject}
                  onUpdateStatus={handleUpdateStatus}
                />
              ))}
            </div>
          </div>
        )}

        {/* Projets en pause */}
        {pausedProjects.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Projets en pause</h2>
              <Badge variant="warning">{pausedProjects.length}</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pausedProjects.map(project => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onSelect={onSelectProject}
                  onUpdateStatus={handleUpdateStatus}
                />
              ))}
            </div>
          </div>
        )}

        {/* Projets terminés */}
        {completedProjects.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Projets terminés</h2>
              <Badge variant="success">{completedProjects.length}</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedProjects.map(project => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onSelect={onSelectProject}
                  onUpdateStatus={handleUpdateStatus}
                />
              ))}
            </div>
          </div>
        )}

        {/* État vide */}
        {projects.length === 0 && (
          <div className="text-center py-16">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <BarChart3 className="text-gray-400" size={32} />
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">Aucun projet pour le moment</h3>
            <p className="text-gray-600 mb-6">Créez votre premier projet pour commencer à organiser vos idées entrepreneuriales.</p>
            <Button onClick={() => setShowProjectForm(true)}>
              <Plus size={20} className="mr-2" />
              Créer mon premier projet
            </Button>
          </div>
        )}
      </div>

      <ProjectForm
        isOpen={showProjectForm}
        onClose={() => setShowProjectForm(false)}
        onSubmit={onCreateProject}
      />
    </div>
  );
};