import React from 'react';
import {
  Filter,
  ChevronDown,
  Calendar,
  User,
  Award,
  DollarSign,
  Eye,
  Target,
  Clock,
  CheckCircle,
  X
} from 'lucide-react';
import type { SearchFilters, SortOption } from '../types';
import { Priority, ThreadStatus, Classification, Urgency, UserRole } from '../types';
import { mockCategories, mockTags } from '../data/mockData';
import { useToggle } from '../hooks';

interface SidebarProps {
  filters: SearchFilters;
  onFilterChange: (key: keyof SearchFilters, value: any) => void;
  sortOption: SortOption;
  onSortChange: (sort: SortOption) => void;
  onClearFilters: () => void;
  totalResults: number;
}

const sortOptions: SortOption[] = [
  { field: 'hotScore', direction: 'desc', label: 'Hot' },
  { field: 'createdAt', direction: 'desc', label: 'Most Recent' },
  { field: 'upvotes', direction: 'desc', label: 'Most Upvoted' },
  { field: 'views', direction: 'desc', label: 'Most Viewed' },
  { field: 'solutionCount', direction: 'desc', label: 'Most Solutions' },
  { field: 'updatedAt', direction: 'desc', label: 'Recently Updated' }
];

const priorityOptions: Priority[] = [Priority.CRITICAL, Priority.HIGH, Priority.MEDIUM, Priority.LOW];
const statusOptions: ThreadStatus[] = [ThreadStatus.OPEN, ThreadStatus.IN_PROGRESS, ThreadStatus.SOLVED, ThreadStatus.CLOSED, ThreadStatus.ARCHIVED];
const classificationOptions: Classification[] = [Classification.PUBLIC, Classification.RESTRICTED, Classification.CONFIDENTIAL];
const urgencyOptions: Urgency[] = [Urgency.FLASH, Urgency.IMMEDIATE, Urgency.PRIORITY, Urgency.ROUTINE];
const roleOptions: UserRole[] = [UserRole.WARFIGHTER, UserRole.INNOVATOR, UserRole.MODERATOR, UserRole.ADMIN];

export const Sidebar: React.FC<SidebarProps> = ({
  filters,
  onFilterChange,
  sortOption,
  onSortChange,
  onClearFilters,
  totalResults
}) => {
  const { value: isFiltersOpen, toggle: toggleFilters } = useToggle(true);
  const { value: isCategoriesOpen, toggle: toggleCategories } = useToggle(true);
  const { value: isStatsOpen, toggle: toggleStats } = useToggle(true);

  const hasActiveFilters = Object.keys(filters).some(key => {
    const value = filters[key as keyof SearchFilters];
    return value !== undefined && value !== null && (Array.isArray(value) ? value.length > 0 : true);
  });

  return (
    <div className="w-80 bg-surface border-r border-border flex flex-col h-screen">
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Sort Options */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center text-primary">
              <Target className="w-5 h-5 mr-2" />
              Sort By
            </h3>
            <div className="space-y-1">
              {sortOptions.map((option) => (
                <button
                  key={`${option.field}-${option.direction}`}
                  onClick={() => onSortChange(option)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg transition-all ${
                    sortOption.field === option.field && sortOption.direction === option.direction
                      ? 'bg-primary text-white font-medium shadow-sm'
                      : 'hover:bg-surface-hover text-secondary'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div>
            <button
              onClick={toggleStats}
              className="w-full flex items-center justify-between text-lg font-semibold mb-4 hover:text-primary transition-colors"
            >
              <div className="flex items-center text-primary">
                <Award className="w-5 h-5 mr-2" />
                Quick Stats
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${isStatsOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isStatsOpen && (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-4 border border-primary/20">
                  <div className="text-3xl font-bold text-primary">{totalResults}</div>
                  <div className="text-sm text-muted">Total Threads</div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gradient-to-br from-success/10 to-success/5 rounded-lg p-3 text-center border border-success/20">
                    <div className="text-xl font-bold text-success">47</div>
                    <div className="text-xs text-muted">Solved</div>
                  </div>
                  <div className="bg-gradient-to-br from-warning/10 to-warning/5 rounded-lg p-3 text-center border border-warning/20">
                    <div className="text-xl font-bold text-warning">23</div>
                    <div className="text-xs text-muted">Bounties</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Categories */}
          <div>
            <button
              onClick={toggleCategories}
              className="w-full flex items-center justify-between text-lg font-semibold mb-4 hover:text-primary transition-colors"
            >
              <div className="flex items-center text-primary">
                <Filter className="w-5 h-5 mr-2" />
                Categories
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${isCategoriesOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isCategoriesOpen && (
              <div className="space-y-2">
                {mockCategories.map((category) => (
                  <label key={category.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-surface-hover cursor-pointer transition-colors border border-transparent hover:border-border">
                    <input
                      type="checkbox"
                      checked={filters.categories?.includes(category.id) || false}
                      onChange={(e) => {
                        const currentCategories = filters.categories || [];
                        const newCategories = e.target.checked
                          ? [...currentCategories, category.id]
                          : currentCategories.filter(id => id !== category.id);
                        onFilterChange('categories', newCategories);
                      }}
                      className="rounded border-border focus:ring-primary"
                    />
                    <div className="flex items-center space-x-2 flex-1">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="text-sm font-medium">{category.name}</span>
                      <span className="text-xs text-muted ml-auto bg-background-alt px-2 py-1 rounded-full">{category.threadCount}</span>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Filters */}
          <div>
            <button
              onClick={toggleFilters}
              className="w-full flex items-center justify-between text-lg font-semibold mb-4 hover:text-primary transition-colors"
            >
              <div className="flex items-center text-primary">
                <Filter className="w-5 h-5 mr-2" />
                Filters
                {hasActiveFilters && (
                  <span className="ml-2 px-2 py-1 bg-primary text-white text-xs rounded-full">
                    Active
                  </span>
                )}
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${isFiltersOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isFiltersOpen && (
              <div className="space-y-6">
                {/* Clear Filters */}
                {hasActiveFilters && (
                  <button
                    onClick={onClearFilters}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-error/10 text-error rounded-lg hover:bg-error/20 transition-all border border-error/20"
                  >
                    <X size={16} />
                    <span className="font-medium">Clear All Filters</span>
                  </button>
                )}

                {/* Priority Filter */}
                <div className="bg-background-alt rounded-lg p-4">
                  <label className="block text-sm font-semibold mb-3 text-primary">Priority</label>
                  <div className="space-y-2">
                    {priorityOptions.map((priority) => (
                      <label key={priority} className="flex items-center space-x-2 text-sm">
                        <input
                          type="checkbox"
                          checked={filters.priorities?.includes(priority) || false}
                          onChange={(e) => {
                            const currentPriorities = filters.priorities || [];
                            const newPriorities = e.target.checked
                              ? [...currentPriorities, priority]
                              : currentPriorities.filter(p => p !== priority);
                            onFilterChange('priorities', newPriorities);
                          }}
                          className="rounded border-border focus:ring-primary"
                        />
                        <span className="capitalize font-medium">{priority}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Status Filter */}
                <div className="bg-background-alt rounded-lg p-4">
                  <label className="block text-sm font-semibold mb-3 text-primary">Status</label>
                  <div className="space-y-2">
                    {statusOptions.map((status) => (
                      <label key={status} className="flex items-center space-x-2 text-sm">
                        <input
                          type="checkbox"
                          checked={filters.statuses?.includes(status) || false}
                          onChange={(e) => {
                            const currentStatuses = filters.statuses || [];
                            const newStatuses = e.target.checked
                              ? [...currentStatuses, status]
                              : currentStatuses.filter(s => s !== status);
                            onFilterChange('statuses', newStatuses);
                          }}
                          className="rounded border-border focus:ring-primary"
                        />
                        <span className="capitalize font-medium">{status.replace('_', ' ')}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Quick Filters */}
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 p-3 rounded-lg bg-success/5 border border-success/20 cursor-pointer hover:bg-success/10 transition-colors">
                    <input
                      type="checkbox"
                      checked={filters.hasAcceptedSolution === true}
                      onChange={(e) => onFilterChange('hasAcceptedSolution', e.target.checked ? true : undefined)}
                      className="rounded border-border focus:ring-primary"
                    />
                    <CheckCircle size={16} className="text-success" />
                    <span className="text-sm font-medium">Has Accepted Solution</span>
                  </label>

                  <label className="flex items-center space-x-3 p-3 rounded-lg bg-warning/5 border border-warning/20 cursor-pointer hover:bg-warning/10 transition-colors">
                    <input
                      type="checkbox"
                      checked={filters.hasBounty === true}
                      onChange={(e) => onFilterChange('hasBounty', e.target.checked ? true : undefined)}
                      className="rounded border-border focus:ring-primary"
                    />
                    <DollarSign size={16} className="text-warning" />
                    <span className="text-sm font-medium">Has Bounty</span>
                  </label>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-semibold mb-3 text-primary">Popular Tags</label>
                  <div className="flex flex-wrap gap-2">
                    {mockTags.slice(0, 8).map((tag) => (
                      <button
                        key={tag.id}
                        onClick={() => {
                          const currentTags = filters.tags || [];
                          const newTags = currentTags.includes(tag.id)
                            ? currentTags.filter(id => id !== tag.id)
                            : [...currentTags, tag.id];
                          onFilterChange('tags', newTags);
                        }}
                        className={`px-3 py-1.5 text-xs rounded-full transition-all font-medium border ${
                          filters.tags?.includes(tag.id)
                            ? 'text-white shadow-sm'
                            : 'hover:opacity-80'
                        }`}
                        style={{
                          backgroundColor: filters.tags?.includes(tag.id) ? tag.color : `${tag.color}15`,
                          color: filters.tags?.includes(tag.id) ? 'white' : tag.color,
                          borderColor: `${tag.color}30`
                        }}
                      >
                        {tag.name}
                      </button>
                    ))}
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