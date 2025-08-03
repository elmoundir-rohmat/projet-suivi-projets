import React, { useState } from 'react';
import { Project } from '../types';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';

interface ProjectFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (project: Omit<Project, 'id' | 'milestones' | 'createdAt' | 'updatedAt'>) => void;
}

export const ProjectForm: React.FC<ProjectFormProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [formData, setFormData] = useState({
    name: '',
    objective: '',
    description: '',
    estimatedDuration: 30,
    status: 'active' as const,
    priority: 'medium' as const
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({
      name: '',
      objective: '',
      description: '',
      estimatedDuration: 30,
      status: 'active',
      priority: 'medium'
    });
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'estimatedDuration' ? parseInt(value) : value
    }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Créer un nouveau projet" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Nom du projet *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            value={formData.name}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Ex: Lancement de mon e-commerce"
          />
        </div>

        <div>
          <label htmlFor="objective" className="block text-sm font-medium text-gray-700 mb-2">
            Objectif *
          </label>
          <input
            type="text"
            id="objective"
            name="objective"
            required
            value={formData.objective}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Ex: Générer 10k€ de CA mensuel"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            value={formData.description}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Décrivez votre projet en quelques lignes..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="estimatedDuration" className="block text-sm font-medium text-gray-700 mb-2">
              Durée estimée (jours)
            </label>
            <input
              type="number"
              id="estimatedDuration"
              name="estimatedDuration"
              min="1"
              max="365"
              value={formData.estimatedDuration}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
              Priorité
            </label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="low">Faible</option>
              <option value="medium">Moyenne</option>
              <option value="high">Haute</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit">
            Créer le projet
          </Button>
        </div>
      </form>
    </Modal>
  );
};