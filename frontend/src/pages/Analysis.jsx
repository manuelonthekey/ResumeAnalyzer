import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { ArrowLeft, Award, FileText, CheckCircle, AlertTriangle, Lightbulb, BookOpen, Briefcase, Code, Star, Loader } from 'lucide-react';

export default function Analysis() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [jdText, setJdText] = useState('');
  const [activeTab, setActiveTab] = useState('structure'); // 'structure' or 'analysis'

  // Fetch Resume details
  const { data: resume, isLoading: resumeLoading } = useQuery({
    queryKey: ['resume', id],
    queryFn: async () => {
      const res = await api.get(`/resumes/${id}`);
      return res.data;
    }
  });

  // Fetch past analyses
  const { data: analyses = [], isLoading: analysesLoading } = useQuery({
    queryKey: ['analyses', id],
    queryFn: async () => {
      const res = await api.get(`/analysis/${id}`);
      return res.data;
    }
  });

  // Run analysis mutation
  const analyzeMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/analysis/analyze', {
        resume_id: id,
        jd_text: jdText
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['analyses', id]);
      setActiveTab('analysis');
    }
  });

  const latestAnalysis = analyses[0]?.analysis_result || null;
  const parsed = resume?.parsed_structure || {};

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
          <div className="flex-1">
            <h1 className="text-2xl font-extrabold tracking-tight truncate max-w-[300px] md:max-w-none text-white">
              {resume?.filename || 'Resume Analysis'}
            </h1>
            <p className="text-purple-200 text-sm mt-0.5">
              {resume ? `Uploaded on ${new Date(resume.uploaded_at).toLocaleDateString()}` : 'Loading...'}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-28">
        {/* Toggle tabs */}
        <div className="flex bg-white/60 p-1.5 rounded-xl mb-6 max-w-md mx-auto border border-white/85">
          <button
            onClick={() => setActiveTab('structure')}
            className={`flex-1 py-3 text-sm font-semibold rounded-2xl transition-all cursor-pointer ${
              activeTab === 'structure' 
                ? 'bg-white dark:bg-[#100818] dark:text-gray-100 text-primary-600 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-300'
            }`}
          >
            Parsed Structure
          </button>
          <button
            onClick={() => setActiveTab('analysis')}
            className={`flex-1 py-3 text-sm font-semibold rounded-2xl transition-all cursor-pointer ${
              activeTab === 'analysis' 
                ? 'bg-white dark:bg-[#100818] dark:text-gray-100 text-primary-600 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-300'
            }`}
          >
            AI Review & ATS
          </button>
        </div>

        {resumeLoading ? (
          <div className="text-center py-12 text-gray-500">Loading resume...</div>
        ) : (
          <div>
            {/* TAB 1: Structure */}
            {activeTab === 'structure' && (
              <div className="space-y-6">
                {/* Personal Info */}
                <div className="glass-card rounded-2xl p-6 shadow-sm border border-white/60">
                  <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                    <Star className="text-primary-500" size={20} /> Personal Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div><span className="text-gray-400">Name:</span> <span className="font-semibold text-gray-700 dark:text-gray-300">{parsed.personal?.name}</span></div>
                    <div><span className="text-gray-400">Email:</span> <span className="font-semibold text-gray-700 dark:text-gray-300">{parsed.personal?.email}</span></div>
                    <div><span className="text-gray-400">Phone:</span> <span className="font-semibold text-gray-700 dark:text-gray-300">{parsed.personal?.phone}</span></div>
                    <div><span className="text-gray-400">Location:</span> <span className="font-semibold text-gray-700 dark:text-gray-300">{parsed.personal?.location}</span></div>
                  </div>
                </div>

                {/* Education */}
                <div className="glass-card rounded-2xl p-6 shadow-sm border border-white/60">
                  <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                    <BookOpen className="text-primary-500" size={20} /> Education
                  </h3>
                  {parsed.education?.length > 0 ? (
                    <div className="space-y-4">
                      {parsed.education.map((edu, idx) => (
                        <div key={idx} className="border-l-2 border-primary-200 pl-4 py-1">
                          <h4 className="font-bold text-gray-800 dark:text-gray-200">{edu.degree} {edu.field && `in ${edu.field}`}</h4>
                          <p className="text-gray-600 text-sm">{edu.institution} {edu.year_end && `• Class of ${edu.year_end}`}</p>
                          {edu.cgpa && <p className="text-primary-500 text-xs font-semibold mt-1">Score: {edu.cgpa}</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-sm">No education data found</p>
                  )}
                </div>

                {/* Experience */}
                <div className="glass-card rounded-2xl p-6 shadow-sm border border-white/60">
                  <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                    <Briefcase className="text-primary-500" size={20} /> Work Experience
                  </h3>
                  {parsed.experience?.length > 0 ? (
                    <div className="space-y-6">
                      {parsed.experience.map((exp, idx) => (
                        <div key={idx} className="border-l-2 border-primary-200 pl-4">
                          <div className="flex justify-between items-start flex-wrap gap-1">
                            <h4 className="font-bold text-gray-800 dark:text-gray-200 text-lg">{exp.title}</h4>
                            <span className="text-xs bg-primary-50 text-primary-600 px-3 py-1 rounded-full border border-primary-100 font-semibold">
                              {exp.duration_start} {exp.duration_end && `to ${exp.duration_end}`}
                            </span>
                          </div>
                          <p className="text-gray-600 text-sm font-semibold">{exp.company}</p>
                          {/* Show extracted keywords if available, else fall back to description */}
                          {exp.keywords?.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {exp.keywords.map((kw, ki) => (
                                <span key={ki} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-xl border border-gray-200">{kw}</span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-500 text-sm mt-2 line-clamp-3">{exp.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-sm">No work experience found</p>
                  )}
                </div>

                {/* Skills */}
                <div className="glass-card rounded-2xl p-6 shadow-sm border border-white/60">
                  <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                    <Code className="text-primary-500" size={20} /> Skills
                  </h3>
                  {(() => {
                    const s = parsed.skills || {};
                    // Use the 'all' deduplicated list, fallback to languages, fallback to experience_keywords
                    const displaySkills = [
                      ...(s.all || []),
                      ...(s.languages || []),
                      ...(s.frameworks || []),
                      ...(s.tools || []),
                      ...(s.other || [])
                    ].filter(Boolean);
                    const uniqueSkills = [...new Set(displaySkills)];
                    const expKw = s.experience_keywords || [];
                    const projKw = s.project_keywords || [];
                    return uniqueSkills.length > 0 ? (
                      <div className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                          {uniqueSkills.map((skill, idx) => (
                            <span key={idx} className="bg-white dark:bg-[#100818] dark:text-gray-100 px-4 py-2 rounded-2xl shadow-sm text-sm font-semibold text-gray-700 dark:text-gray-300 border border-primary-100">
                              {skill}
                            </span>
                          ))}
                        </div>
                        {expKw.length > 0 && (
                          <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Keywords from Experience</p>
                            <div className="flex flex-wrap gap-1.5">
                              {expKw.slice(0, 25).map((kw, idx) => (
                                <span key={idx} className="text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-xl border border-blue-100">{kw}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {projKw.length > 0 && (
                          <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Keywords from Projects</p>
                            <div className="flex flex-wrap gap-1.5">
                              {projKw.slice(0, 20).map((kw, idx) => (
                                <span key={idx} className="text-xs bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-xl border border-emerald-100">{kw}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : expKw.length > 0 ? (
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Keywords Extracted from Experience</p>
                        <div className="flex flex-wrap gap-1.5">
                          {expKw.slice(0, 30).map((kw, idx) => (
                            <span key={idx} className="text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-xl border border-blue-100">{kw}</span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-400 text-sm">No skills extracted. Try running the AI Review to identify key skills from your experience.</p>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* TAB 2: Analysis */}
            {activeTab === 'analysis' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Column: Input */}
                <div className="lg:col-span-1 space-y-6">
                  <div className="glass-card rounded-2xl p-6 shadow-sm border border-white/60 h-full">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">Target Job Description</h3>
                    <p className="text-gray-400 text-sm mb-4">Paste the Job Description below to evaluate match and extract missing keywords.</p>
                    
                    <textarea
                      rows={12}
                      value={jdText}
                      onChange={(e) => setJdText(e.target.value)}
                      placeholder="Paste the Job Description / Job Ad here..."
                      className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:bg-white dark:bg-[#100818] dark:text-gray-100 transition-all text-gray-700 dark:text-gray-300 text-sm mb-4 resize-none"
                    />

                    <button
                      onClick={() => analyzeMutation.mutate()}
                      disabled={analyzeMutation.isPending}
                      className="w-full gradient-header text-white font-semibold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 btn-interactive"
                    >
                      {analyzeMutation.isPending ? (
                        <>
                          <Loader className="animate-spin" size={18} />
                          Analyzing...
                        </>
                      ) : (
                        'Analyze'
                      )}
                    </button>
                    {analyzeMutation.isError && (
                      <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-2xl text-sm border border-red-100 text-center">
                        {analyzeMutation.error?.response?.data?.error || 'Failed to analyze resume'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column: Output */}
                <div className="lg:col-span-2 space-y-6">
                  {latestAnalysis ? (
                    <>
                      {/* Score Section */}
                      <div className="glass-card rounded-2xl p-6 shadow-sm border border-white/60 flex flex-col md:flex-row items-center gap-6">
                        <div className="w-28 h-28 rounded-full gradient-header text-white flex flex-col items-center justify-center shadow-lg shrink-0">
                          <span className="text-4xl font-black">{latestAnalysis.overall_rating || 0}</span>
                          <span className="text-xs font-semibold text-white/80">/10 Rating</span>
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Overall Assessment</h3>
                          <p className="text-gray-600 text-sm mt-1 leading-relaxed">{latestAnalysis.summary}</p>
                          
                          {/* ATS Score display if available */}
                          {analyses[0]?.ats_score !== null && (
                            <div className="mt-4 flex items-center gap-3">
                              <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-2xl border border-emerald-200 flex items-center gap-1.5">
                                <Award size={16} /> ATS Match: {analyses[0].ats_score}%
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Main feedback content */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Strengths & Weaknesses */}
                        <div className="glass-card rounded-2xl p-6 shadow-sm border border-white/60">
                          <h4 className="font-bold text-gray-800 dark:text-gray-200 text-lg mb-4 flex items-center gap-2">
                            <CheckCircle className="text-emerald-500" size={20} /> Strengths
                          </h4>
                          <ul className="space-y-2 text-sm text-gray-600 pl-1">
                            {latestAnalysis.strengths?.map((str, idx) => (
                              <li key={idx} className="flex gap-2">
                                <span className="text-emerald-500 font-bold">•</span>
                                <span>{str}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="glass-card rounded-2xl p-6 shadow-sm border border-white/60">
                          <h4 className="font-bold text-gray-800 dark:text-gray-200 text-lg mb-4 flex items-center gap-2">
                            <AlertTriangle className="text-amber-500" size={20} /> Areas to Improve
                          </h4>
                          <ul className="space-y-2 text-sm text-gray-600 pl-1">
                            {latestAnalysis.weaknesses?.map((weak, idx) => (
                              <li key={idx} className="flex gap-2">
                                <span className="text-amber-500 font-bold">•</span>
                                <span>{weak}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Suggestions */}
                        <div className="glass-card rounded-2xl p-6 shadow-sm border border-white/60 md:col-span-2">
                          <h4 className="font-bold text-gray-800 dark:text-gray-200 text-lg mb-4 flex items-center gap-2">
                            <Lightbulb className="text-primary-500" size={20} /> Specific Suggestions
                          </h4>
                          <div className="space-y-3">
                            {latestAnalysis.suggestions?.map((sug, idx) => (
                              <div key={idx} className="bg-white dark:bg-[#100818] dark:text-gray-100 p-4 rounded-2xl border border-primary-50/50 shadow-sm flex items-start gap-3">
                                <span className="text-xs font-bold text-primary-600 bg-primary-50 px-2.5 py-1 rounded-full uppercase border border-primary-100 mt-0.5 shrink-0">
                                  {sug.section}
                                </span>
                                <p className="text-sm text-gray-600 mt-0.5">{sug.suggestion}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Missing Keywords */}
                        {latestAnalysis.ats_keywords_missing?.length > 0 && (
                          <div className="glass-card rounded-2xl p-6 shadow-sm border border-white/60 md:col-span-2">
                            <h4 className="font-bold text-gray-800 dark:text-gray-200 text-lg mb-4">Missing ATS Keywords</h4>
                            <div className="flex flex-wrap gap-2">
                              {latestAnalysis.ats_keywords_missing.map((kw, idx) => (
                                <span key={idx} className="bg-amber-50 text-amber-700 px-3 py-1.5 rounded-2xl text-xs font-semibold border border-amber-200">
                                  {kw}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="bg-white/50 border border-dashed border-gray-200 rounded-xl p-8 text-center text-gray-500 h-full flex flex-col items-center justify-center min-h-[300px]">
                      <FileText className="text-gray-300 mb-3" size={48} />
                      <p>Paste a Job Description on the left and click <b>Analyze</b> <br/> to get an AI assessment.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
