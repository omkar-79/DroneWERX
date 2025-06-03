import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Sidebar } from '../components/Sidebar';
import { ThreadCard } from '../components/ThreadCard';
import { useThreadSearch, usePagination } from '../hooks';
import { mockThreads } from '../data/mockData';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  
  const {
    searchQuery,
    setSearchQuery,
    filters,
    updateFilter,
    clearFilters,
    sortOption,
    setSortOption,
    filteredAndSortedThreads,
    totalResults
  } = useThreadSearch(mockThreads);

  const {
    currentPage,
    totalPages,
    currentData: paginatedThreads,
    goToPage,
    goToNextPage,
    goToPreviousPage,
    hasNextPage,
    hasPreviousPage,
    startIndex,
    endIndex,
    totalItems
  } = usePagination(filteredAndSortedThreads, 10);

  const handleCreateThread = () => {
    navigate('/create-challenge');
  };

  const handleViewThread = (threadId: string) => {
    navigate(`/thread/${threadId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onCreateThread={handleCreateThread}
      />

      <div className="flex h-full">
        {/* Sidebar */}
        <div className="hidden lg:block">
          <Sidebar
            filters={filters}
            onFilterChange={updateFilter}
            sortOption={sortOption}
            onSortChange={setSortOption}
            onClearFilters={clearFilters}
            totalResults={totalResults}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Results Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-primary mb-2">
                    Drone Challenges & Solutions
                  </h2>
                  <p className="text-muted">
                    {totalItems > 0 ? (
                      <>
                        Showing {startIndex}-{endIndex} of {totalItems} threads
                        {searchQuery && (
                          <span className="ml-2">
                            for "<span className="font-medium">{searchQuery}</span>"
                          </span>
                        )}
                      </>
                    ) : (
                      'No threads found'
                    )}
                  </p>
                </div>

                {/* Results Summary */}
                <div className="hidden md:flex items-center space-x-4 text-sm text-muted">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-success rounded-full"></div>
                    <span>{mockThreads.filter(t => t.isAcceptedSolution).length} Solved</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-warning rounded-full"></div>
                    <span>{mockThreads.filter(t => t.bounty).length} Bounties</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-error rounded-full"></div>
                    <span>{mockThreads.filter(t => t.priority === 'critical').length} Critical</span>
                  </div>
                </div>
              </div>

              {/* No Results State */}
              {totalItems === 0 && (
                <div className="text-center py-12">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-12 h-12 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-secondary mb-2">
                    No threads found
                  </h3>
                  <p className="text-muted mb-4">
                    Try adjusting your search or filter criteria
                  </p>
                  <button
                    onClick={clearFilters}
                    className="btn-primary px-4 py-2 rounded-lg"
                  >
                    Clear All Filters
                  </button>
                </div>
              )}

              {/* Thread List */}
              {totalItems > 0 && (
                <div className="space-y-4">
                  {paginatedThreads.map((thread) => (
                    <ThreadCard
                      key={thread.id}
                      thread={thread}
                      onView={handleViewThread}
                    />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between bg-surface border border-border rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={goToPreviousPage}
                      disabled={!hasPreviousPage}
                      className="flex items-center space-x-2 px-3 py-2 border border-border rounded-lg hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft size={16} />
                      <span>Previous</span>
                    </button>
                    
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 7) {
                          pageNum = i + 1;
                        } else if (currentPage <= 4) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 3) {
                          pageNum = totalPages - 6 + i;
                        } else {
                          pageNum = currentPage - 3 + i;
                        }

                        return (
                          <button
                            key={pageNum}
                            onClick={() => goToPage(pageNum)}
                            className={`w-10 h-10 rounded-lg ${
                              pageNum === currentPage
                                ? 'bg-primary text-white'
                                : 'hover:bg-surface-hover'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={goToNextPage}
                      disabled={!hasNextPage}
                      className="flex items-center space-x-2 px-3 py-2 border border-border rounded-lg hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span>Next</span>
                      <ChevronRight size={16} />
                    </button>
                  </div>

                  <div className="text-sm text-muted">
                    Page {currentPage} of {totalPages}
                  </div>
                </div>
              )}

              {/* Platform Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-surface border border-border rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-primary mb-1">
                    {mockThreads.length}
                  </div>
                  <div className="text-sm text-muted">Total Challenges</div>
                </div>
                
                <div className="bg-surface border border-border rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-success mb-1">
                    {mockThreads.filter(t => t.isAcceptedSolution).length}
                  </div>
                  <div className="text-sm text-muted">Solutions Found</div>
                </div>
                
                <div className="bg-surface border border-border rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-warning mb-1">
                    {mockThreads.filter(t => t.bounty).length}
                  </div>
                  <div className="text-sm text-muted">Active Bounties</div>
                </div>
                
                <div className="bg-surface border border-border rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-info mb-1">
                    1.2K
                  </div>
                  <div className="text-sm text-muted">Active Users</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 