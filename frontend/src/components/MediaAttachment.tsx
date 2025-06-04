import React, { useState } from 'react';
import {
  ImageIcon,
  Video,
  FileText,
  Download,
  Eye,
  Play,
  X,
  ZoomIn,
  ExternalLink,
  File
} from 'lucide-react';
import type { Attachment } from '../types';
import { mediaAPI } from '../services/api';

interface MediaAttachmentProps {
  attachment: Attachment;
  showActions?: boolean;
  onDelete?: (attachmentId: string) => void;
  className?: string;
}

interface MediaGalleryProps {
  attachments: Attachment[];
  showActions?: boolean;
  onDelete?: (attachmentId: string) => void;
  className?: string;
}

export const MediaAttachment: React.FC<MediaAttachmentProps> = ({
  attachment,
  showActions = true,
  onDelete,
  className = ''
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = () => {
    if (attachment.isImage) {
      return <ImageIcon size={20} className="text-blue-500" />;
    } else if (attachment.isVideo) {
      return <Video size={20} className="text-purple-500" />;
    } else if (attachment.mimeType.includes('pdf')) {
      return <FileText size={20} className="text-red-500" />;
    } else if (attachment.mimeType.includes('word') || attachment.mimeType.includes('document')) {
      return <FileText size={20} className="text-blue-600" />;
    } else if (attachment.mimeType.includes('excel') || attachment.mimeType.includes('spreadsheet')) {
      return <FileText size={20} className="text-green-600" />;
    } else {
      return <File size={20} className="text-gray-500" />;
    }
  };

  const handleDownload = async () => {
    setIsLoading(true);
    try {
      const response = await mediaAPI.getDownloadUrl(attachment.id);
      if (response.success && response.data?.downloadUrl) {
        // Open download URL in new tab
        window.open(response.data.downloadUrl, '_blank');
      }
    } catch (error) {
      console.error('Failed to download file:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleView = () => {
    if (attachment.isImage) {
      setShowLightbox(true);
    } else if (attachment.isVideo) {
      // For videos, open in new tab for now
      window.open(attachment.url, '_blank');
    } else {
      // For documents, open in new tab
      window.open(attachment.url, '_blank');
    }
  };

  const handleDelete = async () => {
    if (!onDelete || !window.confirm('Are you sure you want to delete this attachment?')) {
      return;
    }
    
    setIsLoading(true);
    try {
      await mediaAPI.deleteAttachment(attachment.id);
      onDelete(attachment.id);
    } catch (error) {
      console.error('Failed to delete attachment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (attachment.isImage) {
    return (
      <>
        <div className={`relative group bg-surface border border-border rounded-lg overflow-hidden ${className}`}>
          <div className="aspect-video w-full">
            <img
              src={attachment.url}
              alt={attachment.originalName}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
          
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="absolute inset-0 flex items-center justify-center space-x-2">
              <button
                onClick={handleView}
                className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                title="View full size"
              >
                <ZoomIn className="text-white" size={20} />
              </button>
              {showActions && (
                <>
                  <button
                    onClick={handleDownload}
                    disabled={isLoading}
                    className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors disabled:opacity-50"
                    title="Download"
                  >
                    <Download className="text-white" size={20} />
                  </button>
                  {onDelete && (
                    <button
                      onClick={handleDelete}
                      disabled={isLoading}
                      className="p-2 bg-red-500/20 rounded-full hover:bg-red-500/30 transition-colors disabled:opacity-50"
                      title="Delete"
                    >
                      <X className="text-white" size={20} />
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* File info */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
            <p className="text-white text-sm font-medium truncate">{attachment.originalName}</p>
            <p className="text-white/70 text-xs">{formatFileSize(attachment.size)}</p>
          </div>
        </div>

        {/* Lightbox */}
        {showLightbox && (
          <div 
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setShowLightbox(false)}
          >
            <div className="relative max-w-full max-h-full">
              <img
                src={attachment.url}
                alt={attachment.originalName}
                className="max-w-full max-h-full object-contain"
              />
              <button
                onClick={() => setShowLightbox(false)}
                className="absolute top-4 right-4 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
              >
                <X className="text-white" size={24} />
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  if (attachment.isVideo) {
    return (
      <div className={`relative group bg-surface border border-border rounded-lg overflow-hidden ${className}`}>
        <div className="aspect-video w-full bg-background-alt flex items-center justify-center">
          <div className="text-center">
            <Video size={48} className="text-purple-500 mx-auto mb-2" />
            <p className="text-sm font-medium">{attachment.originalName}</p>
            <p className="text-xs text-muted">{formatFileSize(attachment.size)}</p>
          </div>
        </div>
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="absolute inset-0 flex items-center justify-center space-x-2">
            <button
              onClick={handleView}
              className="p-3 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
              title="Play video"
            >
              <Play className="text-white" size={24} />
            </button>
            {showActions && (
              <>
                <button
                  onClick={handleDownload}
                  disabled={isLoading}
                  className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors disabled:opacity-50"
                  title="Download"
                >
                  <Download className="text-white" size={20} />
                </button>
                {onDelete && (
                  <button
                    onClick={handleDelete}
                    disabled={isLoading}
                    className="p-2 bg-red-500/20 rounded-full hover:bg-red-500/30 transition-colors disabled:opacity-50"
                    title="Delete"
                  >
                    <X className="text-white" size={20} />
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Document/file attachment
  return (
    <div className={`bg-surface border border-border rounded-lg p-4 hover:border-primary/20 transition-colors ${className}`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {getFileIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-primary truncate">{attachment.originalName}</p>
          <p className="text-sm text-muted">{formatFileSize(attachment.size)}</p>
          <p className="text-xs text-muted">{attachment.mimeType}</p>
        </div>
        
        {showActions && (
          <div className="flex items-center space-x-1">
            <button
              onClick={handleView}
              className="p-2 rounded-lg hover:bg-surface-hover transition-colors"
              title="View"
            >
              <ExternalLink size={16} className="text-muted" />
            </button>
            <button
              onClick={handleDownload}
              disabled={isLoading}
              className="p-2 rounded-lg hover:bg-surface-hover transition-colors disabled:opacity-50"
              title="Download"
            >
              <Download size={16} className="text-muted" />
            </button>
            {onDelete && (
              <button
                onClick={handleDelete}
                disabled={isLoading}
                className="p-2 rounded-lg hover:bg-surface-hover text-error transition-colors disabled:opacity-50"
                title="Delete"
              >
                <X size={16} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export const MediaGallery: React.FC<MediaGalleryProps> = ({
  attachments,
  showActions = true,
  onDelete,
  className = ''
}) => {
  if (!attachments || attachments.length === 0) {
    return null;
  }

  const images = attachments.filter(att => att.isImage);
  const videos = attachments.filter(att => att.isVideo);
  const documents = attachments.filter(att => att.isDocument);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Images Grid */}
      {images.length > 0 && (
        <div>
          <h4 className="font-medium text-primary mb-3 flex items-center space-x-2">
            <ImageIcon size={16} />
            <span>Images ({images.length})</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {images.map((attachment) => (
              <MediaAttachment
                key={attachment.id}
                attachment={attachment}
                showActions={showActions}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      )}

      {/* Videos Grid */}
      {videos.length > 0 && (
        <div>
          <h4 className="font-medium text-primary mb-3 flex items-center space-x-2">
            <Video size={16} />
            <span>Videos ({videos.length})</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {videos.map((attachment) => (
              <MediaAttachment
                key={attachment.id}
                attachment={attachment}
                showActions={showActions}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      )}

      {/* Documents List */}
      {documents.length > 0 && (
        <div>
          <h4 className="font-medium text-primary mb-3 flex items-center space-x-2">
            <FileText size={16} />
            <span>Documents ({documents.length})</span>
          </h4>
          <div className="space-y-2">
            {documents.map((attachment) => (
              <MediaAttachment
                key={attachment.id}
                attachment={attachment}
                showActions={showActions}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}; 