import React, { useState, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Upload,
  Image,
  Video,
  FileText,
  Bold,
  Italic,
  List,
  Link as LucideLink,
  Eye,
  X,
  Plus,
  AlertCircle,
  Check,
  DollarSign,
  Target,
  Clock,
  MapPin,
  AlertTriangle
} from 'lucide-react';
import { Header } from '../components/Header';
import type { TRLLevel } from '../types';
import { Priority, Urgency } from '../types';
import { mockCategories, mockTags } from '../data/mockData';

interface FormData {
  title: string;
  description: string;
  category: string;
  tags: string[];
  priority: Priority;
  urgency: Urgency;
  trlLevel?: TRLLevel;
  domain: string;
  location: string;
  bountyAmount: string;
  attachments: File[];
}

export const CreateChallenge: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLDivElement>(null);
  
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    category: '',
    tags: [],
    priority: Priority.MEDIUM,
    urgency: Urgency.ROUTINE,
    trlLevel: undefined,
    domain: '',
    location: '',
    bountyAmount: '',
    attachments: []
  });

  const [showPreview, setShowPreview] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customTag, setCustomTag] = useState('');

  // Handle form field updates
  const updateField = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle file upload
  const handleFileUpload = useCallback((files: FileList | null) => {
    if (!files) return;
    
    const newFiles = Array.from(files).filter(file => {
      const isValid = file.type.startsWith('image/') || file.type.startsWith('video/') || 
                     file.type === 'application/pdf' || file.type.includes('document');
      const isUnderLimit = file.size <= 50 * 1024 * 1024; // 50MB limit
      return isValid && isUnderLimit;
    });

    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...newFiles]
    }));
  }, []);

  // Drag and drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFileUpload(e.dataTransfer.files);
  }, [handleFileUpload]);

  // Rich text formatting
  const formatText = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    descriptionRef.current?.focus();
  };

  // Remove attachment
  const removeAttachment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  // Add custom tag
  const addCustomTag = () => {
    if (customTag.trim() && !formData.tags.includes(customTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, customTag.trim()]
      }));
      setCustomTag('');
    }
  };

  // Remove tag
  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  // Handle description changes
  const handleDescriptionChange = () => {
    if (descriptionRef.current) {
      setFormData(prev => ({
        ...prev,
        description: descriptionRef.current?.innerHTML || ''
      }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // TODO: Implement actual API call
      console.log('Submitting challenge:', formData);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Navigate back to home on success
      navigate('/home');
    } catch (error) {
      console.error('Error submitting challenge:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image size={16} className="text-blue-500" />;
    if (file.type.startsWith('video/')) return <Video size={16} className="text-purple-500" />;
    return <FileText size={16} className="text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-background">
      <Header
        searchQuery=""
        onSearchChange={() => {}}
        onCreateThread={() => navigate('/create-challenge')}
      />

      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <button
            onClick={() => navigate('/home')}
            className="p-2 hover:bg-surface-hover rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-muted" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-primary">Create New Challenge</h1>
            <p className="text-muted mt-1">
              Share a drone challenge that needs innovative solutions from the community
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div className="bg-surface border border-border rounded-xl p-6">
                <label className="block text-sm font-semibold text-primary mb-3">
                  Challenge Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  placeholder="Enter a clear, descriptive title for your challenge..."
                  className="w-full px-4 py-3 border border-border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  required
                />
                <p className="text-xs text-muted mt-2">
                  Make it specific and searchable. Good titles help others understand the problem quickly.
                </p>
              </div>

              {/* Description with Rich Text Editor */}
              <div className="bg-surface border border-border rounded-xl p-6">
                <label className="block text-sm font-semibold text-primary mb-3">
                  Detailed Description *
                </label>
                
                {/* Rich Text Toolbar */}
                <div className="flex items-center space-x-2 p-3 border border-border rounded-t-lg bg-background-alt">
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
                    onClick={() => {
                      const url = prompt('Enter URL:');
                      if (url) formatText('createLink', url);
                    }}
                    className="p-2 hover:bg-surface rounded transition-colors"
                    title="Add Link"
                  >
                    <LucideLink size={16} />
                  </button>
                </div>

                {/* Rich Text Editor */}
                <div
                  ref={descriptionRef}
                  contentEditable
                  onInput={handleDescriptionChange}
                  className="min-h-[200px] p-4 border border-t-0 border-border rounded-b-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                  data-placeholder="Describe your challenge in detail. Include context, requirements, constraints, and what kind of solutions you're looking for..."
                  style={{
                    wordBreak: 'break-word'
                  }}
                />
                <p className="text-xs text-muted mt-2">
                  Provide comprehensive details about the problem, environment, requirements, and desired outcomes.
                </p>
              </div>

              {/* File Upload */}
              <div className="bg-surface border border-border rounded-xl p-6">
                <label className="block text-sm font-semibold text-primary mb-3">
                  Attachments
                </label>
                
                {/* Drop Zone */}
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
                    dragActive 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <Upload size={48} className="mx-auto text-muted mb-4" />
                  <p className="text-muted mb-2">
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
                    Supports images, videos, PDFs, and documents (max 50MB each)
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,video/*,.pdf,.doc,.docx"
                    onChange={(e) => handleFileUpload(e.target.files)}
                    className="hidden"
                  />
                </div>

                {/* Uploaded Files */}
                {formData.attachments.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {formData.attachments.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-background-alt rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          {getFileIcon(file)}
                          <div>
                            <p className="text-sm font-medium truncate max-w-xs">
                              {file.name}
                            </p>
                            <p className="text-xs text-muted">
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAttachment(index)}
                          className="p-1 hover:bg-error/10 hover:text-error rounded transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Category and Tags */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-surface border border-border rounded-xl p-6">
                  <label className="block text-sm font-semibold text-primary mb-3">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => updateField('category', e.target.value)}
                    className="w-full px-4 py-3 border border-border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20"
                    required
                  >
                    <option value="">Select a category</option>
                    {mockCategories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bg-surface border border-border rounded-xl p-6">
                  <label className="block text-sm font-semibold text-primary mb-3">
                    Tags
                  </label>
                  <div className="space-y-3">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={customTag}
                        onChange={(e) => setCustomTag(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomTag())}
                        placeholder="Add custom tag..."
                        className="flex-1 px-3 py-2 border border-border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />
                      <button
                        type="button"
                        onClick={addCustomTag}
                        className="px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    
                    {/* Popular Tags */}
                    <div className="flex flex-wrap gap-2">
                      {mockTags.slice(0, 6).map(tag => (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => {
                            if (!formData.tags.includes(tag.name)) {
                              updateField('tags', [...formData.tags, tag.name]);
                            }
                          }}
                          className="px-3 py-1 text-xs bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors"
                        >
                          {tag.name}
                        </button>
                      ))}
                    </div>

                    {/* Selected Tags */}
                    {formData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {formData.tags.map(tag => (
                          <span
                            key={tag}
                            className="inline-flex items-center space-x-1 px-3 py-1 bg-primary text-white rounded-full text-xs"
                          >
                            <span>{tag}</span>
                            <button
                              type="button"
                              onClick={() => removeTag(tag)}
                              className="hover:bg-white/20 rounded-full p-0.5"
                            >
                              <X size={12} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Priority, Urgency, and TRL Level */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-surface border border-border rounded-xl p-6">
                  <label className="block text-sm font-semibold text-primary mb-3">
                    Priority *
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => updateField('priority', e.target.value as Priority)}
                    className="w-full px-4 py-3 border border-border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    <option value={Priority.LOW}>Low</option>
                    <option value={Priority.MEDIUM}>Medium</option>
                    <option value={Priority.HIGH}>High</option>
                    <option value={Priority.CRITICAL}>Critical</option>
                  </select>
                </div>

                <div className="bg-surface border border-border rounded-xl p-6">
                  <label className="block text-sm font-semibold text-primary mb-3">
                    Urgency *
                  </label>
                  <select
                    value={formData.urgency}
                    onChange={(e) => updateField('urgency', e.target.value as Urgency)}
                    className="w-full px-4 py-3 border border-border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    <option value={Urgency.ROUTINE}>Routine</option>
                    <option value={Urgency.PRIORITY}>Priority</option>
                    <option value={Urgency.IMMEDIATE}>Immediate</option>
                    <option value={Urgency.FLASH}>Flash</option>
                  </select>
                </div>

                <div className="bg-surface border border-border rounded-xl p-6">
                  <label className="block text-sm font-semibold text-primary mb-3">
                    TRL Level
                  </label>
                  <select
                    value={formData.trlLevel || ''}
                    onChange={(e) => updateField('trlLevel', e.target.value || undefined)}
                    className="w-full px-4 py-3 border border-border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">Select TRL Level</option>
                    <option value="trl1">TRL 1 - Basic principles</option>
                    <option value="trl2">TRL 2 - Technology concept</option>
                    <option value="trl3">TRL 3 - Experimental proof</option>
                    <option value="trl4">TRL 4 - Lab validation</option>
                    <option value="trl5">TRL 5 - Relevant environment</option>
                    <option value="trl6">TRL 6 - Technology demonstration</option>
                    <option value="trl7">TRL 7 - System prototype</option>
                    <option value="trl8">TRL 8 - System qualified</option>
                    <option value="trl9">TRL 9 - Operational system</option>
                  </select>
                </div>
              </div>

              {/* Optional Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-surface border border-border rounded-xl p-6">
                  <label className="block text-sm font-semibold text-primary mb-3">
                    Domain
                  </label>
                  <input
                    type="text"
                    value={formData.domain}
                    onChange={(e) => updateField('domain', e.target.value)}
                    placeholder="e.g., Urban Operations, Desert Theater..."
                    className="w-full px-4 py-3 border border-border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="bg-surface border border-border rounded-xl p-6">
                  <label className="block text-sm font-semibold text-primary mb-3">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => updateField('location', e.target.value)}
                    placeholder="e.g., Fort Bragg, NC..."
                    className="w-full px-4 py-3 border border-border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* Bounty */}
              <div className="bg-surface border border-border rounded-xl p-6">
                <label className="block text-sm font-semibold text-primary mb-3">
                  Bounty (Optional)
                </label>
                <div className="flex items-center space-x-3">
                  <DollarSign size={20} className="text-warning" />
                  <input
                    type="number"
                    value={formData.bountyAmount}
                    onChange={(e) => updateField('bountyAmount', e.target.value)}
                    placeholder="0"
                    min="0"
                    className="flex-1 px-4 py-3 border border-border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                  <span className="text-muted">USD</span>
                </div>
                <p className="text-xs text-muted mt-2">
                  Offer a monetary reward to incentivize high-quality solutions.
                </p>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-between pt-6">
                <div className="flex items-center space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowPreview(!showPreview)}
                    className="flex items-center space-x-2 px-4 py-2 border border-border rounded-lg hover:bg-surface-hover transition-colors"
                  >
                    <Eye size={16} />
                    <span>{showPreview ? 'Hide' : 'Show'} Preview</span>
                  </button>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => navigate('/home')}
                    className="px-6 py-3 border border-border rounded-lg hover:bg-surface-hover transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !formData.title || !formData.description || !formData.category}
                    className="flex items-center space-x-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Publishing...</span>
                      </>
                    ) : (
                      <>
                        <Check size={16} />
                        <span>Publish Challenge</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Guidelines */}
            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="font-semibold text-primary mb-4 flex items-center space-x-2">
                <AlertCircle size={16} />
                <span>Submission Guidelines</span>
              </h3>
              <div className="space-y-3 text-sm text-muted">
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <p>Be specific about the problem and desired outcomes</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <p>Include technical requirements and constraints</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <p>Add relevant tags to help others find your challenge</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <p>Attach supporting documents, images, or videos</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <p>Set appropriate priority and urgency levels</p>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="font-semibold text-primary mb-4">💡 Pro Tips</h3>
              <div className="space-y-3 text-sm text-muted">
                <p>
                  <strong>Clear titles</strong> get more engagement. Be specific about what you need.
                </p>
                <p>
                  <strong>Visual content</strong> helps explain complex problems. Include diagrams or photos.
                </p>
                <p>
                  <strong>Bounties</strong> can attract higher quality solutions and faster responses.
                </p>
              </div>
            </div>

            {/* Preview */}
            {showPreview && formData.title && (
              <div className="bg-surface border border-border rounded-xl p-6">
                <h3 className="font-semibold text-primary mb-4">Preview</h3>
                <div className="border border-border rounded-lg p-4 text-sm">
                  <h4 className="font-semibold text-primary mb-2">{formData.title}</h4>
                  <div 
                    className="text-muted mb-3 line-clamp-3"
                    dangerouslySetInnerHTML={{ __html: formData.description }}
                  />
                  <div className="flex flex-wrap gap-1">
                    {formData.tags.slice(0, 3).map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-primary/10 text-primary text-xs rounded"
                      >
                        {tag}
                      </span>
                    ))}
                    {formData.tags.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                        +{formData.tags.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 