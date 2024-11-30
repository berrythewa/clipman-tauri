import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { ClipboardState } from '../types/clipboard'
import { listen } from '@tauri-apps/api/event'
import { invoke } from '@tauri-apps/api/core'
import { ContentType } from '../types/clipboard'
import { useMemo } from 'react';


// Custom storage object to handle Date serialization
const storage = createJSONStorage<ClipboardState>(() => localStorage, {
  reviver: (key, value) => {
    // Convert timestamp strings back to Date objects
    if (key === 'timestamp' && typeof value === 'string') {
      return new Date(value)
    }
    return value
  }
})

function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: number | undefined;
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

// This function initializes the connection between Rust and our React store
export async function initializeClipboardMonitoring() {
  try {
    await invoke('start_clipboard_monitoring')

    const debouncedAddEntry = debounce((payload: { content: string; content_type: string }) => {
      useClipboardStore.getState().addEntry({
        content: payload.content,
        contentType: payload.content_type as ContentType,
      })
    }, 100) // 100ms debounce

    await listen('clipboard-change', (event) => {
      const payload = event.payload as { content: string; content_type: string }
      debouncedAddEntry(payload)
    })
  } catch (error) {
    console.error('Failed to initialize clipboard monitoring:', error)
  }
}


export const useClipboardStore = create(
  persist<ClipboardState>(
    (set, get) => ({
      entries: [],
      filter: {
        search: '',
      },
      addEntry: (entry) => set((state) => ({
        entries: [
          {
            id: crypto.randomUUID(),
            timestamp: new Date(),
            favorite: false,
            ...entry,
          },
          ...state.entries,
        ],
      })),
      removeEntry: (id) => set((state) => ({
        entries: state.entries.filter((entry) => entry.id !== id),
      })),
      toggleFavorite: (id) => set((state) => ({
        entries: state.entries.map((entry) =>
          entry.id === id ? { ...entry, favorite: !entry.favorite } : entry
        ),
      })),
      setFilter: (filter) => set((state) => ({
        filter: { ...state.filter, ...filter },
      })),
      clearHistory: () => set({ entries: [] }),
    }),
    {
      name: 'clipboard-storage',
      storage,
      version: 1,
      migrate: (persistedState: any, version: number) => {
        return {
          ...persistedState,
          filter: { search: '' },
          entries: persistedState.entries || []
        }
      }
    }
  )
)


export const useFilteredEntries = () => {
  const entries = useClipboardStore(state => state.entries)
  const filter = useClipboardStore(state => state.filter)
  
  // Memoize the filtered entries to prevent infinite loops
  return useMemo(() => {
    return entries.filter(entry => {
      if (filter.search) {
        return entry.content.toLowerCase().includes(filter.search.toLowerCase())
      }
      return true
    })
  }, [entries, filter.search]) // Only recompute when entries or search filter changes
}