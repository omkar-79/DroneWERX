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
  AlertTriangle,
  Calendar
} from 'lucide-react';
import { Header } from '../components';
import { useThreads } from '../hooks';
import { useAuth } from '../contexts/AuthContext';
import { filesAPI, mediaAPI } from '../services/api';
import type { TRLLevel } from '../types';
import { Urgency } from '../types';

interface FormData {
  title: string;
  description: string;
  category: string;
  tags: string[];
  urgency: Urgency;
  trlLevel?: TRLLevel;
  domain: string;
  location: string;
  deadline: string;
  bountyAmount: string;
  bountyDescription: string;
  bountyDeadline: string;
  attachments: File[];
  isAnonymous: boolean;
}

export const CreateChallenge: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLDivElement>(null);

  // Get real categories and tags from API
  const { categories, allTags, createThread, loading: threadsLoading } = useThreads({ autoFetch: true });

  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    category: '',
    tags: [],
    urgency: Urgency.ROUTINE,
    trlLevel: undefined,
    domain: '',
    location: '',
    deadline: '',
    bountyAmount: '',
    bountyDescription: '',
    bountyDeadline: '',
    attachments: [],
    isAnonymous: false
  });

  const [showPreview, setShowPreview] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customTag, setCustomTag] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Handle form field updates
  const updateField = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle file uploads
  const handleFileUpload = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files).filter(file => {
      // File size limit (100MB)
      if (file.size > 100 * 1024 * 1024) {
        setSubmitError(`File "${file.name}" is too large. Maximum size is 100MB.`);
        return false;
      }

      // Check if file already exists
      if (formData.attachments.some(existing => existing.name === file.name && existing.size === file.size)) {
        console.log(`File "${file.name}" already added`);
        return false;
      }

      return true;
    });

    if (newFiles.length === 0) return;

    // Add files to local state
    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...newFiles]
    }));

    console.log('Files added to form:', newFiles.length);
  }, [formData.attachments]);

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
    const fileToRemove = formData.attachments[index];

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

  // Add this helper function after the imports
  const formatDateForAPI = (dateString: string): string | undefined => {
    if (!dateString) return undefined;
    try {
      // Create a Date object from the input
      const date = new Date(dateString);
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return undefined;
      }
      // Format the date as ISO 8601 with UTC timezone
      return date.toISOString();
    } catch (error) {
      console.error('Error formatting date:', error);
      return undefined;
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    // Validation
    if (!formData.title.trim()) {
      setSubmitError('Title is required');
      setIsSubmitting(false);
      return;
    }

    if (!formData.description.trim()) {
      setSubmitError('Description is required');
      setIsSubmitting(false);
      return;
    }

    if (!formData.category) {
      setSubmitError('Category is required');
      setIsSubmitting(false);
      return;
    }

    if (!user) {
      setSubmitError('You must be logged in to create a challenge');
      setIsSubmitting(false);
      return;
    }

    // Validate bounty fields if bounty amount is provided
    if (formData.bountyAmount && parseFloat(formData.bountyAmount) > 0) {
      if (!formData.bountyDescription.trim()) {
        setSubmitError('Bounty description is required when offering a bounty');
        setIsSubmitting(false);
        return;
      }
    }

    // Validate deadline if provided
    if (formData.deadline) {
      const deadlineDate = new Date(formData.deadline);
      const now = new Date();
      if (deadlineDate <= now) {
        setSubmitError('Deadline must be in the future');
        setIsSubmitting(false);
        return;
      }
    }

    // Validate bounty deadline if provided
    if (formData.bountyDeadline) {
      const bountyDeadlineDate = new Date(formData.bountyDeadline);
      const now = new Date();
      if (bountyDeadlineDate <= now) {
        setSubmitError('Bounty deadline must be in the future');
        setIsSubmitting(false);
        return;
      }
    }

    try {
      // Prepare thread data with all fields
      const threadData = {
        title: formData.title.trim(),
        description: formData.description,
        categoryId: formData.category,
        tags: formData.tags,
        urgency: formData.urgency,
        trlLevel: formData.trlLevel || undefined,
        domain: formData.domain.trim() || undefined,
        location: formData.location.trim() || undefined,
        deadline: formData.deadline ? formatDateForAPI(formData.deadline) : undefined,
        isAnonymous: formData.isAnonymous,
        bountyAmount: formData.bountyAmount && parseFloat(formData.bountyAmount) > 0 ? parseFloat(formData.bountyAmount) : undefined,
        bountyDescription: formData.bountyDescription.trim() || undefined,
        bountyDeadline: formData.bountyDeadline ? formatDateForAPI(formData.bountyDeadline) : undefined,
      };

      console.log('Creating thread with data:', threadData);

      // Create the thread using real API
      const result = await createThread(threadData);

      // Upload files directly to the thread if any
      if (formData.attachments.length > 0 && result && result.thread) {
        try {
          console.log('Uploading files to thread...');
          await mediaAPI.uploadToThread(result.thread.id, formData.attachments);
          console.log('Files uploaded to thread successfully');
        } catch (fileError) {
          console.error('File upload failed:', fileError);
          // Don't fail the whole process for file upload errors
          console.warn('Thread created but files failed to upload');
        }
      }

      // Navigate to the new thread
      navigate(`/thread/${result.thread.id}`);
    } catch (error) {
      console.error('Error creating thread:', error);
      setSubmitError(error instanceof Error ? error.message : 'Failed to create thread');
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
        onSearchChange={() => { }}
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
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${dragActive
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
                    Supports images, videos, PDFs, and documents (max 100MB each)
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
                    {categories.map(category => (
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
                      {allTags.slice(0, 6).map(tag => (
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

              {/* Urgency and TRL Level */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    <option value="TRL1">TRL 1 - Basic principles</option>
                    <option value="TRL2">TRL 2 - Technology concept</option>
                    <option value="TRL3">TRL 3 - Experimental proof</option>
                    <option value="TRL4">TRL 4 - Lab validation</option>
                    <option value="TRL5">TRL 5 - Relevant environment</option>
                    <option value="TRL6">TRL 6 - Technology demonstration</option>
                    <option value="TRL7">TRL 7 - System prototype</option>
                    <option value="TRL8">TRL 8 - System qualified</option>
                    <option value="TRL9">TRL 9 - Operational system</option>
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

              {/* Deadline Field */}
              <div className="bg-surface border border-border rounded-xl p-6">
                <label className="block text-sm font-semibold text-primary mb-3">
                  Deadline (Optional)
                </label>
                <div className="flex items-center space-x-3">
                  <Calendar size={20} className="text-muted" />
                  <input
                    type="datetime-local"
                    value={formData.deadline}
                    onChange={(e) => updateField('deadline', e.target.value)}
                    className="flex-1 px-4 py-3 border border-border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <p className="text-xs text-muted mt-2">
                  Set a deadline for when solutions should be submitted.
                </p>
              </div>

              {/* Bounty */}
              <div className="bg-surface border border-border rounded-xl p-6">
                <label className="block text-sm font-semibold text-primary mb-3">
                  Bounty (Optional)
                </label>
                <div className="space-y-4">
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

                  {formData.bountyAmount && parseFloat(formData.bountyAmount) > 0 && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-primary mb-2">
                          Bounty Description *
                        </label>
                        <textarea
                          value={formData.bountyDescription}
                          onChange={(e) => updateField('bountyDescription', e.target.value)}
                          placeholder="Describe what the bounty is for and any specific requirements..."
                          rows={3}
                          className="w-full px-4 py-3 border border-border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-primary mb-2">
                          Bounty Deadline (Optional)
                        </label>
                        <input
                          type="datetime-local"
                          value={formData.bountyDeadline}
                          onChange={(e) => updateField('bountyDeadline', e.target.value)}
                          className="w-full px-4 py-3 border border-border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                    </>
                  )}
                </div>
                <p className="text-xs text-muted mt-2">
                  Offer a monetary reward to incentivize high-quality solutions.
                </p>
              </div>

              {/* Anonymous Posting Option */}
              <div className="bg-surface border border-border rounded-xl p-6">
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="anonymous"
                    checked={formData.isAnonymous}
                    onChange={(e) => updateField('isAnonymous', e.target.checked)}
                    className="mt-1 h-4 w-4 text-primary focus:ring-primary border-border rounded"
                  />
                  <div className="flex-1">
                    <label htmlFor="anonymous" className="block text-sm font-semibold text-primary mb-2 cursor-pointer">
                      Post Anonymously
                    </label>
                    <p className="text-xs text-muted">
                      Your identity will be hidden from other users. Only moderators can see who posted anonymous challenges.
                    </p>
                  </div>
                </div>
              </div>

              {/* Error Display */}
              {submitError && (
                <div className="bg-error/10 border border-error/20 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle size={16} className="text-error" />
                    <p className="text-error font-medium">{submitError}</p>
                  </div>
                </div>
              )}

              {/* Loading State for Categories/Tags */}
              {threadsLoading && (
                <div className="bg-info/10 border border-info/20 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-info"></div>
                    <p className="text-info">Loading categories and tags...</p>
                  </div>
                </div>
              )}

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
                  <p>Set appropriate urgency levels</p>
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

                  {/* Urgency */}
                  <div className="flex items-center space-x-3 mb-3 text-xs">
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">
                      {formData.urgency}
                    </span>
                  </div>

                  {/* Deadline */}
                  {formData.deadline && (
                    <div className="flex items-center space-x-2 mb-3 text-xs text-muted">
                      <Calendar size={12} />
                      <span>Deadline: {new Date(formData.deadline).toLocaleDateString()}</span>
                    </div>
                  )}

                  {/* Bounty */}
                  {formData.bountyAmount && parseFloat(formData.bountyAmount) > 0 && (
                    <div className="flex items-center space-x-2 mb-3 text-xs">
                      <DollarSign size={12} className="text-warning" />
                      <span className="font-medium text-warning">
                        ${parseFloat(formData.bountyAmount).toLocaleString()} USD Bounty
                      </span>
                    </div>
                  )}

                  {/* Tags */}
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

                  {/* Attachments count */}
                  {formData.attachments.length > 0 && (
                    <div className="flex items-center space-x-2 mt-3 text-xs text-muted">
                      <Upload size={12} />
                      <span>{formData.attachments.length} file{formData.attachments.length !== 1 ? 's' : ''} attached</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 