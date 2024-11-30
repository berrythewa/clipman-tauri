export type ContentType = 'text' | 'image' | 'file'

export interface ClipboardEntry {
  id: string
  content: string
  contentType: ContentType
  timestamp: Date
  favorite: boolean
  roomId?: string
}

export interface ClipboardFilter {
  search: string
  type?: ContentType
  roomId?: string
  favorites?: boolean
}

export interface ClipboardState {
    entries: ClipboardEntry[]
    filter: ClipboardFilter
    setFilter: (filter: Partial<ClipboardFilter>) => void
    addEntry: (entry: Omit<ClipboardEntry, 'id' | 'timestamp' | 'favorite'>) => void
    removeEntry: (id: string) => void
    toggleFavorite: (id: string) => void
    clearHistory: () => void
  }