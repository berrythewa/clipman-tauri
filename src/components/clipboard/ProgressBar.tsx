import React from 'react';
import { ProgressInfo } from '../../types/clipboard';

interface ProgressBarProps {
  progress: ProgressInfo;
  className?: string;
}

const formatBytes = (bytes: number): string => {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
};

const formatTime = (seconds: number): string => {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return `${minutes}m ${remainingSeconds}s`;
};

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, className = '' }) => {
  const percentage = Math.round(progress.progress * 100);
  const speed = progress.speed_bytes_per_second 
    ? formatBytes(progress.speed_bytes_per_second) + '/s'
    : null;
  const eta = progress.eta_seconds 
    ? formatTime(progress.eta_seconds)
    : null;

  return (
    <div className={`flex flex-col gap-2 w-full ${className}`}>
      <div className="flex justify-between text-sm text-gray-600">
        <span>{progress.operation}</span>
        <span>{percentage}%</span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
        <div 
          className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-in-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      <div className="flex justify-between text-xs text-gray-500">
        <span>{formatBytes(progress.bytes_processed)} / {formatBytes(progress.total_bytes)}</span>
        <div className="flex gap-2">
          {speed && <span>{speed}</span>}
          {eta && <span>ETA: {eta}</span>}
        </div>
      </div>
    </div>
  );
}; 