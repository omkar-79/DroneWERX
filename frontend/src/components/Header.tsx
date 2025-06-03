import React from 'react';
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
  ChevronDown,
  Star
} from 'lucide-react';
import { useToggle } from '../hooks';

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
  const { value: isUserMenuOpen, toggle: toggleUserMenu } = useToggle();
  const { value: isMobileMenuOpen, toggle: toggleMobileMenu } = useToggle();

  // Mock current user
  const currentUser = {
    username: 'warfighter_alpha',
    fullName: 'Captain Sarah Mitchell',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b8cc?w=40&h=40&fit=crop&crop=face',
    role: 'warfighter',
    reputation: 2450,
    isVerified: true
  };

  return (
    <header className="relative bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 border-b border-blue-700 sticky top-0 z-50 shadow-lg overflow-hidden">
      {/* US Flag Stars Pattern */}
      <div className="absolute left-0 top-0 h-full w-80 bg-blue-900 overflow-hidden">
        {/* Stars Pattern */}
        <div className="absolute inset-0 flex flex-wrap content-start p-2 opacity-20">
          {Array.from({ length: 50 }, (_, i) => (
            <Star
              key={i}
              size={8}
              className="text-white fill-white m-1"
              style={{
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>
        
        {/* Diagonal Cut */}
        <div className="absolute right-0 top-0 h-full w-20 bg-gradient-to-r from-transparent to-blue-800" 
             style={{
               background: 'linear-gradient(45deg, transparent 0%, transparent 40%, #1e3a8a 50%, #1e40af 100%)',
               clipPath: 'polygon(0 0, 100% 0, 80% 100%, 0% 100%)'
             }}>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4 min-w-0">
            <button
              onClick={toggleMobileMenu}
              className="lg:hidden p-2 rounded-lg hover:bg-blue-800/50 transition-colors text-white"
            >
              <Menu size={20} />
            </button>
            
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-white/20 to-white/10 rounded-xl shadow-lg border border-white/20 backdrop-blur-sm">
                <Target className="w-7 h-7 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-white">DroneWERX</h1>
                <p className="text-xs text-blue-200 font-medium">US Drone Association</p>
              </div>
            </div>
          </div>

          {/* Search Bar - Centered and Fixed Width */}
          <div className="hidden md:flex flex-1 justify-center px-8">
            <div className="relative w-full max-w-2xl">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search drone challenges, solutions, or discussions..."
                className="w-full pl-12 pr-4 py-3 bg-white/95 backdrop-blur-sm border border-white/20 rounded-xl focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all shadow-lg placeholder-gray-500 text-gray-900"
              />
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-3 min-w-0">
            {/* Create Thread Button */}
            <button
              onClick={onCreateThread}
              className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">New Challenge</span>
            </button>

            {/* Notifications */}
            <div className="relative">
              <button className="p-2.5 rounded-xl hover:bg-white/10 relative transition-colors text-white">
                <Bell size={20} />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-md">
                  3
                </span>
              </button>
            </div>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={toggleUserMenu}
                className="flex items-center space-x-3 p-2 rounded-xl hover:bg-white/10 transition-colors text-white"
              >
                <div className="relative">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.fullName}
                    className="w-8 h-8 rounded-full ring-2 ring-white/30 shadow-md"
                  />
                  {currentUser.isVerified && (
                    <Shield className="absolute -bottom-1 -right-1 w-4 h-4 text-blue-400 bg-white rounded-full p-0.5 shadow-sm" />
                  )}
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-sm font-semibold text-white">{currentUser.username}</p>
                  <p className="text-xs text-blue-200 capitalize">{currentUser.role}</p>
                </div>
                <ChevronDown size={16} className="text-blue-200 hidden lg:block" />
              </button>

              {/* Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-xl py-2 z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="font-semibold text-gray-900">{currentUser.fullName}</p>
                    <p className="text-sm text-gray-600">@{currentUser.username}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                        {currentUser.reputation} reputation
                      </span>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full capitalize font-medium">
                        {currentUser.role}
                      </span>
                    </div>
                  </div>
                  
                  <a href="/profile" className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors text-gray-700">
                    <User size={16} />
                    <span className="font-medium">Profile</span>
                  </a>
                  
                  <a href="/settings" className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors text-gray-700">
                    <Settings size={16} />
                    <span className="font-medium">Settings</span>
                  </a>
                  
                  <div className="border-t border-gray-100 my-2"></div>
                  
                  <button className="flex items-center space-x-3 px-4 py-3 hover:bg-red-50 w-full text-left text-red-600 transition-colors">
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
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search challenges and solutions..."
              className="w-full pl-12 pr-4 py-3 bg-white/95 backdrop-blur-sm border border-white/20 rounded-xl focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all shadow-lg placeholder-gray-500 text-gray-900"
            />
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-blue-700 py-4">
            <nav className="space-y-1">
              <a href="/" className="block px-3 py-3 rounded-lg hover:bg-white/10 font-semibold text-white transition-colors">
                Home
              </a>
              <a href="/categories" className="block px-3 py-3 rounded-lg hover:bg-white/10 transition-colors text-blue-200">
                Categories
              </a>
              <a href="/leaderboard" className="block px-3 py-3 rounded-lg hover:bg-white/10 transition-colors text-blue-200">
                Leaderboard
              </a>
              <a href="/bounties" className="block px-3 py-3 rounded-lg hover:bg-white/10 transition-colors text-blue-200">
                Bounties
              </a>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}; 