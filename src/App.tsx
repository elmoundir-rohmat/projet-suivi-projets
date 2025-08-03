import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { Dashboard } from './components/Dashboard';
import { ProjectDetail } from './components/ProjectDetail';
import { useProjectsFirestore } from './hooks/useProjectsFirestore';
import { Project } from './types';
import { LogOut, User, AlertCircle } from 'lucide-react';

function App() {
  const { currentUser, logout } = useAuth();
  const { 
    projects, 
    alerts, 
    loading, 
    error,
    createProject, 
    updateProject, 
    archiveProject,
    restoreProject,
    toggleTaskComplete 
  } = useProjectsFirestore();
  
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

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  // Composant pour l'en-tête avec les informations utilisateur
  const Header = () => (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-900">
              Suivi de Projets
            </h1>
          </div>
          {currentUser && (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-700">
                  {currentUser.email}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-500 bg-white hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Déconnexion
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );

  // Composant principal de l'application (protégé)
  const MainApp = () => {
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

    if (error) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center max-w-md">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Erreur de connexion</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <p className="text-sm text-gray-500">
              Vérifiez que Firestore est activé dans votre console Firebase.
            </p>
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
        onArchiveProject={archiveProject}
        onRestoreProject={restoreProject}
      />
    );
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {currentUser && <Header />}
        <main>
          <Routes>
            <Route 
              path="/login" 
              element={
                currentUser ? <Navigate to="/" replace /> : <Login />
              } 
            />
            <Route 
              path="/register" 
              element={
                currentUser ? <Navigate to="/" replace /> : <Register />
              } 
            />
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <MainApp />
                </ProtectedRoute>
              } 
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;