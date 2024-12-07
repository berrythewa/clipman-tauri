import React, { useState, useEffect } from 'react';
import { KeyboardShortcut, DEFAULT_SHORTCUTS } from '../../types/clipboard';

interface ShortcutsPanelProps {
  onClose?: () => void;
}

interface ShortcutRowProps {
  shortcut: KeyboardShortcut;
  onEdit: (id: string) => void;
  onReset: (id: string) => void;
}

const ShortcutRow: React.FC<ShortcutRowProps> = ({ shortcut, onEdit, onReset }) => (
  <div className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
    <div className="flex-1">
      <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">{shortcut.name}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400">{shortcut.description}</p>
    </div>
    <div className="flex items-center gap-4">
      <div className="flex gap-2">
        {shortcut.currentKeys.map((key, index) => (
          <kbd
            key={index}
            className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
          >
            {key}
          </kbd>
        ))}
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onEdit(shortcut.id)}
          className="p-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Edit
        </button>
        {JSON.stringify(shortcut.currentKeys) !== JSON.stringify(shortcut.defaultKeys) && (
          <button
            onClick={() => onReset(shortcut.id)}
            className="p-2 text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  </div>
);

const ShortcutEditor: React.FC<{
  shortcut: KeyboardShortcut;
  onSave: (shortcut: KeyboardShortcut) => void;
  onCancel: () => void;
}> = ({ shortcut, onSave, onCancel }) => {
  const [keys, setKeys] = useState<string[]>([]);
  const [recording, setRecording] = useState(false);

  useEffect(() => {
    if (recording) {
      const handler = (e: KeyboardEvent) => {
        e.preventDefault();
        const key = [];
        if (e.ctrlKey) key.push('ctrl');
        if (e.metaKey) key.push('cmd');
        if (e.altKey) key.push('alt');
        if (e.shiftKey) key.push('shift');
        if (!['Control', 'Meta', 'Alt', 'Shift'].includes(e.key)) {
          key.push(e.key.toLowerCase());
        }
        if (key.length > 0) {
          setKeys([key.join('+')]);
          setRecording(false);
        }
      };

      window.addEventListener('keydown', handler);
      return () => window.removeEventListener('keydown', handler);
    }
  }, [recording]);

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h3 className="text-lg font-medium mb-4">{shortcut.name}</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Current Shortcut</label>
          <div className="flex gap-2 items-center">
            <div className="flex gap-2">
              {(keys.length > 0 ? keys : shortcut.currentKeys).map((key, index) => (
                <kbd
                  key={index}
                  className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                >
                  {key}
                </kbd>
              ))}
            </div>
            <button
              onClick={() => setRecording(true)}
              className={`px-4 py-2 text-sm rounded-md ${
                recording
                  ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-100'
                  : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100'
              }`}
            >
              {recording ? 'Recording...' : 'Record Shortcut'}
            </button>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave({ ...shortcut, currentKeys: keys.length > 0 ? keys : shortcut.currentKeys })}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export const ShortcutsPanel: React.FC<ShortcutsPanelProps> = ({ onClose }) => {
  const [shortcuts, setShortcuts] = useState<KeyboardShortcut[]>(() => {
    const saved = localStorage.getItem('keyboard_shortcuts');
    return saved ? JSON.parse(saved) : DEFAULT_SHORTCUTS;
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('keyboard_shortcuts', JSON.stringify(shortcuts));
  }, [shortcuts]);

  const handleSave = (updated: KeyboardShortcut) => {
    setShortcuts(shortcuts.map(s => s.id === updated.id ? updated : s));
    setEditingId(null);
  };

  const handleReset = (id: string) => {
    const defaultShortcut = DEFAULT_SHORTCUTS.find(s => s.id === id);
    if (defaultShortcut) {
      setShortcuts(shortcuts.map(s => s.id === id ? { ...s, currentKeys: defaultShortcut.defaultKeys } : s));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <h2 className="text-lg font-medium">Keyboard Shortcuts</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>
        
        <div className="overflow-y-auto max-h-[calc(80vh-4rem)]">
          <div className="divide-y dark:divide-gray-700">
            {shortcuts.map(shortcut => (
              <div key={shortcut.id}>
                {editingId === shortcut.id ? (
                  <ShortcutEditor
                    shortcut={shortcut}
                    onSave={handleSave}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <ShortcutRow
                    shortcut={shortcut}
                    onEdit={setEditingId}
                    onReset={handleReset}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}; 