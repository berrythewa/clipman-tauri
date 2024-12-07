export interface ProgressInfo {
  operation: string;
  progress: number;  // 0.0 to 1.0
  bytes_processed: number;
  total_bytes: number;
  eta_seconds?: number;
  speed_bytes_per_second?: number;
}

export interface ChunkedContent {
  chunk_index: number;
  total_chunks: number;
  data: string;  // Base64 encoded
  complete: boolean;
  compressed: boolean;
}

export interface FileInfo {
  path: string;
  name: string;
  extension?: string;
  exists: boolean;
  size?: number;
  mime_type?: string;
  compressed: boolean;
}

export const ClipboardFormats = {
  Text: 'Text',
  Image: 'Image',
  Html: 'Html',
  Rtf: 'Rtf',
  Files: 'Files',
  FileContent: 'FileContent',
} as const;

export type ClipboardFormatType = keyof typeof ClipboardFormats;

export type ClipboardFormat = 
  | { format: 'Text', content: string }
  | { format: 'Image', content: string, mime_type: string, width: number, height: number }
  | { format: 'Html', content: string, plain_text?: string }
  | { format: 'Rtf', content: string, plain_text?: string }
  | { format: 'Files', files: FileInfo[], has_raw_data: boolean }
  | { format: 'FileContent', chunks: ChunkedContent[], original_path?: string, mime_type?: string, total_size: number, compressed: boolean };

export interface ClipboardContent {
  format: ClipboardFormat;
  timestamp: number;
  favorite: boolean;
}

export interface ClipboardFilter {
  search: string;
  types: Set<ClipboardFormatType>;
  dateRange: {
    start?: Date;
    end?: Date;
  };
  sizeRange?: {
    min?: number;  // in bytes
    max?: number;  // in bytes
  };
  mimeTypes: Set<string>;
  onlyCompressed?: boolean;
  onlyFavorites?: boolean;
}

export interface KeyboardShortcut {
  id: string;
  name: string;
  description: string;
  defaultKeys: string[];
  currentKeys: string[];
  action: string;
  context?: 'global' | 'history' | 'viewer';
}

export interface ErrorDetails {
  code: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'fatal';
  timestamp: number;
  context?: Record<string, unknown>;
  retry?: () => Promise<void>;
}

// Keyboard shortcut actions
export const ShortcutActions = {
  COPY_CURRENT: 'copy_current',
  TOGGLE_FAVORITE: 'toggle_favorite',
  CLEAR_HISTORY: 'clear_history',
  TOGGLE_MONITORING: 'toggle_monitoring',
  SEARCH_FOCUS: 'search_focus',
  NEXT_ITEM: 'next_item',
  PREVIOUS_ITEM: 'previous_item',
  DELETE_ITEM: 'delete_item',
  TOGGLE_FILTER_PANEL: 'toggle_filter_panel',
  TOGGLE_SHORTCUTS_PANEL: 'toggle_shortcuts_panel',
} as const;

export type ShortcutAction = keyof typeof ShortcutActions;

// Default keyboard shortcuts
export const DEFAULT_SHORTCUTS: KeyboardShortcut[] = [
  {
    id: 'copy_current',
    name: 'Copy Current',
    description: 'Copy currently selected item to clipboard',
    defaultKeys: ['ctrl+c', 'cmd+c'],
    currentKeys: ['ctrl+c', 'cmd+c'],
    action: ShortcutActions.COPY_CURRENT,
    context: 'viewer'
  },
  {
    id: 'toggle_favorite',
    name: 'Toggle Favorite',
    description: 'Toggle favorite status of current item',
    defaultKeys: ['ctrl+d', 'cmd+d'],
    currentKeys: ['ctrl+d', 'cmd+d'],
    action: ShortcutActions.TOGGLE_FAVORITE,
    context: 'viewer'
  },
  {
    id: 'search_focus',
    name: 'Focus Search',
    description: 'Focus the search input',
    defaultKeys: ['ctrl+f', 'cmd+f'],
    currentKeys: ['ctrl+f', 'cmd+f'],
    action: ShortcutActions.SEARCH_FOCUS,
    context: 'global'
  },
  // Add more default shortcuts...
];

// Error codes and messages
export const ErrorCodes = {
  MONITORING_START_FAILED: 'MONITORING_START_FAILED',
  COPY_FAILED: 'COPY_FAILED',
  WRITE_FAILED: 'WRITE_FAILED',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  INVALID_DATA: 'INVALID_DATA',
  NETWORK_ERROR: 'NETWORK_ERROR',
} as const;

export const getErrorMessage = (code: keyof typeof ErrorCodes): string => {
  const messages: Record<keyof typeof ErrorCodes, string> = {
    MONITORING_START_FAILED: 'Failed to start clipboard monitoring',
    COPY_FAILED: 'Failed to copy content to clipboard',
    WRITE_FAILED: 'Failed to write content to clipboard',
    PERMISSION_DENIED: 'Permission denied to access clipboard',
    INVALID_DATA: 'Invalid clipboard data format',
    NETWORK_ERROR: 'Network connection error',
  };
  return messages[code];
};

// Helper functions for filtering
export const createDefaultFilter = (): ClipboardFilter => ({
  search: '',
  types: new Set(),
  dateRange: {},
  mimeTypes: new Set(),
  onlyCompressed: false,
  onlyFavorites: false,
});

export const filterClipboardContent = (
  content: ClipboardContent,
  filter: ClipboardFilter
): boolean => {
  // Type filter
  if (filter.types.size > 0 && !filter.types.has(content.format.format)) {
    return false;
  }

  // Date range filter
  if (filter.dateRange.start && content.timestamp * 1000 < filter.dateRange.start.getTime()) {
    return false;
  }
  if (filter.dateRange.end && content.timestamp * 1000 > filter.dateRange.end.getTime()) {
    return false;
  }

  // Size filter for applicable formats
  if (filter.sizeRange) {
    const size = getContentSize(content);
    if (filter.sizeRange.min && size < filter.sizeRange.min) return false;
    if (filter.sizeRange.max && size > filter.sizeRange.max) return false;
  }

  // MIME type filter
  if (filter.mimeTypes.size > 0) {
    const mime = getContentMimeType(content);
    if (!mime || !filter.mimeTypes.has(mime)) return false;
  }

  // Compression filter
  if (filter.onlyCompressed && !isContentCompressed(content)) {
    return false;
  }

  // Favorites filter
  if (filter.onlyFavorites && !content.favorite) {
    return false;
  }

  return true;
};

// Helper functions for content properties
const getContentSize = (content: ClipboardContent): number => {
  switch (content.format.format) {
    case 'FileContent':
      return content.format.total_size;
    case 'Files':
      return content.format.files.reduce((acc, f) => acc + (f.size || 0), 0);
    case 'Image':
    case 'Html':
    case 'Rtf':
    case 'Text':
      return new Blob([content.format.content]).size;
  }
};

const getContentMimeType = (content: ClipboardContent): string | undefined => {
  switch (content.format.format) {
    case 'Image':
      return content.format.mime_type;
    case 'FileContent':
      return content.format.mime_type;
    case 'Html':
      return 'text/html';
    case 'Rtf':
      return 'text/rtf';
    case 'Text':
      return 'text/plain';
    case 'Files':
      return content.format.files[0]?.mime_type;
  }
};

const isContentCompressed = (content: ClipboardContent): boolean => {
  switch (content.format.format) {
    case 'FileContent':
      return content.format.compressed;
    case 'Files':
      return content.format.files.some(f => f.compressed);
    default:
      return false;
  }
};

export interface ClipboardState {
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