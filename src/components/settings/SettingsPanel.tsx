import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface Settings {
  history_limit: number;
  dark_mode: boolean;
}

export function SettingsPanel() {
  const [settings, setSettings] = useState<Settings>({ history_limit: 1000, dark_mode: false });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const loadedSettings = await invoke<Settings>('get_settings');
      setSettings(loadedSettings);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (newSettings: Settings) => {
    setIsSaving(true);
    try {
      await invoke('update_settings', { settings: newSettings });
      setSettings(newSettings);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Settings</h1>
      
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">History</h2>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="historyLimit" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                History Limit
              </label>
              <div className="mt-1">
                <select
                  id="historyLimit"
                  value={settings.history_limit}
                  onChange={(e) => saveSettings({ ...settings, history_limit: Number(e.target.value) })}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value={100}>100 items</option>
                  <option value={500}>500 items</option>
                  <option value={1000}>1,000 items</option>
                  <option value={5000}>5,000 items</option>
                  <option value={10000}>10,000 items</option>
                </select>
              </div>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Maximum number of clipboard items to keep in history
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Appearance</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="darkMode" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Dark Mode
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Enable dark mode for the application
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.dark_mode}
                onClick={() => saveSettings({ ...settings, dark_mode: !settings.dark_mode })}
                className={`${
                  settings.dark_mode ? 'bg-blue-600' : 'bg-gray-200'
                } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
              >
                <span
                  aria-hidden="true"
                  className={`${
                    settings.dark_mode ? 'translate-x-5' : 'translate-x-0'
                  } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {isSaving && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg">
          Saving settings...
        </div>
      )}
    </div>
  );
} 