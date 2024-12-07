import { useState } from 'react'
import { format } from 'date-fns'
import { ClipboardContent } from '../../../types/clipboard'
import { useClipboard } from '../../../stores/clipboardStore'

function groupEntriesByDate(entries: ClipboardContent[]) {
  return entries.reduce((groups, entry) => {
    const date = new Date(entry.timestamp * 1000)
    const dateKey = format(date, 'yyyy-MM-dd')
    
    if (!groups[dateKey]) {
      groups[dateKey] = []
    }
    
    // Skip empty or very short content
    if (entry.format.format === 'Text' && !entry.format.content.trim()) {
      return groups;
    }
    
    groups[dateKey].push(entry)
    return groups
  }, {} as Record<string, ClipboardContent[]>)
}

function formatContent(content: string): string {
  // Trim and limit length for display
  const trimmed = content.trim();
  if (trimmed.length > 100) {
    return trimmed.slice(0, 100) + '...';
  }
  return trimmed;
}

export function HistoryView() {
  const { filteredHistory, copyContent, toggleFavorite, deleteItem } = useClipboard()
  const [selectedEntry, setSelectedEntry] = useState<ClipboardContent | null>(null)

  console.log('HistoryView rendered with history:', filteredHistory);

  const groupedEntries = groupEntriesByDate(filteredHistory)
  const dates = Object.keys(groupedEntries).sort().reverse()

  console.log('Grouped entries:', groupedEntries);
  console.log('Dates:', dates);

  return (
    <div className="p-6 min-h-screen bg-gray-100 dark:bg-gray-900">
      {dates.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-96 text-gray-500 dark:text-gray-400">
          <p className="text-lg font-medium">No clipboard history yet</p>
          <p className="text-sm">Copy something to see it here</p>
        </div>
      ) : (
        <div className="space-y-6 max-w-4xl mx-auto">
          {dates.map(date => {
            console.log(`Rendering entries for date: ${date}`, groupedEntries[date]);
            return (
              <div key={date}>
                <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  {format(new Date(date), 'MMMM d, yyyy')}
                </h2>
                <div className="space-y-2">
                  {groupedEntries[date].map(entry => (
                    <div
                      key={entry.timestamp}
                      className={`p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm cursor-pointer transition-colors
                        ${selectedEntry?.timestamp === entry.timestamp ? 'ring-2 ring-blue-500' : ''}
                        hover:bg-gray-50 dark:hover:bg-gray-700`}
                      onClick={() => setSelectedEntry(entry)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {entry.favorite && (
                              <span className="text-yellow-500">★</span>
                            )}
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                              {entry.format.format === 'Text' ? formatContent(entry.format.content) : 
                               entry.format.format === 'Image' ? 'Image' :
                               entry.format.format === 'Files' ? `${entry.format.files.length} file(s)` :
                               entry.format.format}
                            </p>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {format(new Date(entry.timestamp * 1000), 'h:mm a')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleFavorite(entry.timestamp)
                            }}
                            className={`p-1 rounded-full ${
                              entry.favorite
                                ? 'text-yellow-500 hover:text-yellow-600'
                                : 'text-gray-400 hover:text-yellow-500'
                            }`}
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              copyContent(entry)
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteItem(entry.timestamp)
                            }}
                            className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  )
}