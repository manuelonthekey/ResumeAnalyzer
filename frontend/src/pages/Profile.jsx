import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import useAuthStore from '../store/useAuthStore';
import { ArrowLeft, User, Mail, Briefcase, Linkedin, Github, Globe, Upload, Check, Loader } from 'lucide-react';

export default function Profile() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, updateUser } = useAuthStore();

  const [formData, setFormData] = useState({
    name: '',
    profile_picture: '',
    preferred_roles: '',
    linkedin_url: '',
    github_url: '',
    portfolio_url: ''
  });

  // Fetch full profile info
  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await api.get('/profile');
      return res.data;
    }
  });

  // Populate form
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        profile_picture: profile.profile_picture || '',
        preferred_roles: profile.preferred_roles || '',
        linkedin_url: profile.linkedin_url || '',
        github_url: profile.github_url || '',
        portfolio_url: profile.portfolio_url || ''
      });
    }
  }, [profile]);

  // Handle profile image upload (base64)
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check size limit (e.g., 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Profile picture must be under 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, profile_picture: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (updatedData) => {
      const res = await api.put('/profile', updatedData);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['profile']);
      // Update local storage and Zustand auth store
      updateUser(data.user);
      alert('Profile updated successfully!');
    },
    onError: (err) => {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to update profile.');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <Loader className="animate-spin text-primary-500" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent pb-12">
      {/* Header (Static/Unscrollable) */}
      <div className="fixed top-0 left-0 right-0 z-50 frosted-header rounded-b-[36px] px-8 py-5 shadow-sm">
        <div className="w-full flex items-center gap-4">
          <button 
            onClick={() => navigate('/dashboard')} 
            className="p-3 bg-white dark:bg-[#100818] dark:text-gray-100 hover:bg-violet-50 border border-violet-100 rounded-2xl transition-all text-violet-600 flex items-center justify-center btn-interactive shadow-sm"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">My Profile Settings</h1>
            <p className="text-purple-200 text-sm mt-0.5">Customize your portfolio, preferred roles and socials</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 mt-28">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Avatar Card */}
          <div className="glass-card rounded-2xl p-6 shadow-sm border border-white/60 flex flex-col sm:flex-row items-center gap-6">
            <div className="relative group shrink-0">
              <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white bg-primary-50 flex items-center justify-center shadow-md">
                {formData.profile_picture ? (
                  <img src={formData.profile_picture} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User size={48} className="text-primary-300" />
                )}
              </div>
              <label className="absolute bottom-0 right-0 p-2 bg-primary-500 text-white rounded-full cursor-pointer hover:bg-primary-600 hover:scale-105 transition-all shadow-md">
                <Upload size={16} />
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
            </div>
            <div className="text-center sm:text-left">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">{formData.name || 'User Name'}</h3>
              <p className="text-gray-400 text-sm flex items-center gap-1.5 justify-center sm:justify-start mt-1">
                <Mail size={14} /> {profile?.email}
              </p>
              <p className="text-xs text-primary-500 font-semibold mt-2">Upload PNG or JPG under 2MB</p>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6 shadow-sm border border-white/60 space-y-4">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 border-b border-gray-100 pb-2 mb-4">Personal Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2 pl-2">Full Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                    <User size={16} />
                  </span>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full pl-11 pr-4 py-3 bg-gray-50/50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:bg-white dark:bg-[#100818] dark:text-gray-100 text-gray-700 dark:text-gray-300 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2 pl-2">Preferred Job Roles</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                    <Briefcase size={16} />
                  </span>
                  <input
                    type="text"
                    placeholder="e.g. Frontend Engineer, Product Manager"
                    value={formData.preferred_roles}
                    onChange={(e) => setFormData(prev => ({ ...prev, preferred_roles: e.target.value }))}
                    className="w-full pl-11 pr-4 py-3 bg-gray-50/50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:bg-white dark:bg-[#100818] dark:text-gray-100 text-gray-700 dark:text-gray-300 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Socials & Portfolios */}
          <div className="glass-card rounded-2xl p-6 shadow-sm border border-white/60 space-y-4">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 border-b border-gray-100 pb-2 mb-4">Professional Links</h3>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2 pl-2">LinkedIn Profile URL</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                    <Linkedin size={16} />
                  </span>
                  <input
                    type="url"
                    placeholder="https://linkedin.com/in/username"
                    value={formData.linkedin_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, linkedin_url: e.target.value }))}
                    className="w-full pl-11 pr-4 py-3 bg-gray-50/50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:bg-white dark:bg-[#100818] dark:text-gray-100 text-gray-700 dark:text-gray-300 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2 pl-2">GitHub Profile URL</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                    <Github size={16} />
                  </span>
                  <input
                    type="url"
                    placeholder="https://github.com/username"
                    value={formData.github_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, github_url: e.target.value }))}
                    className="w-full pl-11 pr-4 py-3 bg-gray-50/50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:bg-white dark:bg-[#100818] dark:text-gray-100 text-gray-700 dark:text-gray-300 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2 pl-2">Portfolio/Personal Website URL</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                    <Globe size={16} />
                  </span>
                  <input
                    type="url"
                    placeholder="https://myportfolio.com"
                    value={formData.portfolio_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, portfolio_url: e.target.value }))}
                    className="w-full pl-11 pr-4 py-3 bg-gray-50/50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:bg-white dark:bg-[#100818] dark:text-gray-100 text-gray-700 dark:text-gray-300 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={updateProfileMutation.isPending}
            className="w-full gradient-header text-white font-semibold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 btn-interactive"
          >
            {updateProfileMutation.isPending ? (
              <>
                <Loader className="animate-spin" size={18} />
                Saving Changes...
              </>
            ) : (
              <>
                <Check size={18} /> Save Settings
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
