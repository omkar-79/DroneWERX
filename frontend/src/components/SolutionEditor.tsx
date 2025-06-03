import React, { useState, useRef } from 'react';
import {
  Bold,
  Italic,
  List,
  Link,
  Image,
  Video,
  Upload,
  FileText,
  X,
  Eye,
  Save,
  Send,
  Paperclip,
  Plus
} from 'lucide-react';
import type { Solution } from '../types';

interface SolutionEditorProps {
  solution?: Solution;
  onSubmit: (content: string, attachments: File[], mediaFiles: File[]) => void;
  onCancel: () => void;
  isEdit?: boolean;
}

export const SolutionEditor: React.FC<SolutionEditorProps> = ({
  solution,
  onSubmit,
  onCancel,
  isEdit = false
}) => {
  const [content, setContent] = useState(solution?.content || '');
  const [showPreview, setShowPreview] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);

  const formatText = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    updateContent();
  };

  const updateContent = () => {
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
  };

  const handleFileUpload = (files: FileList | null, type: 'attachment' | 'media') => {
    if (!files) return;
    
    const newFiles = Array.from(files).filter(file => {
      if (type === 'media') {
        return file.type.startsWith('image/') || file.type.startsWith('video/');
      }
      return file.size <= 50 * 1024 * 1024; // 50MB limit
    });

    if (type === 'media') {
      setMediaFiles(prev => [...prev, ...newFiles]);
    } else {
      setAttachments(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number, type: 'attachment' | 'media') => {
    if (type === 'media') {
      setMediaFiles(prev => prev.filter((_, i) => i !== index));
    } else {
      setAttachments(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFileUpload(e.dataTransfer.files, 'media');
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleSubmit = () => {
    if (content.trim()) {
      onSubmit(content, attachments, mediaFiles);
    }
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      formatText('createLink', url);
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image size={16} className="text-blue-500" />;
    if (file.type.startsWith('video/')) return <Video size={16} className="text-purple-500" />;
    return <FileText size={16} className="text-gray-500" />;
  };

  return (
    <div className="bg-surface border border-border rounded-xl p-6">
      <h3 className="font-semibold text-primary mb-4">
        {isEdit ? 'Edit Solution' : 'Submit Your Solution'}
      </h3>

      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 border border-border rounded-t-lg bg-background-alt">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => formatText('bold')}
            className="p-2 hover:bg-surface rounded transition-colors"
            title="Bold"
          >
            <Bold size={16} />
          </button>
          <button
            type="button"
            onClick={() => formatText('italic')}
            className="p-2 hover:bg-surface rounded transition-colors"
            title="Italic"
          >
            <Italic size={16} />
          </button>
          <button
            type="button"
            onClick={() => formatText('insertUnorderedList')}
            className="p-2 hover:bg-surface rounded transition-colors"
            title="Bullet List"
          >
            <List size={16} />
          </button>
          <button
            type="button"
            onClick={insertLink}
            className="p-2 hover:bg-surface rounded transition-colors"
            title="Add Link"
          >
            <Link size={16} />
          </button>
          
          <div className="h-4 w-px bg-border mx-2" />
          
          <button
            type="button"
            onClick={() => mediaInputRef.current?.click()}
            className="p-2 hover:bg-surface rounded transition-colors"
            title="Add Image/Video"
          >
            <Image size={16} />
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 hover:bg-surface rounded transition-colors"
            title="Add Document"
          >
            <Paperclip size={16} />
          </button>
        </div>

        <button
          type="button"
          onClick={() => setShowPreview(!showPreview)}
          className="flex items-center space-x-2 px-3 py-1 text-sm bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
        >
          <Eye size={14} />
          <span>{showPreview ? 'Edit' : 'Preview'}</span>
        </button>
      </div>

      {/* Editor */}
      {!showPreview ? (
        <div
          ref={editorRef}
          contentEditable
          onInput={updateContent}
          className="min-h-[300px] p-4 border border-t-0 border-border rounded-b-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
          data-placeholder="Describe your solution in detail. Include technical specifications, implementation approach, expected outcomes, and any testing results..."
          style={{ wordBreak: 'break-word' }}
          dangerouslySetInnerHTML={{ __html: content }}
        />
      ) : (
        <div className="min-h-[300px] p-4 border border-t-0 border-border rounded-b-lg bg-background-alt">
          <div 
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>
      )}

      {/* Media Upload Zone */}
      <div
        className={`mt-4 border-2 border-dashed rounded-lg p-6 text-center transition-all ${
          dragActive 
            ? 'border-primary bg-primary/5' 
            : 'border-border hover:border-primary/50'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDrag}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
      >
        <div className="flex items-center justify-center space-x-4">
          <Upload size={32} className="text-muted" />
          <div>
            <p className="text-muted mb-1">
              Drag and drop images/videos here, or{' '}
              <button
                type="button"
                onClick={() => mediaInputRef.current?.click()}
                className="text-primary hover:underline"
              >
                browse
              </button>
            </p>
            <p className="text-xs text-muted">
              Support: JPG, PNG, GIF, MP4, WebM (max 100MB each)
            </p>
          </div>
        </div>
      </div>

      {/* Media Preview */}
      {mediaFiles.length > 0 && (
        <div className="mt-4">
          <h4 className="font-medium text-primary mb-3">Media Attachments</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {mediaFiles.map((file, index) => (
              <div key={index} className="relative group">
                {file.type.startsWith('image/') ? (
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className="w-full h-24 object-cover rounded-lg border border-border"
                  />
                ) : (
                  <div className="w-full h-24 bg-background-alt rounded-lg border border-border flex items-center justify-center">
                    <Video size={24} className="text-purple-500" />
                  </div>
                )}
                <button
                  onClick={() => removeFile(index, 'media')}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-error text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={12} />
                </button>
                <p className="text-xs text-muted mt-1 truncate">{file.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Document Attachments */}
      {attachments.length > 0 && (
        <div className="mt-4">
          <h4 className="font-medium text-primary mb-3">Document Attachments</h4>
          <div className="space-y-2">
            {attachments.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-background-alt rounded-lg border border-border"
              >
                <div className="flex items-center space-x-3">
                  {getFileIcon(file)}
                  <div>
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(index, 'attachment')}
                  className="p-1 hover:bg-error/10 hover:text-error rounded transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Guidelines */}
      <div className="mt-4 p-4 bg-info/10 border border-info/20 rounded-lg">
        <h4 className="font-medium text-info mb-2">💡 Solution Guidelines</h4>
        <ul className="text-sm text-muted space-y-1">
          <li>• Include detailed technical specifications and implementation steps</li>
          <li>• Add images, diagrams, or videos to demonstrate your concept</li>
          <li>• Specify cost estimates, timeline, and required resources</li>
          <li>• Reference any testing results or validation data</li>
          <li>• Consider operational constraints and deployment challenges</li>
        </ul>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between mt-6">
        <div className="text-sm text-muted">
          {isEdit ? 'Changes will be marked as edited' : 'Once submitted, you can edit your solution at any time'}
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-border rounded-lg hover:bg-surface-hover transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!content.trim()}
            className="flex items-center space-x-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isEdit ? <Save size={16} /> : <Send size={16} />}
            <span>{isEdit ? 'Update Solution' : 'Submit Solution'}</span>
          </button>
        </div>
      </div>

      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.txt,.md"
        onChange={(e) => handleFileUpload(e.target.files, 'attachment')}
        className="hidden"
      />
      <input
        ref={mediaInputRef}
        type="file"
        multiple
        accept="image/*,video/*"
        onChange={(e) => handleFileUpload(e.target.files, 'media')}
        className="hidden"
      />
    </div>
  );
}; 