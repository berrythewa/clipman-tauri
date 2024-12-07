import { useCallback, useState, useMemo } from 'react'
import { Search, Star, Trash2, Copy, Clock, Code, Link as LinkIcon, Filter } from 'lucide-react'
import { useClipboardStore, useFilteredEntries } from '../../../stores/useClipboardStore'
import { ClipboardEntry } from '../../../types/clipboard'
import { formatDistanceToNow, isToday, isYesterday, format, startOfWeek, isThisWeek } from 'date-fns'
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

type EntryType = 'text' | 'code' | 'link'

interface FilterOptions {
  type?: EntryType
  favoritesOnly: boolean
}

function detectEntryType(content: string): EntryType {
  // Simple URL detection
  if (/^https?:\/\/[^\s]+$/.test(content.trim())) {
    return 'link'
  }
  // Simple code detection (starts with common programming patterns)
  if (/^(import|function|class|const|let|var|if|for|while|def|package|#include)/.test(content.trim())) {
    return 'code'
  }
  return 'text'
}

function groupEntriesByDate(entries: ClipboardEntry[]) {
  return entries.reduce((groups, entry) => {
    const date = new Date(entry.timestamp)
    let key = 'Older'

    if (isToday(date)) {
      key = 'Today'
    } else if (isYesterday(date)) {
      key = 'Yesterday'
    } else if (isThisWeek(date)) {
      key = 'This Week'
    } else {
      key = format(date, 'MMMM yyyy')
    }

    if (!groups[key]) {
      groups[key] = []
    }
    groups[key].push(entry)
    return groups
  }, {} as Record<string, ClipboardEntry[]>)
}

export function HistoryView() {
    console.log('HistoryView rendering')
    const [selectedEntry, setSelectedEntry] = useState<ClipboardEntry | null>(null)
    const [copyFeedback, setCopyFeedback] = useState(false)
    const [filterOptions, setFilterOptions] = useState<FilterOptions>({
      favoritesOnly: false,
    })
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    
    const entries = useFilteredEntries()
    const { filter, setFilter, removeEntry, toggleFavorite } = useClipboardStore()
    
    console.log('Current entries:', entries)
    console.log('Current filter:', filter)

    const filteredEntries = useMemo(() => {
      return entries.filter(entry => {
        if (filterOptions.favoritesOnly && !entry.favorite) return false
        if (filterOptions.type && detectEntryType(entry.content) !== filterOptions.type) return false
        return true
      })
    }, [entries, filterOptions])

    const groupedEntries = useMemo(() => {
      return groupEntriesByDate(filteredEntries)
    }, [filteredEntries])

    const copy = useCallback(async (content: string) => {
      try {
        await navigator.clipboard.writeText(content)
        setCopyFeedback(true)
        setTimeout(() => setCopyFeedback(false), 2000)
      } catch (error) {
        console.error('Failed to copy:', error)
      }
    }, [])

    const getEntryIcon = (content: string) => {
      const type = detectEntryType(content)
      switch (type) {
        case 'code':
          return <Code size={16} className="text-purple-500" />
        case 'link':
          return <LinkIcon size={16} className="text-blue-500" />
        default:
          return null
      }
    }

    return (
      <ErrorBoundary>
        <div className="h-full flex flex-col bg-gray-50 relative">
          <div className="p-4 bg-white border-b">
            <div className="flex gap-4 items-center">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search clips... (Press '/' to focus)"
                  value={filter.search}
                  onChange={(e) => setFilter({ search: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              <div className="flex items-center gap-2">
                <Tooltip content="Show favorites only" position="bottom">
                  <button
                    onClick={() => setFilterOptions(prev => ({ ...prev, favoritesOnly: !prev.favoritesOnly }))}
                    className={`p-2 rounded-lg transition-colors ${filterOptions.favoritesOnly ? 'bg-yellow-100 text-yellow-600' : 'hover:bg-gray-100'}`}
                  >
                    <Star size={20} />
                  </button>
                </Tooltip>
                <div className="relative">
                  <Tooltip content="Filter by type" position="bottom">
                    <button
                      onClick={() => setIsFilterOpen(!isFilterOpen)}
                      className={`p-2 rounded-lg transition-colors ${isFilterOpen ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'}`}
                    >
                      <Filter size={20} />
                    </button>
                  </Tooltip>
                  {isFilterOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsFilterOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 bg-white rounded-lg shadow-lg border p-2 space-y-1 z-20">
                        {(['text', 'code', 'link'] as const).map(type => (
                          <button
                            key={type}
                            onClick={() => {
                              setFilterOptions(prev => ({ ...prev, type }));
                              setIsFilterOpen(false);
                            }}
                            className={`w-full px-3 py-1 rounded-md text-left capitalize ${filterOptions.type === type ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'}`}
                          >
                            {type}
                          </button>
                        ))}
                        {filterOptions.type && (
                          <button
                            onClick={() => {
                              setFilterOptions(prev => ({ ...prev, type: undefined }));
                              setIsFilterOpen(false);
                            }}
                            className="w-full px-3 py-1 rounded-md text-left text-gray-500 hover:bg-gray-50"
                          >
                            Clear filter
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
    
          <div className="flex-1 overflow-auto">
            {Object.entries(groupedEntries).length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <Clock size={48} className="mb-2" />
                <p>{filter.search ? 'No matching clips found' : 'Waiting for clipboard content...'}</p>
                <p className="text-sm text-gray-400 mt-2">Copy something to see it here</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {Object.entries(groupedEntries).map(([date, dateEntries]) => (
                  <div key={date} className="bg-white">
                    <div className="sticky top-0 bg-gray-50 px-4 py-2 border-b">
                      <h2 className="text-sm font-medium text-gray-500">{date}</h2>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {dateEntries.map((entry) => (
                        <div
                          key={entry.id}
                          onClick={() => setSelectedEntry(entry)}
                          className="group px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center gap-3"
                        >
                          <div className="flex-shrink-0">
                            {getEntryIcon(entry.content)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900 truncate">{entry.content}</p>
                            <p className="text-xs text-gray-500 flex items-center gap-2">
                              <span className="flex items-center gap-1">
                                <Clock size={12} />
                                {formatDistanceToNow(entry.timestamp, { addSuffix: true })}
                              </span>
                              {entry.favorite && (
                                <span className="flex items-center gap-1">
                                  <Star size={12} className="text-yellow-500" />
                                  <span className="text-yellow-600">Favorite</span>
                                </span>
                              )}
                            </p>
                          </div>
                          <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                copy(entry.content);
                              }}
                              className="p-1 hover:bg-gray-200 rounded-md"
                            >
                              <Copy size={14} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(entry.id);
                              }}
                              className="p-1 hover:bg-gray-200 rounded-md"
                            >
                              <Star size={14} className={entry.favorite ? 'text-yellow-500' : ''} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeEntry(entry.id);
                              }}
                              className="p-1 hover:bg-gray-200 rounded-md text-red-500 hover:text-red-600"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
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
                  <DialogTitle>
                    <div className="flex items-center gap-2">
                      {getEntryIcon(selectedEntry.content)}
                      <span>Clipboard Entry</span>
                    </div>
                  </DialogTitle>
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
                      <Star className={selectedEntry.favorite ? 'text-yellow-500' : ''} />
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