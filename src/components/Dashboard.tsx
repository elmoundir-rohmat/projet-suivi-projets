import React, { useState } from 'react';
import { Plus, BarChart3, AlertCircle, CheckCircle2, Clock, Archive, RotateCcw } from 'lucide-react';
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
  onArchiveProject: (projectId: string) => void;
  onRestoreProject: (projectId: string) => void;
}

type TabType = 'active' | 'archived';

export const Dashboard: React.FC<DashboardProps> = ({
  projects,
  alerts,
  onCreateProject,
  onSelectProject,
  onUpdateProject,
  onArchiveProject,
  onRestoreProject
}) => {
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('active');

  const activeProjects = projects.filter(p => p.status !== 'archived');
  const archivedProjects = projects.filter(p => p.status === 'archived');
  const currentProjects = activeTab === 'active' ? activeProjects : archivedProjects;

  const activeProjectsByStatus = {
    active: activeProjects.filter(p => p.status === 'active'),
    completed: activeProjects.filter(p => p.status === 'completed'),
    paused: activeProjects.filter(p => p.status === 'paused'),
    draft: activeProjects.filter(p => p.status === 'draft')
  };

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
                <p className="text-2xl font-bold text-gray-900">{activeProjects.length}</p>
                <p className="text-gray-600 text-sm">Projets actifs</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="text-green-600" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{activeProjectsByStatus.completed.length}</p>
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
                <p className="text-2xl font-bold text-gray-900">{activeProjectsByStatus.active.length}</p>
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

        {/* Onglets */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('active')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'active'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Projets Actifs ({activeProjects.length})
              </button>
              <button
                onClick={() => setActiveTab('archived')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'archived'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Archive className="inline w-4 h-4 mr-1" />
                Archivés ({archivedProjects.length})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'active' ? (
              // Onglet Projets Actifs
              <div>
                {/* Alertes */}
                {alerts.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Alertes</h3>
                    <div className="space-y-3">
                      {alerts.map((alert) => (
                        <div key={alert.id} className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <div className="flex items-center">
                            <AlertCircle className="text-red-500 mr-2" size={20} />
                            <span className="text-red-800">{alert.message}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Projets par statut */}
                <div className="space-y-8">
                  {/* Projets en cours */}
                  {activeProjectsByStatus.active.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">En cours</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {activeProjectsByStatus.active.map((project) => (
                          <ProjectCard
                            key={project.id}
                            project={project}
                            onSelect={onSelectProject}
                            onUpdateStatus={handleUpdateStatus}
                            onArchive={onArchiveProject}
                            showArchiveButton={true}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Projets en pause */}
                  {activeProjectsByStatus.paused.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">En pause</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {activeProjectsByStatus.paused.map((project) => (
                          <ProjectCard
                            key={project.id}
                            project={project}
                            onSelect={onSelectProject}
                            onUpdateStatus={handleUpdateStatus}
                            onArchive={onArchiveProject}
                            showArchiveButton={true}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Projets terminés */}
                  {activeProjectsByStatus.completed.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Terminés</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {activeProjectsByStatus.completed.map((project) => (
                          <ProjectCard
                            key={project.id}
                            project={project}
                            onSelect={onSelectProject}
                            onUpdateStatus={handleUpdateStatus}
                            onArchive={onArchiveProject}
                            showArchiveButton={true}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Projets brouillon */}
                  {activeProjectsByStatus.draft.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Brouillons</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {activeProjectsByStatus.draft.map((project) => (
                          <ProjectCard
                            key={project.id}
                            project={project}
                            onSelect={onSelectProject}
                            onUpdateStatus={handleUpdateStatus}
                            onArchive={onArchiveProject}
                            showArchiveButton={true}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Message si aucun projet */}
                  {activeProjects.length === 0 && (
                    <div className="text-center py-12">
                      <div className="text-gray-400 mb-4">
                        <BarChart3 size={48} className="mx-auto" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun projet actif</h3>
                      <p className="text-gray-500">Commencez par créer votre premier projet !</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // Onglet Projets Archivés
              <div>
                {archivedProjects.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {archivedProjects.map((project) => (
                      <ProjectCard
                        key={project.id}
                        project={project}
                        onSelect={onSelectProject}
                        onUpdateStatus={handleUpdateStatus}
                        onRestore={onRestoreProject}
                        showRestoreButton={true}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                      <Archive size={48} className="mx-auto" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun projet archivé</h3>
                    <p className="text-gray-500">Les projets archivés apparaîtront ici.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de création de projet */}
      {showProjectForm && (
        <ProjectForm
          onSubmit={onCreateProject}
          onCancel={() => setShowProjectForm(false)}
        />
      )}
    </div>
  );
};