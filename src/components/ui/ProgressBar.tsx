import React from 'react';
import { cn } from '../../utils/cn';

interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  className,
  showLabel = true,
  size = 'md'
}) => {
  const percentage = Math.round((value / max) * 100);
  
  const sizes = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  };

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-gray-700">Progression</span>
          <span className="text-sm text-gray-500">{percentage}%</span>
        </div>
      )}
      <div className={cn('bg-gray-200 rounded-full overflow-hidden', sizes[size])}>
        <div
          className="bg-blue-600 h-full transition-all duration-300 ease-in-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};