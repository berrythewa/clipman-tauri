import React from 'react';
import { ClipboardFilter, ClipboardFormats, ClipboardFormatType, createDefaultFilter } from '../../types/clipboard';

interface FilterPanelProps {
  filter: ClipboardFilter;
  onFilterChange: (filter: ClipboardFilter) => void;
  onClose?: () => void;
}

const formatOptions = Object.entries(ClipboardFormats).map(([key, value]) => ({
  value: key as ClipboardFormatType,
  label: value,
}));

export const FilterPanel: React.FC<FilterPanelProps> = ({
  filter,
  onFilterChange,
  onClose,
}) => {
  const handleTypeToggle = (type: ClipboardFormatType) => {
    const newTypes = new Set(filter.types);
    if (newTypes.has(type)) {
      newTypes.delete(type);
    } else {
      newTypes.add(type);
    }
    onFilterChange({ ...filter, types: newTypes });
  };

  const handleDateRangeChange = (start?: Date, end?: Date) => {
    onFilterChange({
      ...filter,
      dateRange: { ...filter.dateRange, start, end },
    });
  };

  const handleSizeRangeChange = (min?: number, max?: number) => {
    onFilterChange({
      ...filter,
      sizeRange: { ...filter.sizeRange, min, max },
    });
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Filter Clipboard</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ✕
          </button>
        )}
      </div>

      {/* Content Types */}
      <div>
        <h3 className="text-sm font-medium mb-2">Content Types</h3>
        <div className="flex flex-wrap gap-2">
          {formatOptions.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => handleTypeToggle(value)}
              className={`px-3 py-1 rounded-full text-sm ${
                filter.types.has(value)
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Date Range */}
      <div>
        <h3 className="text-sm font-medium mb-2">Date Range</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
              From
            </label>
            <input
              type="datetime-local"
              value={filter.dateRange.start?.toISOString().slice(0, 16) || ''}
              onChange={(e) =>
                handleDateRangeChange(
                  e.target.value ? new Date(e.target.value) : undefined,
                  filter.dateRange.end
                )
              }
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
              To
            </label>
            <input
              type="datetime-local"
              value={filter.dateRange.end?.toISOString().slice(0, 16) || ''}
              onChange={(e) =>
                handleDateRangeChange(
                  filter.dateRange.start,
                  e.target.value ? new Date(e.target.value) : undefined
                )
              }
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
            />
          </div>
        </div>
      </div>

      {/* Size Range */}
      <div>
        <h3 className="text-sm font-medium mb-2">Size Range (bytes)</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
              Min Size
            </label>
            <input
              type="number"
              value={filter.sizeRange?.min || ''}
              onChange={(e) =>
                handleSizeRangeChange(
                  e.target.value ? Number(e.target.value) : undefined,
                  filter.sizeRange?.max
                )
              }
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
              Max Size
            </label>
            <input
              type="number"
              value={filter.sizeRange?.max || ''}
              onChange={(e) =>
                handleSizeRangeChange(
                  filter.sizeRange?.min,
                  e.target.value ? Number(e.target.value) : undefined
                )
              }
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
            />
          </div>
        </div>
      </div>

      {/* Additional Filters */}
      <div>
        <h3 className="text-sm font-medium mb-2">Additional Filters</h3>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={filter.onlyCompressed}
              onChange={(e) =>
                onFilterChange({ ...filter, onlyCompressed: e.target.checked })
              }
              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Only show compressed content
            </span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={filter.onlyFavorites}
              onChange={(e) =>
                onFilterChange({ ...filter, onlyFavorites: e.target.checked })
              }
              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Only show favorites
            </span>
          </label>
        </div>
      </div>

      {/* Reset Button */}
      <div className="flex justify-end">
        <button
          onClick={() => onFilterChange(createDefaultFilter())}
          className="px-4 py-2 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
        >
          Reset Filters
        </button>
      </div>
    </div>
  );
}; 