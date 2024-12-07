import React from 'react';
import { ClipboardContent, ClipboardFormat, FileInfo } from '../../types/clipboard';
import { ProgressBar } from './ProgressBar';

interface ClipboardViewerProps {
  content: ClipboardContent;
  onCopy?: (content: ClipboardContent) => void;
  onFavorite?: (content: ClipboardContent) => void;
  onDelete?: (content: ClipboardContent) => void;
  className?: string;
}

const FileIcon: React.FC<{ mimeType?: string }> = ({ mimeType }) => {
  const getIcon = (mime?: string) => {
    if (!mime) return '📎';
    if (mime.startsWith('text/')) return '📄';
    if (mime.startsWith('image/')) return '🖼️';
    if (mime.startsWith('audio/')) return '🎵';
    if (mime.startsWith('video/')) return '🎥';
    if (mime.startsWith('application/')) return '📦';
    if (mime.startsWith('font/')) return '🔤';
    if (mime.startsWith('model/')) return '🎮';
    return '📎';
  };

  return <span className="text-2xl">{getIcon(mimeType)}</span>;
};

const ImagePreview: React.FC<{ content: string; mime_type: string; width: number; height: number }> = ({
  content,
  mime_type,
  width,
  height,
}) => (
  <div className="relative group">
    <img
      src={`data:${mime_type};base64,${content}`}
      alt="Clipboard content"
      className="max-w-full h-auto rounded-lg shadow-md"
      style={{ maxHeight: '300px', objectFit: 'contain' }}
    />
    <div className="absolute bottom-2 right-2 text-xs text-white bg-black/50 px-2 py-1 rounded">
      {width}×{height}
    </div>
  </div>
);

const FileList: React.FC<{ files: FileInfo[] }> = ({ files }) => (
  <div className="space-y-2">
    {files.map((file, index) => (
      <div
        key={index}
        className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-800"
      >
        <FileIcon mimeType={file.mime_type} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {file.name}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {file.mime_type || 'Unknown type'}
            {file.size && ` • ${(file.size / 1024).toFixed(1)} KB`}
            {file.compressed && ' • Compressed'}
          </p>
        </div>
        <div className="flex-shrink-0">
          {!file.exists && (
            <span className="px-2 py-1 text-xs text-red-600 bg-red-100 rounded-full">
              Deleted
            </span>
          )}
        </div>
      </div>
    ))}
  </div>
);

const HtmlPreview: React.FC<{ content: string }> = ({ content }) => (
  <div 
    className="prose dark:prose-invert max-w-full"
    dangerouslySetInnerHTML={{ __html: content }}
  />
);

const RtfPreview: React.FC<{ content: string; plain_text?: string }> = ({ content, plain_text }) => (
  <div className="font-mono text-sm bg-gray-50 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto">
    {plain_text || content}
  </div>
);

const TextPreview: React.FC<{ content: string }> = ({ content }) => (
  <div className="whitespace-pre-wrap font-mono text-sm">{content}</div>
);

export const ClipboardViewer: React.FC<ClipboardViewerProps> = ({
  content,
  onCopy,
  onFavorite,
  onDelete,
  className = '',
}) => {
  const renderContent = (format: ClipboardFormat) => {
    switch (format.format) {
      case 'Image':
        return <ImagePreview {...format} />;
      case 'Files':
        return <FileList files={format.files} />;
      case 'Html':
        return <HtmlPreview content={format.content} />;
      case 'Rtf':
        return <RtfPreview content={format.content} plain_text={format.plain_text} />;
      case 'Text':
        return <TextPreview content={format.content} />;
      case 'FileContent':
        return (
          <div className="space-y-4">
            {format.mime_type && (
              <div className="flex items-center gap-2">
                <FileIcon mimeType={format.mime_type} />
                <span className="text-sm text-gray-600">{format.mime_type}</span>
              </div>
            )}
            {format.compressed && (
              <div className="text-sm text-blue-600">
                Compressed • {(format.total_size / 1024).toFixed(1)} KB
              </div>
            )}
            <ProgressBar
              progress={{
                operation: 'Loading content',
                progress: format.chunks.filter(c => c.complete).length / format.chunks.length,
                bytes_processed: format.chunks.reduce((acc, chunk) => acc + chunk.data.length, 0),
                total_bytes: format.total_size,
              }}
            />
          </div>
        );
    }
  };

  return (
    <div
      className={`relative group p-4 bg-white dark:bg-gray-900 rounded-xl shadow-sm ${className}`}
    >
      {renderContent(content.format)}
      
      <div className="absolute top-2 right-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {onFavorite && (
          <button
            onClick={() => onFavorite(content)}
            className={`p-2 ${
              content.favorite
                ? 'text-yellow-500 hover:text-yellow-600'
                : 'text-gray-400 hover:text-yellow-500'
            }`}
            title={content.favorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        )}
        
        {onCopy && (
          <button
            onClick={() => onCopy(content)}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            title="Copy to clipboard"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
              />
            </svg>
          </button>
        )}

        {onDelete && (
          <button
            onClick={() => onDelete(content)}
            className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
            title="Delete"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        )}
      </div>
      
      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        {new Date(content.timestamp * 1000).toLocaleString()}
      </div>
    </div>
  );
}; 