import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: UserRole.WARFIGHTER,
    firstName: '',
    lastName: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        fullName: `${formData.firstName} ${formData.lastName}`,
      });
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-slate-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-amber-400 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-navy-900">DW</span>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">
            Join DroneWERX
          </h2>
          <p className="text-slate-300">
            Register to participate in military drone innovation
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="sr-only">
                First Name
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                required
                value={formData.firstName}
                onChange={handleChange}
                className="relative block w-full px-3 py-3 border border-slate-600 placeholder-slate-400 text-white bg-slate-800/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent focus:z-10"
                placeholder="First Name"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="sr-only">
                Last Name
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                required
                value={formData.lastName}
                onChange={handleChange}
                className="relative block w-full px-3 py-3 border border-slate-600 placeholder-slate-400 text-white bg-slate-800/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent focus:z-10"
                placeholder="Last Name"
              />
            </div>
          </div>

          <div>
            <label htmlFor="username" className="sr-only">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              value={formData.username}
              onChange={handleChange}
              className="relative block w-full px-3 py-3 border border-slate-600 placeholder-slate-400 text-white bg-slate-800/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
              placeholder="Username"
            />
          </div>

          <div>
            <label htmlFor="email" className="sr-only">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="relative block w-full px-3 py-3 border border-slate-600 placeholder-slate-400 text-white bg-slate-800/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
              placeholder="Email address"
            />
          </div>

          <div>
            <label htmlFor="role" className="sr-only">
              Role
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="relative block w-full px-3 py-3 border border-slate-600 text-white bg-slate-800/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
            >
              <option value={UserRole.WARFIGHTER}>Warfighter</option>
              <option value={UserRole.INNOVATOR}>Innovator</option>
              <option value={UserRole.MODERATOR}>Moderator</option>
            </select>
          </div>

          <div>
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleChange}
              className="relative block w-full px-3 py-3 border border-slate-600 placeholder-slate-400 text-white bg-slate-800/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
              placeholder="Password"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="sr-only">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              className="relative block w-full px-3 py-3 border border-slate-600 placeholder-slate-400 text-white bg-slate-800/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
              placeholder="Confirm Password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-navy-900 bg-amber-400 hover:bg-amber-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Creating Account...' : 'Register'}
          </button>

          <div className="text-center">
            <span className="text-slate-300">Already have an account? </span>
            <Link to="/login" className="text-amber-400 hover:text-amber-300 font-medium">
              Sign in here
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register; 