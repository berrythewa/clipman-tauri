import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import {
  ClipboardContent,
  ProgressInfo,
  ClipboardFilter,
  KeyboardShortcut,
  DEFAULT_SHORTCUTS,
  ErrorDetails,
  ErrorCodes,
  filterClipboardContent,
  createDefaultFilter,
  getErrorMessage,
} from '../types/clipboard';

interface ClipboardState {
  currentContent: ClipboardContent | null;
  history: ClipboardContent[];
  filteredHistory: ClipboardContent[];
  filter: ClipboardFilter;
  shortcuts: KeyboardShortcut[];
  isMonitoring: boolean;
  currentProgress: ProgressInfo | null;
  error: ErrorDetails | null;
  cleanup: (() => void) | null;
  startMonitoring: () => Promise<void>;
  stopMonitoring: () => void;
  copyToClipboard: (content: ClipboardContent) => Promise<void>;
  clearError: () => void;
  setFilter: (filter: Partial<ClipboardFilter>) => void;
  updateShortcut: (shortcut: KeyboardShortcut) => void;
  resetShortcut: (id: string) => void;
  toggleFavorite: (timestamp: number) => void;
  deleteItem: (timestamp: number) => void;
  clearHistory: () => void;
}

export const useClipboardStore = create<ClipboardState>((set, get) => ({
  currentContent: null,
  history: [],
  filteredHistory: [],
  filter: createDefaultFilter(),
  shortcuts: DEFAULT_SHORTCUTS,
  isMonitoring: false,
  currentProgress: null,
  error: null,
  cleanup: null,

  startMonitoring: async () => {
    try {
      console.log('Starting clipboard monitoring...');
      
      // Load initial history from Rust
      const initialHistory = await invoke<ClipboardContent[]>('get_clipboard_history');
      console.log('Loaded initial history:', initialHistory);
      
      set(state => {
        console.log('Setting initial state with history:', initialHistory);
        return {
          history: initialHistory,
          filteredHistory: initialHistory.filter(content =>
            filterClipboardContent(content, state.filter)
          ),
        };
      });
      
      // Clean up previous listeners if they exist
      const currentCleanup = get().cleanup;
      if (currentCleanup) {
        console.log('Cleaning up previous listeners...');
        currentCleanup();
        set({ cleanup: null });
      }

      // Start listening for clipboard events
      const unlistenChange = await listen<ClipboardContent>('clipboard-change', (event) => {
        console.log('Received clipboard change:', event.payload);
        set((state) => {
          const newHistory = [event.payload, ...state.history].slice(0, 100);
          console.log('Updating history with new content:', newHistory);
          return {
            currentContent: event.payload,
            history: newHistory,
            filteredHistory: newHistory.filter(content => 
              filterClipboardContent(content, state.filter)
            ),
          };
        });
      });

      const unlistenProgress = await listen<ProgressInfo>('clipboard-progress', (event) => {
        console.log('Received progress update:', event.payload);
        set({ currentProgress: event.payload });
      });

      // Start the monitoring service
      console.log('Invoking start_clipboard_monitoring...');
      await invoke('start_clipboard_monitoring');
      console.log('Clipboard monitoring started successfully');
      
      // Set up cleanup function
      const cleanup = () => {
        console.log('Cleaning up clipboard monitoring...');
        unlistenChange();
        unlistenProgress();
        set({ isMonitoring: false, cleanup: null });
      };

      set({ isMonitoring: true, cleanup });
    } catch (error) {
      console.error('Failed to start clipboard monitoring:', error);
      set({
        error: {
          code: ErrorCodes.MONITORING_START_FAILED,
          message: getErrorMessage(ErrorCodes.MONITORING_START_FAILED),
          severity: 'error',
          timestamp: Date.now(),
          context: { error: error instanceof Error ? error.message : String(error) },
          retry: get().startMonitoring,
        },
      });
    }
  },

  stopMonitoring: () => {
    const currentCleanup = get().cleanup;
    if (currentCleanup) {
      currentCleanup();
    }
    set({ isMonitoring: false, cleanup: null });
  },

  copyToClipboard: async (content: ClipboardContent) => {
    try {
      await invoke('write_to_clipboard', { content });
    } catch (error) {
      set({
        error: {
          code: ErrorCodes.COPY_FAILED,
          message: getErrorMessage(ErrorCodes.COPY_FAILED),
          severity: 'error',
          timestamp: Date.now(),
          context: { error: error instanceof Error ? error.message : String(error) },
        },
      });
    }
  },

  clearError: () => set({ error: null }),

  setFilter: (newFilter: Partial<ClipboardFilter>) => {
    set((state) => {
      const filter = { ...state.filter, ...newFilter };
      return {
        filter,
        filteredHistory: state.history.filter(content => 
          filterClipboardContent(content, filter)
        ),
      };
    });
  },

  updateShortcut: (shortcut: KeyboardShortcut) => {
    set((state) => ({
      shortcuts: state.shortcuts.map(s => 
        s.id === shortcut.id ? shortcut : s
      ),
    }));
    // Save to localStorage
    localStorage.setItem('keyboard_shortcuts', JSON.stringify(get().shortcuts));
  },

  resetShortcut: (id: string) => {
    const defaultShortcut = DEFAULT_SHORTCUTS.find(s => s.id === id);
    if (defaultShortcut) {
      set((state) => ({
        shortcuts: state.shortcuts.map(s =>
          s.id === id ? { ...s, currentKeys: defaultShortcut.defaultKeys } : s
        ),
      }));
      // Save to localStorage
      localStorage.setItem('keyboard_shortcuts', JSON.stringify(get().shortcuts));
    }
  },

  toggleFavorite: (timestamp: number) => {
    set((state) => {
      const newHistory = state.history.map(content =>
        content.timestamp === timestamp
          ? { ...content, favorite: !content.favorite }
          : content
      );
      return {
        history: newHistory,
        filteredHistory: newHistory.filter(content =>
          filterClipboardContent(content, state.filter)
        ),
      };
    });
  },

  deleteItem: (timestamp: number) => {
    set((state) => {
      const newHistory = state.history.filter(content => 
        content.timestamp !== timestamp
      );
      return {
        history: newHistory,
        filteredHistory: newHistory.filter(content =>
          filterClipboardContent(content, state.filter)
        ),
      };
    });
  },

  clearHistory: async () => {
    try {
      await invoke('clear_clipboard_history');
      set({
        history: [],
        filteredHistory: [],
      });
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  },
}));

// Helper hook for clipboard operations
export const useClipboard = () => {
  const store = useClipboardStore();

  const copyContent = async (content: ClipboardContent) => {
    try {
      await store.copyToClipboard(content);
    } catch (error) {
      console.error('Failed to copy content:', error);
    }
  };

  return {
    ...store,
    copyContent,
  };
}; 