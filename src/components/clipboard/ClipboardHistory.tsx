import React, { useEffect, useState } from 'react';
import { useClipboard } from '../../stores/clipboardStore';
import { ClipboardViewer } from './ClipboardViewer';
import { ProgressBar } from './ProgressBar';
import { FilterPanel } from './FilterPanel';
import { ShortcutsPanel } from '../shortcuts/ShortcutsPanel';
import { ErrorDetails } from '../../types/clipboard';

export const ClipboardHistory: React.FC = () => {
  const {
    filteredHistory,
    currentProgress,
    error,
    isMonitoring,
    filter,
    setFilter,
    startMonitoring,
    copyContent,
    clearError,
    toggleFavorite,
    deleteItem,
  } = useClipboard();

  const [showFilters, setShowFilters] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  useEffect(() => {
    startMonitoring();
  }, [startMonitoring]);

  const renderError = (error: ErrorDetails) => {
    const errorMessage = error.context?.error;
    const errorText = typeof errorMessage === 'string' ? errorMessage : '';
    const retryFn = error.retry;

    return (
      <div className="flex items-center justify-between bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
            {error.message}
          </h3>
          {errorText && (
            <p className="mt-1 text-sm text-red-700 dark:text-red-300">
              {errorText}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {retryFn && (
            <button
              onClick={retryFn}
              className="px-3 py-1 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              Retry
            </button>
          )}
          <button
            onClick={clearError}
            className="p-1 hover:bg-red-100 dark:hover:bg-red-900/40 rounded"
          >
            ✕
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="relative h-full">
      <div className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-900 p-4 space-y-4">
        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isMonitoring ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {isMonitoring ? 'Monitoring clipboard' : 'Monitoring stopped'}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(true)}
              className="p-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              title="Show filters"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </button>
            <button
              onClick={() => setShowShortcuts(true)}
              className="p-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              title="Keyboard shortcuts"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && renderError(error)}

        {/* Progress Bar */}
        {currentProgress && (
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
            <ProgressBar progress={currentProgress} />
          </div>
        )}
      </div>

      {/* History List */}
      <div className="p-4 space-y-4">
        {filteredHistory.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            No clipboard history yet
          </div>
        ) : (
          filteredHistory.map((content) => (
            <ClipboardViewer
              key={content.timestamp}
              content={content}
              onCopy={copyContent}
              onFavorite={() => toggleFavorite(content.timestamp)}
              onDelete={() => deleteItem(content.timestamp)}
            />
          ))
        )}
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-end p-4 z-50">
          <div className="w-96">
            <FilterPanel
              filter={filter}
              onFilterChange={setFilter}
              onClose={() => setShowFilters(false)}
            />
          </div>
        </div>
      )}

      {/* Shortcuts Panel */}
      {showShortcuts && (
        <ShortcutsPanel onClose={() => setShowShortcuts(false)} />
      )}
    </div>
  );
}; 