import React, { useState, useEffect } from 'react';
import { ArrowLeft, Edit, Save, X, CheckCircle2, Clock, PlayCircle, PauseCircle, Target, Calendar, Plus, Shuffle } from 'lucide-react';
import { Project, Task } from '../types';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { ProgressBar } from './ui/ProgressBar';
import { calculateProjectProgress, calculateMilestoneProgress, formatDate, getStatusColor } from '../utils/projectUtils';

interface ProjectDetailProps {
  project: Project;
  onBack: () => void;
  onToggleTask: (projectId: string, milestoneId: string, taskId: string) => void;
  onUpdateProject: (projectId: string, updates: Partial<Project>) => void;
}

interface TodaysTask extends Task {
  milestoneName: string;
  milestoneId: string;
}

export const ProjectDetail: React.FC<ProjectDetailProps> = ({
  project,
  onBack,
  onToggleTask,
  onUpdateProject
}) => {
  const [selectedMilestone, setSelectedMilestone] = useState<string>(
    project.milestones.find(m => m.status === 'active')?.id || project.milestones[0]?.id || ''
  );
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingMilestone, setIsEditingMilestone] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [editForm, setEditForm] = useState({
    name: project.name,
    objective: project.objective,
    description: project.description
  });
  const [editMilestoneForm, setEditMilestoneForm] = useState({
    name: '',
    description: '',
    estimatedDuration: 0
  });
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskDescription, setEditingTaskDescription] = useState('');
  const [showAddMilestoneForm, setShowAddMilestoneForm] = useState(false);
  const [newMilestoneForm, setNewMilestoneForm] = useState({
    name: '',
    description: '',
    estimatedDuration: 1
  });
  const [showDeleteMilestoneConfirm, setShowDeleteMilestoneConfirm] = useState<string | null>(null);
  const [showDeleteTaskConfirm, setShowDeleteTaskConfirm] = useState<string | null>(null);
  const [shuffleMode, setShuffleMode] = useState(false);
  const [draggedMilestone, setDraggedMilestone] = useState<string | null>(null);
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [showAddTaskForm, setShowAddTaskForm] = useState(false);

  // Mettre à jour le formulaire quand le projet change
  useEffect(() => {
    setEditForm({
      name: project.name,
      objective: project.objective,
      description: project.description
    });
  }, [project.name, project.objective, project.description]);

  // Mettre à jour le formulaire de jalon quand le jalon sélectionné change
  useEffect(() => {
    const milestone = project.milestones.find(m => m.id === selectedMilestone);
    if (milestone) {
      setEditMilestoneForm({
        name: milestone.name,
        description: milestone.description || '',
        estimatedDuration: milestone.estimatedDuration
      });
    }
  }, [selectedMilestone, project.milestones]);

  const progress = calculateProjectProgress(project);
  const currentMilestone = project.milestones.find(m => m.id === selectedMilestone);

  const handleStatusToggle = () => {
    const newStatus = project.status === 'active' ? 'paused' : 'active';
    onUpdateProject(project.id, { status: newStatus });
  };

  const handleEditSave = () => {
    try {
      onUpdateProject(project.id, {
        name: editForm.name,
        objective: editForm.objective,
        description: editForm.description
      });
      setIsEditing(false);
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000); // Masquer après 3 secondes
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      // Optionnel: afficher une notification d'erreur
    }
  };

  const handleEditCancel = () => {
    setEditForm({
      name: project.name,
      objective: project.objective,
      description: project.description
    });
    setIsEditing(false);
  };

  const handleMilestoneEditSave = () => {
    if (!currentMilestone) return;
    
    try {
      // Mettre à jour le jalon dans le projet
      const updatedMilestones = project.milestones.map(milestone => 
        milestone.id === selectedMilestone 
          ? { ...milestone, name: editMilestoneForm.name, description: editMilestoneForm.description, estimatedDuration: editMilestoneForm.estimatedDuration }
          : milestone
      );
      
      // Recalculer la durée totale du projet
      const newTotalDuration = updatedMilestones.reduce((total, milestone) => total + milestone.estimatedDuration, 0);
      
      onUpdateProject(project.id, { 
        milestones: updatedMilestones,
        estimatedDuration: newTotalDuration
      });
      setIsEditingMilestone(false);
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du jalon:', error);
    }
  };

  const handleMilestoneEditCancel = () => {
    const milestone = project.milestones.find(m => m.id === selectedMilestone);
    if (milestone) {
      setEditMilestoneForm({
        name: milestone.name,
        description: milestone.description || '',
        estimatedDuration: milestone.estimatedDuration
      });
    }
    setIsEditingMilestone(false);
  };

  const handleTaskEdit = (taskId: string, newDescription: string) => {
    if (!currentMilestone) return;
    
    try {
      const updatedMilestones = project.milestones.map(milestone => {
        if (milestone.id !== selectedMilestone) return milestone;
        
        return {
          ...milestone,
          tasks: milestone.tasks.map(task => 
            task.id === taskId 
              ? { ...task, description: newDescription }
              : task
          )
        };
      });
      
      onUpdateProject(project.id, { milestones: updatedMilestones });
    } catch (error) {
      console.error('Erreur lors de la modification de la tâche:', error);
    }
  };

  const handleAddTask = () => {
    if (!currentMilestone || !newTaskDescription.trim()) return;

    const newTask: Task = {
      id: `task-${Date.now()}`,
      milestoneId: currentMilestone.id,
      description: newTaskDescription.trim(),
      plannedDate: new Date(),
      status: 'pending',
      isOverdue: false
    };

    const updatedMilestones = project.milestones.map(milestone => {
      if (milestone.id !== selectedMilestone) return milestone;

      return {
        ...milestone,
        tasks: [...milestone.tasks, newTask]
      };
    });

    onUpdateProject(project.id, { milestones: updatedMilestones });
    setNewTaskDescription('');
    setShowAddTaskForm(false);
  };

  const handleDeleteMilestone = (milestoneId: string) => {
    const milestoneToDelete = project.milestones.find(m => m.id === milestoneId);
    if (!milestoneToDelete) return;

    // Ne pas permettre la suppression du dernier jalon
    if (project.milestones.length <= 1) {
      alert('Impossible de supprimer le dernier jalon du projet.');
      return;
    }

    const updatedMilestones = project.milestones.filter(m => m.id !== milestoneId);
    const newTotalDuration = updatedMilestones.reduce((total, milestone) => total + milestone.estimatedDuration, 0);

    onUpdateProject(project.id, {
      milestones: updatedMilestones,
      estimatedDuration: newTotalDuration
    });

    // Si le jalon supprimé était sélectionné, sélectionner le premier jalon restant
    if (selectedMilestone === milestoneId) {
      setSelectedMilestone(updatedMilestones[0]?.id || '');
    }

    setShowDeleteMilestoneConfirm(null);
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

  const handleDeleteTask = (taskId: string) => {
    if (!currentMilestone) return;

    const updatedMilestones = project.milestones.map(milestone => {
      if (milestone.id !== selectedMilestone) return milestone;

      return {
        ...milestone,
        tasks: milestone.tasks.filter(task => task.id !== taskId)
      };
    });

    onUpdateProject(project.id, { milestones: updatedMilestones });
    setShowDeleteTaskConfirm(null);
  };

  const handleStartTaskEdit = (taskId: string, currentDescription: string) => {
    setEditingTaskId(taskId);
    setEditingTaskDescription(currentDescription);
  };

  const handleSaveTaskEdit = () => {
    if (!editingTaskId) return;

    handleTaskEdit(editingTaskId, editingTaskDescription);
    setEditingTaskId(null);
    setEditingTaskDescription('');
  };

  const handleCancelTaskEdit = () => {
    setEditingTaskId(null);
    setEditingTaskDescription('');
  };

  const handleMilestoneDragStart = (e: React.DragEvent, milestoneId: string) => {
    if (!shuffleMode) return;
    setDraggedMilestone(milestoneId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleMilestoneDragOver = (e: React.DragEvent) => {
    if (!shuffleMode) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleMilestoneDrop = (e: React.DragEvent, targetMilestoneId: string) => {
    if (!shuffleMode || !draggedMilestone || draggedMilestone === targetMilestoneId) return;
    e.preventDefault();

    const draggedIndex = project.milestones.findIndex(m => m.id === draggedMilestone);
    const targetIndex = project.milestones.findIndex(m => m.id === targetMilestoneId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const updatedMilestones = [...project.milestones];
    const [draggedMilestoneData] = updatedMilestones.splice(draggedIndex, 1);
    updatedMilestones.splice(targetIndex, 0, draggedMilestoneData);

    // Mettre à jour l'ordre des jalons
    const reorderedMilestones = updatedMilestones.map((milestone, index) => ({
      ...milestone,
      order: index
    }));

    onUpdateProject(project.id, { milestones: reorderedMilestones });
    setDraggedMilestone(null);
  };

  const handleTaskDragStart = (e: React.DragEvent, taskId: string) => {
    if (!shuffleMode || !currentMilestone) return;
    setDraggedTask(taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleTaskDragOver = (e: React.DragEvent) => {
    if (!shuffleMode) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleTaskDrop = (e: React.DragEvent, targetTaskId: string) => {
    if (!shuffleMode || !draggedTask || !currentMilestone || draggedTask === targetTaskId) return;
    e.preventDefault();

    const draggedIndex = currentMilestone.tasks.findIndex(t => t.id === draggedTask);
    const targetIndex = currentMilestone.tasks.findIndex(t => t.id === targetTaskId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const updatedTasks = [...currentMilestone.tasks];
    const [draggedTaskData] = updatedTasks.splice(draggedIndex, 1);
    updatedTasks.splice(targetIndex, 0, draggedTaskData);

    const updatedMilestones = project.milestones.map(milestone => 
      milestone.id === currentMilestone.id 
        ? { ...milestone, tasks: updatedTasks }
        : milestone
    );

    onUpdateProject(project.id, { milestones: updatedMilestones });
    setDraggedTask(null);
  };

  const handleAddMilestone = () => {
    if (!newMilestoneForm.name.trim()) return;

    const newMilestone = {
      id: `milestone-${Date.now()}`,
      projectId: project.id,
      name: newMilestoneForm.name.trim(),
      description: newMilestoneForm.description.trim(),
      estimatedDuration: newMilestoneForm.estimatedDuration,
      tasks: [],
      status: 'pending' as const,
      order: project.milestones.length
    };

    const updatedMilestones = [...project.milestones, newMilestone];
    const newTotalDuration = updatedMilestones.reduce((total, milestone) => total + milestone.estimatedDuration, 0);

    onUpdateProject(project.id, {
      milestones: updatedMilestones,
      estimatedDuration: newTotalDuration
    });

    setNewMilestoneForm({
      name: '',
      description: '',
      estimatedDuration: 1
    });
    setShowAddMilestoneForm(false);
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

  const getTodaysTasks = (): TodaysTask[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todaysTasks: TodaysTask[] = [];
    project.milestones.forEach(milestone => {
      milestone.tasks.forEach(task => {
        const taskDate = new Date(task.plannedDate);
        taskDate.setHours(0, 0, 0, 0);
        if (taskDate.getTime() === today.getTime()) {
          todaysTasks.push({ ...task, milestoneName: milestone.name, milestoneId: milestone.id });
        }
      });
    });
    
    return todaysTasks;
  };

  const todaysTasks = getTodaysTasks();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Notification de succès */}
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-in slide-in-from-right">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={20} />
            <span>Projet sauvegardé avec succès !</span>
          </div>
        </div>
      )}

      {/* Popup de confirmation pour suppression de jalon */}
      {showDeleteMilestoneConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <X className="text-red-600" size={20} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Supprimer le jalon</h3>
                <p className="text-sm text-gray-600">Cette action est irréversible</p>
              </div>
            </div>
            <p className="text-gray-700 mb-6">
              Êtes-vous sûr de vouloir supprimer ce jalon ? Toutes les tâches associées seront également supprimées.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDeleteMilestone(showDeleteMilestoneConfirm)}
                className="flex-1 bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors"
              >
                Supprimer
              </button>
              <button
                onClick={() => setShowDeleteMilestoneConfirm(null)}
                className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Popup de confirmation pour suppression de tâche */}
      {showDeleteTaskConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <X className="text-red-600" size={20} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Supprimer la tâche</h3>
                <p className="text-sm text-gray-600">Cette action est irréversible</p>
              </div>
            </div>
            <p className="text-gray-700 mb-6">
              Êtes-vous sûr de vouloir supprimer cette tâche ?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDeleteTask(showDeleteTaskConfirm)}
                className="flex-1 bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors"
              >
                Supprimer
              </button>
              <button
                onClick={() => setShowDeleteTaskConfirm(null)}
                className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 py-6">
            <Button variant="ghost" onClick={onBack}>
              <ArrowLeft size={20} className="mr-2" />
              Retour
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    className="text-2xl font-bold text-gray-900 bg-transparent border-b-2 border-blue-500 focus:outline-none"
                    autoFocus
                  />
                ) : (
                  <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
                )}
                <Badge className={getStatusColor(project.status)}>
                  {project.status}
                </Badge>
                <Badge variant={project.priority === 'high' ? 'danger' : project.priority === 'medium' ? 'warning' : 'success'}>
                  {project.priority}
                </Badge>
              </div>
              {isEditing ? (
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full text-gray-600 bg-transparent border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                />
              ) : (
                <p className="text-gray-600">{project.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Button variant="primary" onClick={handleEditSave}>
                    <Save size={16} className="mr-2" />
                    Sauvegarder
                  </Button>
                  <Button variant="outline" onClick={handleEditCancel}>
                    <X size={16} className="mr-2" />
                    Annuler
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" onClick={() => setIsEditing(true)}>
                    <Edit size={16} className="mr-2" />
                    Modifier
                  </Button>
                  <Button
                    variant={project.status === 'active' ? 'outline' : 'primary'}
                    onClick={handleStatusToggle}
                  >
                    {project.status === 'active' ? (
                      <>
                        <PauseCircle size={16} className="mr-2" />
                        Pause
                      </>
                    ) : (
                      <>
                        <PlayCircle size={16} className="mr-2" />
                        Reprendre
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Informations du projet */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Target className="text-blue-600" size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Objectif</p>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.objective}
                        onChange={(e) => setEditForm(prev => ({ ...prev, objective: e.target.value }))}
                        className="font-medium text-gray-900 bg-transparent border-b border-gray-300 focus:outline-none focus:border-blue-500"
                      />
                    ) : (
                      <p className="font-medium text-gray-900">{project.objective}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Calendar className="text-green-600" size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Durée</p>
                    <p className="font-medium text-gray-900">{project.estimatedDuration} jours</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Clock className="text-orange-600" size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Créé le</p>
                    <p className="font-medium text-gray-900">{formatDate(project.createdAt)}</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <ProgressBar value={progress} />
              </div>
            </div>

            {/* Jalons */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Jalons du projet</h2>
                <div className="flex items-center gap-2">
                  {!showAddMilestoneForm && (
                    <>
                      <Button 
                        size="sm" 
                        variant={shuffleMode ? "primary" : "outline"}
                        onClick={() => setShuffleMode(!shuffleMode)}
                      >
                        <Shuffle size={14} className="mr-1" />
                        {shuffleMode ? 'Mode Réorganisation' : 'Réorganiser'}
                      </Button>
                      <Button size="sm" variant="primary" onClick={() => setShowAddMilestoneForm(true)}>
                        <Plus size={14} className="mr-1" />
                        Ajouter un jalon
                      </Button>
                    </>
                  )}
                  {currentMilestone && !isEditingMilestone && !showAddMilestoneForm && !shuffleMode && (
                    <Button size="sm" variant="ghost" onClick={() => setIsEditingMilestone(true)}>
                      <Edit size={14} className="mr-1" />
                      Modifier
                    </Button>
                  )}
                  {isEditingMilestone && currentMilestone && (
                    <>
                      <Button size="sm" variant="primary" onClick={handleMilestoneEditSave}>
                        <Save size={14} className="mr-1" />
                        Sauvegarder
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleMilestoneEditCancel}>
                        <X size={14} className="mr-1" />
                        Annuler
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Formulaire d'ajout de jalon */}
              {showAddMilestoneForm && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="text-sm font-medium text-blue-900 mb-3">Nouveau jalon</h3>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={newMilestoneForm.name}
                      onChange={(e) => setNewMilestoneForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full text-sm bg-white border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nom du jalon..."
                      autoFocus
                    />
                    <textarea
                      value={newMilestoneForm.description}
                      onChange={(e) => setNewMilestoneForm(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full text-sm bg-white border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Description du jalon..."
                      rows={2}
                    />
                    <div className="flex items-center gap-4">
                      <label className="text-xs text-gray-600">Durée (jours):</label>
                      <input
                        type="number"
                        min="1"
                        value={newMilestoneForm.estimatedDuration}
                        onChange={(e) => setNewMilestoneForm(prev => ({ ...prev, estimatedDuration: parseInt(e.target.value) || 1 }))}
                        className="w-20 text-sm bg-white border border-gray-300 rounded-md p-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="primary" onClick={handleAddMilestone}>
                        <Plus size={14} className="mr-1" />
                        Ajouter
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setShowAddMilestoneForm(false)}>
                        <X size={14} className="mr-1" />
                        Annuler
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Notification du mode shuffle */}
              {shuffleMode && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Shuffle size={16} className="text-yellow-600" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">Mode Réorganisation activé</p>
                      <p className="text-xs text-yellow-700">Glissez-déposez les jalons et tâches pour les réorganiser</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {project.milestones.map((milestone, index) => (
                  <div
                    key={milestone.id}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedMilestone === milestone.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    } ${shuffleMode ? 'hover:shadow-md' : ''} ${
                      draggedMilestone === milestone.id ? 'opacity-50' : ''
                    }`}
                    onClick={() => setSelectedMilestone(milestone.id)}
                    draggable={shuffleMode}
                    onDragStart={(e) => handleMilestoneDragStart(e, milestone.id)}
                    onDragOver={handleMilestoneDragOver}
                    onDrop={(e) => handleMilestoneDrop(e, milestone.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          milestone.status === 'completed' 
                            ? 'bg-green-100 text-green-800'
                            : milestone.status === 'active'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          {isEditingMilestone && selectedMilestone === milestone.id ? (
                            <input
                              type="text"
                              value={editMilestoneForm.name}
                              onChange={(e) => setEditMilestoneForm(prev => ({ ...prev, name: e.target.value }))}
                              className="text-lg font-medium text-gray-900 bg-transparent border-b-2 border-blue-500 focus:outline-none w-full"
                              autoFocus
                            />
                          ) : (
                            <h3 className="font-medium text-gray-900">{milestone.name}</h3>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(milestone.status)}>
                          {milestone.status}
                        </Badge>
                        {!isEditingMilestone && !showAddMilestoneForm && !shuffleMode && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowDeleteMilestoneConfirm(milestone.id);
                            }}
                            className="text-red-500 hover:text-red-700 p-1 rounded"
                            title="Supprimer le jalon"
                          >
                            <X size={14} />
                          </button>
                        )}
                        {shuffleMode && (
                          <div className="text-gray-400">
                            <Shuffle size={14} />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="ml-11">
                      {isEditingMilestone && selectedMilestone === milestone.id ? (
                        <>
                          <textarea
                            value={editMilestoneForm.description}
                            onChange={(e) => setEditMilestoneForm(prev => ({ ...prev, description: e.target.value }))}
                            className="w-full text-sm text-gray-600 bg-transparent border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                            rows={2}
                            placeholder="Description du jalon..."
                          />
                          <div className="flex items-center gap-4 mb-2">
                            <label className="text-xs text-gray-500">Durée (jours):</label>
                            <input
                              type="number"
                              min="1"
                              value={editMilestoneForm.estimatedDuration}
                              onChange={(e) => setEditMilestoneForm(prev => ({ ...prev, estimatedDuration: parseInt(e.target.value) || 1 }))}
                              className="w-20 text-sm bg-transparent border border-gray-300 rounded-md p-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                        </>
                      ) : (
                        <p className="text-sm text-gray-600 mb-2">{milestone.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>{milestone.estimatedDuration} jours</span>
                        <span>{calculateMilestoneProgress(milestone)}% complété</span>
                        <span>{milestone.tasks.filter(t => t.status === 'completed').length}/{milestone.tasks.length} tâches</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Détail du jalon sélectionné */}
            {currentMilestone && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Tâches - {currentMilestone.name}
                  </h2>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(currentMilestone.status)}>
                      {calculateMilestoneProgress(currentMilestone)}% complété
                    </Badge>
                    {!shuffleMode && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => {
                          setShowAddTaskForm(!showAddTaskForm);
                          if (!showAddTaskForm) {
                            setNewTaskDescription('');
                          }
                        }}
                      >
                        <Plus size={14} className="mr-1" />
                        {showAddTaskForm ? 'Masquer' : 'Ajouter une tâche'}
                      </Button>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  {currentMilestone.tasks.map((task) => (
                    <div
                      key={task.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border ${
                        task.status === 'completed'
                          ? 'bg-green-50 border-green-200'
                          : task.isOverdue
                          ? 'bg-red-50 border-red-200'
                          : 'bg-gray-50 border-gray-200'
                      } ${shuffleMode ? 'hover:shadow-md cursor-move' : ''} ${
                        draggedTask === task.id ? 'opacity-50' : ''
                      }`}
                      draggable={shuffleMode}
                      onDragStart={(e) => handleTaskDragStart(e, task.id)}
                      onDragOver={handleTaskDragOver}
                      onDrop={(e) => handleTaskDrop(e, task.id)}
                    >
                      <button
                        onClick={() => onToggleTask(project.id, currentMilestone.id, task.id)}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                          task.status === 'completed'
                            ? 'bg-green-500 border-green-500'
                            : 'border-gray-300 hover:border-blue-500'
                        }`}
                      >
                        {task.status === 'completed' && (
                          <CheckCircle2 size={12} className="text-white" />
                        )}
                      </button>
                      <div className="flex-1">
                        {editingTaskId === task.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editingTaskDescription}
                              onChange={(e) => setEditingTaskDescription(e.target.value)}
                              className="flex-1 text-sm bg-transparent border-b border-gray-300 focus:outline-none focus:border-blue-500"
                              onKeyPress={(e) => e.key === 'Enter' && handleSaveTaskEdit()}
                              autoFocus
                            />
                            <button
                              onClick={handleSaveTaskEdit}
                              className="text-green-500 hover:text-green-700"
                              title="Sauvegarder"
                            >
                              <Save size={12} />
                            </button>
                            <button
                              onClick={handleCancelTaskEdit}
                              className="text-gray-500 hover:text-gray-700"
                              title="Annuler"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <p className={`text-sm ${
                              task.status === 'completed' 
                                ? 'text-gray-500 line-through' 
                                : 'text-gray-900'
                            }`}>
                              {task.description}
                            </p>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleStartTaskEdit(task.id, task.description)}
                                className="text-blue-500 hover:text-blue-700"
                                title="Modifier"
                              >
                                <Edit size={12} />
                              </button>
                              <button
                                onClick={() => setShowDeleteTaskConfirm(task.id)}
                                className="text-red-500 hover:text-red-700"
                                title="Supprimer"
                              >
                                <X size={12} />
                              </button>
                            </div>
                            {shuffleMode && (
                              <div className="text-gray-400 ml-1">
                                <Shuffle size={10} />
                              </div>
                            )}
                          </div>
                        )}
                        <p className="text-xs text-gray-500">
                          {formatDate(task.plannedDate)}
                          {task.isOverdue && ' (En retard)'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                {currentMilestone && showAddTaskForm && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Plus size={14} className="text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">Ajouter une nouvelle tâche</span>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newTaskDescription}
                        onChange={(e) => setNewTaskDescription(e.target.value)}
                        className="flex-1 text-sm bg-white border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Description de la nouvelle tâche..."
                        onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
                        autoFocus
                      />
                      <Button size="sm" variant="primary" onClick={handleAddTask} disabled={!newTaskDescription.trim()}>
                        <Plus size={14} className="mr-1" />
                        Ajouter
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => {
                        setShowAddTaskForm(false);
                        setNewTaskDescription('');
                      }}>
                        <X size={14} className="mr-1" />
                        Annuler
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Tâches du jour */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tâches d'aujourd'hui</h3>
              {todaysTasks.length > 0 ? (
                <div className="space-y-3">
                  {todaysTasks.map((task) => (
                    <div key={task.id} className="flex items-center gap-3">
                      <button
                        onClick={() => onToggleTask(project.id, task.milestoneId, task.id)}
                        className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                          task.status === 'completed'
                            ? 'bg-green-500 border-green-500'
                            : 'border-gray-300 hover:border-blue-500'
                        }`}
                      >
                        {task.status === 'completed' && (
                          <CheckCircle2 size={10} className="text-white" />
                        )}
                      </button>
                      <div className="flex-1">
                        {isEditingMilestone && selectedMilestone === task.milestoneId ? (
                          <input
                            type="text"
                            value={task.description}
                            onChange={(e) => handleTaskEdit(task.id, e.target.value)}
                            className={`text-sm bg-transparent border-b border-gray-300 focus:outline-none focus:border-blue-500 w-full ${
                              task.status === 'completed' 
                                ? 'text-gray-500 line-through' 
                                : 'text-gray-900'
                            }`}
                            placeholder="Description de la tâche..."
                          />
                        ) : (
                          <p className={`text-sm ${
                            task.status === 'completed' 
                              ? 'text-gray-500 line-through' 
                              : 'text-gray-900'
                          }`}>
                            {task.description}
                          </p>
                        )}
                        <p className="text-xs text-gray-500">{task.milestoneName}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Aucune tâche prévue aujourd'hui</p>
              )}
            </div>

            {/* Statistiques rapides */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistiques</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Jalons terminés</span>
                  <span className="font-medium">
                    {project.milestones.filter(m => m.status === 'completed').length} / {project.milestones.length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Tâches terminées</span>
                  <span className="font-medium">
                    {project.milestones.reduce((acc, m) => acc + m.tasks.filter(t => t.status === 'completed').length, 0)} / 
                    {project.milestones.reduce((acc, m) => acc + m.tasks.length, 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Progression globale</span>
                  <span className="font-medium text-blue-600">{progress}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};