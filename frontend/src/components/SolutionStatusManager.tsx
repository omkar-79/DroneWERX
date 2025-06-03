import React, { useState } from 'react';
import {
  CheckCircle,
  XCircle,
  Award,
  Clock,
  MessageSquare,
  ChevronDown,
  Save
} from 'lucide-react';
import { SolutionStatus } from '../types';

interface SolutionStatusManagerProps {
  currentStatus: SolutionStatus;
  canManageStatus: boolean;
  statusNote?: string;
  onStatusUpdate: (status: SolutionStatus, note: string) => void;
}

export const SolutionStatusManager: React.FC<SolutionStatusManagerProps> = ({
  currentStatus,
  canManageStatus,
  statusNote,
  onStatusUpdate
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);
  const [note, setNote] = useState(statusNote || '');
  const [showNoteInput, setShowNoteInput] = useState(false);

  const statusConfig = {
    [SolutionStatus.PENDING]: {
      icon: <Clock size={14} />,
      label: 'Pending Review',
      color: 'text-warning bg-warning/10 border-warning/20',
      description: 'Awaiting evaluation'
    },
    [SolutionStatus.PASS]: {
      icon: <CheckCircle size={14} />,
      label: 'Pass',
      color: 'text-info bg-info/10 border-info/20',
      description: 'Good concept, needs refinement'
    },
    [SolutionStatus.FAIL]: {
      icon: <XCircle size={14} />,
      label: 'Fail',
      color: 'text-error bg-error/10 border-error/20',
      description: 'Does not meet requirements'
    },
    [SolutionStatus.APPROVED]: {
      icon: <Award size={14} />,
      label: 'Approved',
      color: 'text-success bg-success/10 border-success/20',
      description: 'Approved for implementation'
    }
  };

  const handleStatusChange = (status: SolutionStatus) => {
    setSelectedStatus(status);
    if (status !== SolutionStatus.PENDING) {
      setShowNoteInput(true);
    }
  };

  const handleSubmit = () => {
    onStatusUpdate(selectedStatus, note);
    setIsOpen(false);
    setShowNoteInput(false);
  };

  const currentConfig = statusConfig[currentStatus];

  if (!canManageStatus) {
    return (
      <div className={`inline-flex items-center space-x-2 px-3 py-2 rounded-lg border text-sm font-medium ${currentConfig.color}`}>
        {currentConfig.icon}
        <span>{currentConfig.label}</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center space-x-2 px-3 py-2 rounded-lg border text-sm font-medium hover:shadow-md transition-all ${currentConfig.color}`}
      >
        {currentConfig.icon}
        <span>{currentConfig.label}</span>
        <ChevronDown size={14} className={isOpen ? 'rotate-180' : ''} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-surface border border-border rounded-xl shadow-xl z-50 p-4">
          <h4 className="font-semibold text-primary mb-3">Update Solution Status</h4>
          
          <div className="space-y-2 mb-4">
            {Object.entries(statusConfig).map(([status, config]) => (
              <button
                key={status}
                onClick={() => handleStatusChange(status as SolutionStatus)}
                className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                  selectedStatus === status
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-border-hover'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className={config.color}>{config.icon}</span>
                  <div className="text-left">
                    <p className="font-medium text-primary">{config.label}</p>
                    <p className="text-xs text-muted">{config.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {showNoteInput && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-primary mb-2">
                Status Note (Optional)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note explaining your decision..."
                className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                rows={3}
              />
            </div>
          )}

          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                setIsOpen(false);
                setSelectedStatus(currentStatus);
                setNote(statusNote || '');
                setShowNoteInput(false);
              }}
              className="px-4 py-2 border border-border rounded-lg hover:bg-surface-hover transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
            >
              <Save size={14} />
              <span>Update Status</span>
            </button>
          </div>
        </div>
      )}

      {statusNote && (
        <div className="mt-2 p-3 bg-background-alt border border-border rounded-lg">
          <div className="flex items-start space-x-2">
            <MessageSquare size={14} className="text-muted mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-medium text-muted uppercase mb-1">Status Note</p>
              <p className="text-sm text-secondary">{statusNote}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 