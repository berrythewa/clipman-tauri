import { useCallback, useState } from 'react'
import { Search, Star, Trash2, Copy, Clock } from 'lucide-react'
import { useClipboardStore, useFilteredEntries } from '../../../stores/useClipboardStore'
import { ClipboardEntry } from '../../../types/clipboard'
import { formatDistanceToNow } from 'date-fns'
import {  
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter, 
  DialogClose 
} from '../../ui/dialog/Dialog'
import { Tooltip } from '../../ui/tooltip/Tooltip'
import { ErrorBoundary } from '../../ErrorBoundary'

export function HistoryView() {
    console.log('HistoryView rendering')
    const [selectedEntry, setSelectedEntry] = useState<ClipboardEntry | null>(null)
    const [copyFeedback, setCopyFeedback] = useState(false)
    const entries = useFilteredEntries()
    const { filter, setFilter, removeEntry, toggleFavorite } = useClipboardStore()
    
    console.log('Current entries:', entries)
    console.log('Current filter:', filter)

    const copy = useCallback(async (content: string) => {
      try {
        await navigator.clipboard.writeText(content)
        setCopyFeedback(true)
        setTimeout(() => setCopyFeedback(false), 2000)
      } catch (error) {
        console.error('Failed to copy:', error)
      }
    }, [])

    return (
      <ErrorBoundary>
        <div className="h-full flex flex-col bg-gray-50 relative">
          <div className="p-4 bg-white border-b relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search clips..."
                value={filter.search}
                onChange={(e) => setFilter({ search: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
    
          <div className="flex-1 overflow-auto">
            {entries.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <Clock size={48} className="mb-2" />
                <p>{filter.search ? 'No matching clips found' : 'Waiting for clipboard content...'}</p>
                <p className="text-sm text-gray-400 mt-2">Copy something to see it here</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
                {entries.map((entry) => (
                  <div
                    key={entry.id}
                    onClick={() => setSelectedEntry(entry)}
                    className="group bg-white rounded-lg p-3 shadow hover:shadow-md cursor-pointer transition-all duration-200 border border-transparent hover:border-blue-200"
                  >
                    <p className="text-sm line-clamp-2">{entry.content}</p>
                    <div className="mt-2 flex justify-between items-center">
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock size={12} />
                        {formatDistanceToNow(entry.timestamp, { addSuffix: true })}
                      </span>
                      {entry.favorite && <Star size={14} className="text-yellow-500" />}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
    
          <Dialog open={selectedEntry !== null} onClose={() => setSelectedEntry(null)}>
            {selectedEntry && (
              <>
                <DialogHeader>
                  <DialogTitle>Clipboard Entry</DialogTitle>
                  <DialogClose onClose={() => setSelectedEntry(null)} />
                </DialogHeader>
                <DialogContent>
                  <div 
                    className="bg-gray-50 rounded-lg"
                    style={{
                      maxHeight: 'min(60vh, 400px)',
                      overflowY: 'auto'
                    }}
                  >
                    <pre 
                      className="p-4 text-sm whitespace-pre-wrap break-words font-mono"
                      style={{
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word'
                      }}
                    >
                      {selectedEntry.content}
                    </pre>
                  </div>
                </DialogContent>
                <DialogFooter>
                  <Tooltip content={copyFeedback ? 'Copied!' : 'Copy to clipboard'} position="top">
                    <button 
                      onClick={() => copy(selectedEntry.content)}
                      className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                    >
                      <Copy className={copyFeedback ? 'text-green-500' : ''} />
                    </button>
                  </Tooltip>
                  <Tooltip content={selectedEntry.favorite ? 'Remove from favorites' : 'Add to favorites'}>
                    <button 
                      onClick={() => toggleFavorite(selectedEntry.id)}
                      className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                    >
                      <Star className={selectedEntry.favorite ? "text-yellow-500" : ""} />
                    </button>
                  </Tooltip>
                  <Tooltip content="Delete">
                    <button 
                      onClick={() => {
                        removeEntry(selectedEntry.id)
                        setSelectedEntry(null)
                      }}
                      className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                    >
                      <Trash2 className="text-red-500" />
                    </button>
                  </Tooltip>
                </DialogFooter>
              </>
            )}
          </Dialog>
        </div>
      </ErrorBoundary>
    )
}