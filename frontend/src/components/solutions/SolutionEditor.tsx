import React, { useState, useRef } from 'react';
import {
  Save,
  X,
  Bold,
  Italic,
  List,
  Link,
  Image,
  FileText,
  Upload,
  Video,
  Plus,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import type { Solution } from '../../types';

interface SolutionEditorProps {
  solution?: Solution;
  onSubmit: (content: string, files: File[]) => void;
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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatText = (command: string, value?: string) => {
    if (!editorRef.current) return;
    
    const textarea = editorRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    
    let newText = '';
    switch (command) {
      case 'bold':
        newText = `**${selectedText || 'bold text'}**`;
        break;
      case 'italic':
        newText = `*${selectedText || 'italic text'}*`;
        break;
      case 'insertUnorderedList':
        newText = `\n• ${selectedText || 'list item'}\n`;
        break;
      case 'createLink':
        newText = `[${selectedText || 'link text'}](${value || 'url'})`;
        break;
      default:
        return;
    }
    
    const newContent = 
      textarea.value.substring(0, start) + 
      newText + 
      textarea.value.substring(end);
    
    setContent(newContent);
    
    // Set cursor position after the inserted text
    setTimeout(() => {
      if (editorRef.current) {
        const newPosition = start + newText.length;
        editorRef.current.focus();
        editorRef.current.setSelectionRange(newPosition, newPosition);
      }
    }, 0);
  };

  const updateContent = (value: string) => {
    setContent(value);
  };

  const handleFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const filesArray = Array.from(files);
    
    // Add files to local state (no upload yet)
    setSelectedFiles(prev => [...prev, ...filesArray]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFileUpload(e.dataTransfer.files);
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
    const trimmedContent = content.trim();
    if (trimmedContent && trimmedContent.length >= 10) {
      // Pass files directly to the parent
      onSubmit(trimmedContent, selectedFiles);
    } else {
      // Show validation error - content must be at least 10 characters
      alert('Solution content must be at least 10 characters long.');
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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
            onClick={() => fileInputRef.current?.click()}
            className="p-2 hover:bg-surface rounded transition-colors"
            title="Add Files"
          >
            <Upload size={16} />
          </button>
        </div>

        <button
          type="button"
          onClick={() => setShowPreview(!showPreview)}
          className="flex items-center space-x-2 px-3 py-1 text-sm bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
        >
          <Image size={14} />
          <span>{showPreview ? 'Edit' : 'Preview'}</span>
        </button>
      </div>

      {/* Editor */}
      {!showPreview ? (
        <textarea
          ref={editorRef}
          value={content}
          onChange={(e) => updateContent(e.target.value)}
          className="min-h-[300px] p-4 border border-t-0 border-border rounded-b-lg focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
          placeholder="Describe your solution in detail. Include technical specifications, implementation approach, expected outcomes, and any testing results..."
          style={{ wordBreak: 'break-word' }}
        />
      ) : (
        <div className="min-h-[300px] p-4 border border-t-0 border-border rounded-b-lg bg-background-alt">
          <div className="prose prose-sm max-w-none">
            {content ? (
              <div style={{ whiteSpace: 'pre-wrap' }}>
                {content.split('\n').map((line, index) => (
                  <p key={index} style={{ margin: '0.5rem 0' }}>
                    {line
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\*(.*?)\*/g, '<em>$1</em>')
                      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
                      .split(/(<strong>.*?<\/strong>|<em>.*?<\/em>|<a.*?<\/a>)/)
                      .map((part, i) => (
                        part.match(/<.*?>/) ? (
                          <span key={i} dangerouslySetInnerHTML={{ __html: part }} />
                        ) : (
                          part
                        )
                      ))
                    }
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-muted italic">No content to preview</p>
            )}
          </div>
        </div>
      )}

      {/* File Upload Zone */}
      <div
        className={`mt-4 border-2 border-dashed rounded-lg p-6 text-center transition-all ${
          dragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
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
              Drag and drop files here, or{' '}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-primary hover:underline"
              >
                browse
              </button>
            </p>
            <p className="text-xs text-muted">
              Support: Images, Videos, Documents (max 100MB each)
            </p>
          </div>
        </div>
      </div>

      {/* Uploaded Attachments Preview */}
      {selectedFiles.length > 0 && (
        <div className="mt-4">
          <h4 className="font-medium text-primary mb-3 flex items-center space-x-2">
            <FileText size={16} />
            <span>Attachments ({selectedFiles.length})</span>
          </h4>
          <div className="space-y-2">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-background-alt rounded-lg border border-border"
              >
                <div className="flex items-center space-x-3">
                  {getFileIcon(file)}
                  <div>
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="p-1 hover:bg-error/10 hover:text-error rounded transition-colors"
                  title="Remove attachment"
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
            disabled={!content.trim() || content.trim().length < 10}
            className="flex items-center space-x-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save size={16} />
            <span>{isEdit ? 'Update Solution' : 'Submit Solution'}</span>
          </button>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*,.pdf,.doc,.docx,.txt,.md"
        onChange={(e) => handleFileUpload(e.target.files)}
        className="hidden"
      />
    </div>
  );
}; 