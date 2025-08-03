import React from 'react';
import { Calendar, Clock, CheckCircle2, Play, Pause } from 'lucide-react';
import { Project } from '../types';
import { Badge } from './ui/Badge';
import { ProgressBar } from './ui/ProgressBar';
import { Button } from './ui/Button';
import { calculateProjectProgress, formatDate, getStatusColor } from '../utils/projectUtils';

interface ProjectCardProps {
  project: Project;
  onSelect: (project: Project) => void;
  onUpdateStatus: (projectId: string, status: Project['status']) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onSelect,
  onUpdateStatus
}) => {
  const progress = calculateProjectProgress(project);
  const activeMilestone = project.milestones.find(m => m.status === 'active');
  const nextDeadline = activeMilestone?.tasks.find(t => t.status === 'pending')?.plannedDate;

  const handleStatusToggle = () => {
    let newStatus: Project['status'];
    if (project.status === 'active') {
      newStatus = 'paused';
    } else if (project.status === 'draft') {
      newStatus = 'active';
    } else {
      newStatus = 'active';
    }
    onUpdateStatus(project.id, newStatus);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
      <div onClick={() => onSelect(project)}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{project.name}</h3>
            <p className="text-gray-600 text-sm line-clamp-2">{project.description}</p>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <Badge variant={project.priority === 'high' ? 'danger' : project.priority === 'medium' ? 'warning' : 'success'}>
              {project.priority}
            </Badge>
            <Badge className={getStatusColor(project.status)}>
              {project.status}
            </Badge>
          </div>
        </div>

        <div className="mb-4">
          <ProgressBar value={progress} showLabel />
        </div>

        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Clock size={14} />
              <span>{project.estimatedDuration} jours</span>
            </div>
            {nextDeadline && (
              <div className="flex items-center gap-1">
                <Calendar size={14} />
                <span>Prochaine: {formatDate(nextDeadline)}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle2 size={14} />
            <span>{project.milestones.filter(m => m.status === 'completed').length}/{project.milestones.length} jalons</span>
          </div>
        </div>

        {activeMilestone && (
          <div className="bg-blue-50 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-blue-900">
                Jalon actuel: {activeMilestone.name}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <span className="text-xs text-gray-400">
          Créé le {formatDate(project.createdAt)}
        </span>
        <Button
          size="sm"
          variant={project.status === 'active' ? 'outline' : 'primary'}
          onClick={(e) => {
            e.stopPropagation();
            handleStatusToggle();
          }}
        >
          {project.status === 'active' ? (
            <>
              <Pause size={14} className="mr-1" />
              Pause
            </>
          ) : project.status === 'draft' ? (
            <>
              <Play size={14} className="mr-1" />
              Démarrer
            </>
          ) : (
            <>
              <Play size={14} className="mr-1" />
              Reprendre
            </>
          )}
        </Button>
      </div>
    </div>
  );
};