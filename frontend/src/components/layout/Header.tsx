import React, { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Bell,
  User,
  Shield,
  Settings,
  LogOut,
  Menu,
  Plus,
  Target,
  ChevronDown
} from 'lucide-react';
import { useToggle } from '../../hooks';
import { useAuth } from '../../contexts/AuthContext';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onCreateThread: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  onCreateThread
}) => {
  const { value: isUserMenuOpen, toggle: toggleUserMenu, setFalse: closeUserMenu } = useToggle();
  const { value: isMobileMenuOpen, toggle: toggleMobileMenu } = useToggle();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user: currentUser, logout } = useAuth();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        closeUserMenu();
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen, closeUserMenu]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
      closeUserMenu();
    } catch (error) {
      console.error('Logout failed:', error);
      // Still close menu and redirect
      navigate('/login');
      closeUserMenu();
    }
  };

  const handleCreateThread = () => {
    navigate('/create-challenge');
  };

  // If no user, don't render the header (this shouldn't happen in protected routes)
  if (!currentUser) {
    return null;
  }

  return (
    <header className="relative sticky top-0 z-50 shadow-lg" style={{ backgroundColor: '#0E2148' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left Side - Logo and Brand */}
          <div className="flex items-center space-x-4 flex-shrink-0 min-w-0">
            <button
              onClick={toggleMobileMenu}
              className="md:hidden p-2 rounded-lg hover:bg-white/20 transition-colors text-gray-200 hover:text-white"
            >
              <Menu size={20} />
            </button>

            <Link to="/" className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-white/20 rounded-lg shadow-sm border border-white/30">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-white">DroneWERX</h1>
                <p className="text-xs text-blue-200 font-medium">US Drone Association</p>
              </div>
            </Link>
          </div>

          {/* Center - Search Bar */}
          <div className="hidden md:flex flex-1 justify-center mx-8">
            <div className="relative w-full max-w-2xl flex items-center">
              {!searchQuery && (
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <Search className="w-5 h-5 text-gray-400" />
                </div>
              )}
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="       Search drone challenges, solutions, or discussions..."
                className="w-full pl-11 pr-4 py-2.5 bg-white rounded-lg focus:ring-2 focus:ring-blue-300 focus:outline-none transition-all shadow-sm placeholder-gray-500 text-gray-900 placeholder:translate-x-2"
              />
            </div>
          </div>

          {/* Right Side - Actions */}
          <div className="flex items-center space-x-3 flex-shrink-0">
            {/* Create Thread Button */}
            <button
              onClick={handleCreateThread}
              className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">New Challenge</span>
            </button>

            {/* Notifications */}
            <div className="relative">
              <button className="p-2.5 rounded-lg hover:bg-white/20 relative transition-colors text-gray-200 hover:text-white">
                <Bell size={20} />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium shadow-md">
                  3
                </span>
              </button>
            </div>

            {/* User Menu */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={toggleUserMenu}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-white/20 transition-colors"
              >
                <div className="relative">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.fullName}
                    className="w-8 h-8 rounded-full ring-2 ring-white/30"
                  />
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-sm font-medium text-gray-100">{currentUser.username}</p>
                  <p className="text-xs text-blue-300 capitalize">{currentUser.role}</p>
                </div>
                <ChevronDown size={16} className="text-gray-300" />
              </button>

              {/* Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-xl py-2 z-50">
                  <div className="py-1 border-t border-border">
                    <div className="px-4 py-2">
                      <p className="text-sm font-medium text-secondary">{currentUser.fullName}</p>
                      <p className="text-xs text-muted">@{currentUser.username}</p>
                    </div>
                  </div>

                  <Link
                    to="/profile"
                    className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors text-gray-700"
                    onClick={closeUserMenu}
                  >
                    <User size={16} />
                    <span className="font-medium">Profile</span>
                  </Link>

                  <Link
                    to="/settings"
                    className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors text-gray-700"
                    onClick={closeUserMenu}
                  >
                    <Settings size={16} />
                    <span className="font-medium">Settings</span>
                  </Link>

                  <div className="border-t border-gray-100 my-2"></div>

                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-3 px-4 py-3 hover:bg-red-50 w-full text-left text-red-600 transition-colors"
                  >
                    <LogOut size={16} />
                    <span className="font-medium">Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden pb-4">
          <div className="relative flex items-center">
            {!searchQuery && (
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <Search className="w-5 h-5 text-gray-400" />
              </div>
            )}
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="         Search challenges and solutions..."
              className="w-full pl-11 pr-4 py-2.5 bg-white rounded-lg focus:ring-2 focus:ring-blue-300 focus:outline-none transition-all shadow-sm placeholder-gray-500 text-gray-900 placeholder:translate-x-2"
            />
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-blue-700/30 py-4">
            <nav className="space-y-1">
              <Link
                to="/"
                className="block px-3 py-2 rounded-lg hover:bg-white/20 font-medium text-gray-100 transition-colors"
                onClick={toggleMobileMenu}
              >
                Home
              </Link>
              <Link
                to="/categories"
                className="block px-3 py-2 rounded-lg hover:bg-white/20 transition-colors text-blue-300"
                onClick={toggleMobileMenu}
              >
                Categories
              </Link>
              <Link
                to="/leaderboard"
                className="block px-3 py-2 rounded-lg hover:bg-white/20 transition-colors text-blue-300"
                onClick={toggleMobileMenu}
              >
                Leaderboard
              </Link>
              <Link
                to="/bounties"
                className="block px-3 py-2 rounded-lg hover:bg-white/20 transition-colors text-blue-300"
                onClick={toggleMobileMenu}
              >
                Bounties
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}; 