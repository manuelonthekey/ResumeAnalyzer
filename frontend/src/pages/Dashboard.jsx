import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import useAuthStore from '../store/useAuthStore';
import { FileText, Plus, LogOut, Award, Clipboard, ChevronRight, Zap, Target, Trash2, ChevronDown, User, Sparkles, Calendar, BookOpen, Check } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, logout } = useAuthStore();

  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [showScoresDropdown, setShowScoresDropdown] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Queries
  const { data: resumes = [], isLoading: resumesLoading } = useQuery({
    queryKey: ['resumes'],
    queryFn: async () => {
      const res = await api.get('/resumes');
      return res.data;
    }
  });

  const { data: feedbackSummary, isLoading: summaryLoading } = useQuery({
    queryKey: ['feedbackSummary'],
    queryFn: async () => {
      const res = await api.get('/feedback/summary');
      return res.data;
    }
  });

  const { data: interviewHistory = [], isLoading: historyLoading } = useQuery({
    queryKey: ['interviewHistory'],
    queryFn: async () => {
      const res = await api.get('/interviews/history');
      return res.data;
    }
  });

  // Set default selected resume when resumes list is loaded
  useEffect(() => {
    if (resumes.length > 0 && !selectedResumeId) {
      setSelectedResumeId(resumes[0].id);
    }
  }, [resumes]);

  // Mutations
  const deleteResumeMutation = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/resumes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['resumes']);
      queryClient.invalidateQueries(['interviewHistory']);
      queryClient.invalidateQueries(['feedbackSummary']);
      setSelectedResumeId('');
    },
    onError: (err) => {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to delete resume');
    }
  });

  const handleDeleteResume = (e, id, filename) => {
    e.stopPropagation(); // prevent navigating to analysis page
    if (confirm(`Are you sure you want to delete "${filename}"? All associated analyses and interview sessions will be permanently lost.`)) {
      deleteResumeMutation.mutate(id);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Helper: Get formatted current date
  const getFormattedDate = () => {
    const options = { weekday: 'long', month: 'short', day: 'numeric' };
    return new Date().toLocaleDateString('en-US', options);
  };

  // Helper: Get dynamic days of the current week
  const getWeekDays = () => {
    const current = new Date();
    const week = [];
    const day = current.getDay();
    const diff = current.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
    const monday = new Date(current.setDate(diff));
    
    const dayNames = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    for (let i = 0; i < 7; i++) {
      const nextDay = new Date(monday);
      nextDay.setDate(monday.getDate() + i);
      week.push({
        name: dayNames[i],
        date: nextDay.getDate(),
        isToday: nextDay.toDateString() === new Date().toDateString(),
        fullDate: nextDay
      });
    }
    return week;
  };

  const weekDays = getWeekDays();

  // Circular Progress calculations
  const avgScore = feedbackSummary?.avg_score || 0;
  const radius = 32;
  const strokeWidth = 4;
  const normalizedRadius = radius - strokeWidth * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (avgScore / 100) * circumference;

  // Mockup Date formatting helpers
  const getMockDateString = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    return `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}`;
  };

  const getWeekRangeString = () => {
    if (weekDays.length < 7) return '';
    const start = weekDays[0].fullDate;
    const end = weekDays[6].fullDate;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Check if week spans across months
    if (start.getMonth() !== end.getMonth()) {
      return `${months[start.getMonth()]} ${start.getDate()} - ${months[end.getMonth()]} ${end.getDate()}`;
    }
    return `${months[start.getMonth()]} ${start.getDate()}-${end.getDate()}`;
  };

  return (
    <div className="min-h-screen pb-24 pt-28 relative bg-transparent">
      
      {/* 1. Static Fixed Header (inspired by mockup with name, email and progress) */}
      <div className="fixed top-0 left-0 right-0 z-50 frosted-header rounded-b-[36px] px-8 py-5 shadow-sm flex items-center justify-between text-white">
        <div className="max-w-6xl mx-auto w-full flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div 
              onClick={() => navigate('/profile')}
              className="w-13 h-13 rounded-full overflow-hidden border-2 border-white cursor-pointer hover:scale-105 transition-all bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center shadow-md shrink-0"
              title="Edit Profile"
            >
              {user?.profile_picture ? (
                <img src={user.profile_picture} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="text-purple-500" size={20} />
              )}
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-extrabold text-white leading-tight flex items-center gap-1.5">
                {user?.name}
                <button 
                  onClick={handleLogout}
                  className="p-1 text-purple-200 hover:text-red-400 transition-colors ml-1.5"
                  title="Log Out"
                >
                  <LogOut size={16} />
                </button>
              </h1>
              <p className="text-purple-200 text-xs md:text-sm mt-0.5 font-medium">{user?.email}</p>
            </div>
          </div>

          {/* Circular Progress Ring trigger */}
          <div 
            onClick={() => setShowScoresDropdown(!showScoresDropdown)}
            className="flex items-center gap-2.5 cursor-pointer hover:scale-105 active:scale-98 transition-all bg-white/5 border border-white/10 rounded-2xl py-1.5 pl-2 pr-3.5 shadow-sm backdrop-blur-sm"
            title="View History Dropdown"
          >
            <div className="relative flex items-center justify-center w-9 h-9">
              <svg height={36} width={36} className="transform -rotate-90">
                <circle
                  stroke="rgba(255, 255, 255, 0.1)"
                  fill="transparent"
                  strokeWidth={2.5}
                  r={13}
                  cx={18}
                  cy={18}
                />
                <circle
                  stroke="#d8b4fe"
                  fill="transparent"
                  strokeWidth={2.5}
                  strokeDasharray={2 * Math.PI * 13}
                  strokeDashoffset={2 * Math.PI * 13 - (avgScore / 100) * (2 * Math.PI * 13)}
                  strokeLinecap="round"
                  r={13}
                  cx={18}
                  cy={18}
                  className="transition-all duration-500"
                />
              </svg>
              <div className="absolute text-[9px] font-black text-white">{avgScore}%</div>
            </div>
            <div className="text-left leading-none">
              <div className="text-[9px] font-bold text-white uppercase tracking-wider">Overall progress</div>
              <div className="text-[8px] text-purple-200 mt-0.5 font-semibold">{feedbackSummary?.total_sessions || 0} Sessions</div>
            </div>
          </div>
        </div>

        {/* Scores History Dropdown list */}
        {showScoresDropdown && (
          <div className="absolute right-8 top-20 w-64 bg-white/95 dark:bg-[#100818]/95 backdrop-blur-md rounded-xl shadow-2xl border border-purple-100 p-4 z-50 text-gray-800 dark:text-gray-200 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Last 7 Sessions</h4>
            {interviewHistory.slice(0, 7).length === 0 ? (
              <p className="text-xs text-gray-400">No sessions completed yet.</p>
            ) : (
              interviewHistory.slice(0, 7).map((session) => (
                <div key={session.id} className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-b-0">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300 capitalize">{session.session_type}</span>
                    <span className="text-[10px] text-gray-400">{new Date(session.started_at).toLocaleDateString()}</span>
                  </div>
                  <span className="text-[10px] font-black text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 border border-purple-100 px-2.5 py-0.5 rounded-full">
                    {session.overall_score || 0}%
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* 2. Main Content Grid (Covers at least 75% screen width) */}
      <div className="w-full max-w-[80%] mx-auto px-4 sm:px-6">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          {/* LEFT COLUMN: Upload Box + Uploaded Resumes */}
          <div className="space-y-6">
            
            {/* Upload New Resume card */}
            <div className="bg-purple-100/40 dark:bg-purple-900/20 border border-purple-200/50 rounded-2xl p-6 shadow-sm flex flex-col justify-between min-h-[220px]">
              <div className="flex justify-between items-start">
                <div className="p-3.5 bg-purple-200 text-purple-700 dark:text-purple-300 rounded-2xl">
                  <FileText size={24} />
                </div>
                
              </div>
              <div className="mt-4">
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Upload New Resume</h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 leading-relaxed">
                  Analyze your CV against job descriptions to discover missing ATS keywords or practice tailor-made interviews.
                </p>
              </div>
              <button 
                onClick={() => navigate('/upload')}
                className="mt-6 w-full py-3 bg-white dark:bg-[#100818] dark:text-gray-100 hover:bg-purple-50 dark:bg-purple-900/20 border border-purple-200 text-purple-600 dark:text-purple-400 font-bold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-sm btn-interactive cursor-pointer"
              >
                <Plus size={16} />
                Upload New Resume
              </button>
            </div>

            {/* Uploaded Resumes List */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white tracking-tight pl-1">Uploaded Resumes</h3>

              <div className="space-y-3">
                {resumesLoading ? (
                  <div className="text-center py-6 text-white/50 text-sm">Loading Resumes...</div>
                ) : resumes.length === 0 ? (
                  <div className="bg-white/5 border border-dashed border-white/10 rounded-2xl p-8 text-center text-white/60 text-sm">
                    No resumes uploaded yet. Upload one to start!
                  </div>
                ) : (
                  resumes.map((resume) => (
                    <div 
                      key={resume.id}
                      onClick={() => navigate(`/analysis/${resume.id}`)}
                      className="glass-card rounded-xl p-4 shadow-sm hover:shadow-lg transition-all border border-white/40 flex items-center justify-between cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-2xl shrink-0">
                          <FileText size={18} />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-purple-600 dark:text-purple-400 transition-colors truncate max-w-[120px] sm:max-w-[180px]">{resume.filename}</h4>
                          <p className="text-slate-400 text-[10px] mt-0.5">
                            Uploaded {new Date(resume.uploaded_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={(e) => handleDeleteResume(e, resume.id, resume.filename)}
                          disabled={deleteResumeMutation.isPending}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          title="Delete Resume"
                        >
                          <Trash2 size={14} />
                        </button>
                        <ChevronRight size={14} className="text-slate-400 group-hover:text-purple-600 dark:text-purple-400 group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Mock Coach Interview */}
          <div className="space-y-6">
            
            <div className="bg-white dark:bg-[#100818] dark:text-gray-100 rounded-2xl p-7 md:p-8 shadow-2xl border border-white/80 flex flex-col justify-between min-h-[350px] relative overflow-hidden">
              <div>
                <div className="flex justify-between items-center mb-6">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                     Ace Your Interviews
                  </span>
                </div>

                <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
                  Personal Interview Coach
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-3 leading-relaxed font-medium">
                  Practice role-specific Q&A generated from your resume. Improve structural clarity and speech delivery.
                </p>

                {/* Custom Aesthetically Animated Dropdown of Target Resume */}
                {resumes.length > 0 && (
                  <div className="mt-5 text-left relative">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1 pl-1">Target Resume Version</label>
                    <button
                      type="button"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 hover:border-purple-200 rounded-2xl flex items-center justify-between text-xs text-slate-650 font-bold transition-all duration-200 cursor-pointer"
                    >
                      <span className="truncate">
                        {resumes.find(r => r.id === selectedResumeId)?.filename || 'Select a version...'}
                      </span>
                      <ChevronDown size={14} className={`text-slate-400 transition-transform duration-300 ${isDropdownOpen ? 'transform rotate-180 text-purple-500' : ''}`} />
                    </button>
                    
                    {isDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
                        <div className="absolute left-0 right-0 mt-1.5 bg-white dark:bg-[#100818] dark:text-gray-100 border border-purple-100 rounded-2xl shadow-xl z-50 max-h-48 overflow-y-auto p-1.5 space-y-1 animate-in fade-in slide-in-from-top-1 duration-150">
                          {resumes.map((r) => (
                            <button
                              key={r.id}
                              type="button"
                              onClick={() => {
                                setSelectedResumeId(r.id);
                                setIsDropdownOpen(false);
                              }}
                              className={`w-full px-3 py-2 text-left text-xs font-semibold rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                                r.id === selectedResumeId
                                  ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'
                                  : 'text-slate-655 hover:bg-purple-50 dark:bg-purple-900/20 hover:text-purple-600 dark:text-purple-400'
                              }`}
                            >
                              <span className="truncate">{r.filename}</span>
                              {r.id === selectedResumeId && <Check size={12} className="text-purple-650 shrink-0" />}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-8 flex items-center justify-between">
                <button 
                  onClick={() => {
                    if (resumes.length === 0) {
                      alert('Please upload a resume first!');
                      navigate('/upload');
                    } else if (!selectedResumeId) {
                      alert('Please select a resume version!');
                    } else {
                      navigate(`/interview/${selectedResumeId}`);
                    }
                  }}
                  className="px-6 py-3.5 bg-black text-white font-bold text-xs uppercase tracking-wider rounded-full shadow-lg hover:bg-slate-900 active:scale-95 btn-interactive flex items-center gap-2 shrink-0 cursor-pointer"
                >
                  <Zap size={14} className="fill-current text-white" />
                  Start task
                </button>
                
                <div className="text-slate-400 text-xs font-semibold flex items-center gap-1.5 pr-1">
                  <BookOpen size={14} /> 20-30 min
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Floating Target Profile Capsule */}
      <div className="fixed bottom-8 left-0 right-0 px-6 flex justify-center z-40">
        <button 
          onClick={() => navigate('/profile')}
          className="px-6 py-3.5 bg-white/95 dark:bg-[#100818]/95 backdrop-blur-lg text-slate-800 dark:text-slate-200 text-[10px] font-black uppercase tracking-wider rounded-full shadow-2xl border border-white/80 hover:bg-white dark:bg-[#100818] dark:text-gray-100 active:scale-95 btn-interactive flex items-center gap-2"
        >
          <User size={12} className="text-purple-600 dark:text-purple-400" />
          {user?.preferred_roles ? `Targeting: ${user.preferred_roles.split(',')[0]}` : 'Set Target Career Profile'}
        </button>
      </div>

    </div>
  );
}
