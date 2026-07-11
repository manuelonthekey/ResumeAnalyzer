import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { ArrowLeft, Mic, MicOff, Send, CheckCircle, AlertTriangle, Play, Award, Loader, ChevronRight, Volume2, Target } from 'lucide-react';

export default function Interview() {
  const { id } = useParams(); // resume ID
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionIdParam = searchParams.get('session');

  // Fetch Interview History
  const { data: interviewHistory = [] } = useQuery({
    queryKey: ['interviewHistory'],
    queryFn: async () => {
      const res = await api.get('/interview/sessions');
      return res.data;
    }
  });

  // Session state
  const [sessionStarted, setSessionStarted] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [sessionId, setSessionId] = useState(sessionIdParam || null);
  const [sessionType, setSessionType] = useState('behavioral'); // 'behavioral', 'technical', 'pm'
  
  // Q&A round state
  const [questionNumber, setQuestionNumber] = useState(1);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [userAnswer, setUserAnswer] = useState('');
  
  // Loading states
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  
  // Feedback log for current question
  const [feedback, setFeedback] = useState(null);
  
  // Entire session history/logs (for review mode)
  const [sessionDetails, setSessionDetails] = useState(null);

  // Web Speech API / Voice state
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        setUserAnswer(prev => prev + ' ' + finalTranscript);
      };

      rec.onerror = (e) => {
        console.error('Speech recognition error:', e);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  // Fetch session details if loaded in review mode (from history)
  useEffect(() => {
    if (sessionIdParam) {
      fetchSessionDetails(sessionIdParam);
    }
  }, [sessionIdParam]);

  const fetchSessionDetails = async (sid) => {
    try {
      const res = await api.get(`/interviews/${sid}`);
      setSessionDetails(res.data);
      setSessionEnded(true);
      setSessionStarted(true);
    } catch (e) {
      console.error(e);
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech Recognition is not supported in this browser. Try Google Chrome.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleStartSession = async () => {
    setLoadingQuestion(true);
    try {
      const res = await api.post('/interviews/start', {
        resume_id: id,
        session_type: sessionType
      });
      setSessionId(res.data.session_id);
      setCurrentQuestion(res.data.first_question);
      setSessionStarted(true);
      setQuestionNumber(1);
    } catch (e) {
      console.error(e);
      alert('Failed to start interview. Check if database is configured properly.');
    } finally {
      setLoadingQuestion(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!userAnswer.trim()) return;
    setLoadingFeedback(true);
    try {
      const res = await api.post(`/interviews/${sessionId}/answer`, {
        question_number: questionNumber,
        question_text: currentQuestion,
        answer: userAnswer
      });
      setFeedback(res.data.feedback);
      
      // We set the next question but don't show it until they click "Next"
      // Store the next question value temporarily
      recognitionRef.current?.stop();
    } catch (e) {
      console.error(e);
      alert('Failed to submit answer.');
    } finally {
      setLoadingFeedback(false);
    }
  };

  const handleNextQuestion = () => {
    if (!feedback) return;
    // Advance to next round
    setCurrentQuestion(feedback.follow_up_question || 'No more questions. Click End Session.');
    setUserAnswer('');
    setFeedback(null);
    setQuestionNumber(prev => prev + 1);
  };

  const handleEndSession = async () => {
    setLoadingQuestion(true);
    try {
      const res = await api.post(`/interviews/${sessionId}/end`);
      // Refresh session details to show the final summary screen
      fetchSessionDetails(sessionId);
    } catch (e) {
      console.error(e);
      alert('Failed to end session.');
    } finally {
      setLoadingQuestion(false);
    }
  };

  // Text-to-speech support for question reading
  const handleSpeakQuestion = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(currentQuestion);
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="min-h-screen bg-transparent pb-12">
      {/* Header (Static/Unscrollable) */}
      <div className="fixed top-0 left-0 right-0 z-50 frosted-header rounded-b-[36px] px-8 py-5 shadow-sm">
        <div className="w-full flex items-center gap-4">
          <button 
            onClick={() => navigate('/dashboard')} 
            className="p-3 bg-white hover:bg-violet-50 border border-violet-100 rounded-2xl transition-all text-violet-600 flex items-center justify-center btn-interactive shadow-sm"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">AI Mock Coach</h1>
            <p className="text-purple-200 text-sm mt-0.5">Real-time mock interview grounded in your resume</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 mt-28">
        
        {/* PHASE 1: START SCREEN */}
        {!sessionStarted && (
          <div className="space-y-6">
            <div className="glass-card rounded-4xl p-8 shadow-md border border-white/60 text-center">
              <div className="w-20 h-20 bg-purple-100 text-purple-600 rounded-3xl mx-auto flex items-center justify-center mb-6 shadow-sm">
                <Play size={36} className="fill-current" />
              </div>
              
              <h2 className="text-2xl font-extrabold text-gray-800 tracking-tight">Ready to Prep?</h2>
              <p className="text-gray-500 text-sm max-w-sm mx-auto mt-2 leading-relaxed">
                We'll generate customized questions targeting the experience and projects on your resume.
              </p>

              <div className="mt-8 max-w-xs mx-auto space-y-4">
                <div className="text-left">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2 pl-2">
                    Choose session type
                  </label>
                  <div className="flex bg-gray-100/50 p-1 rounded-2xl border border-gray-100">
                    {['behavioral', 'technical', 'pm'].map((type) => (
                      <button
                        key={type}
                        onClick={() => setSessionType(type)}
                        className={`flex-1 py-2 text-xs font-bold rounded-xl uppercase transition-all cursor-pointer ${
                          sessionType === type 
                            ? 'bg-white text-purple-600 shadow-sm' 
                            : 'text-gray-400 hover:text-gray-500'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleStartSession}
                  disabled={loadingQuestion}
                  className="w-full gradient-header text-white font-semibold py-4 rounded-3xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 hover:opacity-90 btn-interactive cursor-pointer"
                >
                  {loadingQuestion ? 'Generating first question...' : 'Start Interview'}
                </button>
              </div>
            </div>

            {/* Past Session History list */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white tracking-tight pl-1">Past Sessions History</h3>
              <div className="space-y-3">
                {interviewHistory.length === 0 ? (
                  <div className="bg-white/5 border border-dashed border-white/10 rounded-[32px] p-8 text-center text-white/60 text-sm">
                    No mock sessions completed yet.
                  </div>
                ) : (
                  interviewHistory.map((session) => (
                    <div 
                      key={session.id}
                      onClick={() => {
                        navigate(`/interview/${session.resume_id}?session=${session.id}`);
                        window.location.reload();
                      }}
                      className="glass-card rounded-[28px] p-4 shadow-sm hover:shadow-lg transition-all border border-white/40 flex items-center justify-between cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-3 bg-purple-50 text-purple-650 rounded-2xl shrink-0">
                          <Target size={18} />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-800 group-hover:text-purple-600 transition-colors capitalize truncate max-w-[180px] sm:max-w-[240px]">
                            {session.session_type} Prep
                          </h4>
                          <p className="text-slate-400 text-[10px] mt-0.5">
                            {new Date(session.started_at).toLocaleDateString()} • {session.question_count} Qs
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="font-black text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full text-[10px]">
                          {session.overall_score || 0}%
                        </span>
                        <ChevronRight size={14} className="text-slate-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* PHASE 2: ACTIVE SESSION */}
        {sessionStarted && !sessionEnded && (
          <div className="space-y-6">
            
            {/* Question Card */}
            <div className="glass-card rounded-4xl p-6 shadow-md border border-white/60 relative overflow-hidden">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-black uppercase tracking-wider text-primary-600 bg-primary-50 border border-primary-100 px-3 py-1 rounded-full">
                  Question #{questionNumber}
                </span>
                <button
                  onClick={handleSpeakQuestion}
                  className="p-2 bg-primary-50 hover:bg-primary-100 text-primary-600 rounded-xl transition-all flex items-center justify-center btn-interactive"
                  title="Speak Question"
                >
                  <Volume2 size={16} />
                </button>
              </div>

              <h3 className="text-xl font-extrabold text-gray-800 leading-snug">
                {currentQuestion}
              </h3>
            </div>

            {!feedback ? (
              <div className="glass-card rounded-4xl p-6 shadow-md border border-white/60 relative overflow-hidden">
                {/* Speech Recognition Active Overlay Popup */}
                {isListening && (
                  <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200">
                    <div className="relative flex items-center justify-center mb-4">
                      <div className="absolute w-20 h-20 bg-coral-100 rounded-full animate-ping opacity-75"></div>
                      <div className="w-16 h-16 rounded-full bg-coral-500 text-white flex items-center justify-center shadow-lg relative z-10">
                        <Mic size={28} />
                      </div>
                    </div>
                    <h4 className="text-lg font-black text-gray-800">Voice Recording Active</h4>
                    <p className="text-xs text-gray-400 mt-1 max-w-xs">
                      Speak clearly into your microphone. Your words will appear in the input field.
                    </p>
                    
                    <button
                      onClick={toggleListening}
                      className="mt-6 px-6 py-3 bg-red-500 hover:bg-red-600 text-white text-xs font-bold uppercase tracking-wider rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 hover:scale-102"
                    >
                      <MicOff size={14} /> Stop Recording
                    </button>
                  </div>
                )}

                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold text-gray-800">Your Answer</h4>
                  {/* Voice Button */}
                  <button
                    onClick={toggleListening}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-semibold border transition-all cursor-pointer ${
                      isListening 
                        ? 'bg-primary-500 border-primary-500 text-white animate-pulse' 
                        : 'bg-white border-primary-200 text-primary-600 hover:bg-primary-50'
                    }`}
                  >
                    <Mic size={14} /> Speak Answer
                  </button>
                </div>

                <textarea
                  rows={6}
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Type your response or click 'Speak Answer' to talk..."
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-3xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:bg-white transition-all text-gray-700 text-sm mb-4"
                  disabled={loadingFeedback}
                />

                <div className="flex gap-4">
                  <button
                    onClick={handleEndSession}
                    className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold rounded-3xl transition-all btn-interactive"
                  >
                    End Session
                  </button>
                  <button
                    onClick={handleSubmitAnswer}
                    disabled={loadingFeedback || !userAnswer.trim()}
                    className="flex-[2] gradient-header text-white font-semibold py-3.5 rounded-3xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 btn-interactive"
                  >
                    {loadingFeedback ? (
                      <>
                        <Loader className="animate-spin" size={18} /> Evaluating...
                      </>
                    ) : (
                      <>
                        Submit Answer <Send size={16} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              /* Feedback Display Card */
              <div className="space-y-6">
                <div className="glass-card bg-emerald-50/50 rounded-4xl p-6 shadow-md border border-emerald-100 flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex flex-col items-center justify-center shadow shrink-0">
                    <span className="text-2xl font-black">{feedback.score || 0}</span>
                    <span className="text-[9px] font-semibold text-white/80">/100</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 text-lg">Answer Feedback</h4>
                    <p className="text-sm text-gray-600 mt-0.5">{feedback.suggestion}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="glass-card rounded-4xl p-6 shadow-sm border border-white/60">
                    <h5 className="font-bold text-emerald-600 mb-3 flex items-center gap-2">
                      <CheckCircle size={18} /> Strengths
                    </h5>
                    <ul className="text-sm text-gray-600 space-y-1.5 list-disc pl-4">
                      {feedback.strengths?.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>

                  <div className="glass-card rounded-4xl p-6 shadow-sm border border-white/60">
                    <h5 className="font-bold text-amber-600 mb-3 flex items-center gap-2">
                      <AlertTriangle size={18} /> Areas to Improve
                    </h5>
                    <ul className="text-sm text-gray-600 space-y-1.5 list-disc pl-4">
                      {feedback.weaknesses?.map((w, i) => <li key={i}>{w}</li>)}
                    </ul>
                  </div>
                </div>

                <button
                  onClick={handleNextQuestion}
                  className="w-full gradient-header text-white font-semibold py-4 rounded-3xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 hover:opacity-90 btn-interactive"
                >
                  Next Question <ChevronRight size={18} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* PHASE 3: SUMMARY SCREEN (SESSION ENDED) */}
        {sessionStarted && sessionEnded && (
          <div className="space-y-6">
            
            {/* Overview Score Card */}
            <div className="glass-card rounded-4xl p-8 shadow-md border border-white/60 text-center relative overflow-hidden">
              <div className="w-28 h-28 rounded-full gradient-header text-white mx-auto flex flex-col items-center justify-center shadow-lg mb-6">
                <span className="text-4xl font-black">{sessionDetails?.overall_score || 0}</span>
                <span className="text-xs font-semibold text-white/80">/100 Overall</span>
              </div>

              <h2 className="text-2xl font-extrabold text-gray-800 tracking-tight">Interview Finished!</h2>
              <p className="text-gray-500 text-sm max-w-sm mx-auto mt-2 leading-relaxed">
                Here is how you performed overall during the session.
              </p>
            </div>

            {/* AI Summary details */}
            {sessionDetails?.feedback_summary && (
              <div className="space-y-6">
                <div className="glass-card rounded-4xl p-6 shadow-sm border border-white/60">
                  <h3 className="font-bold text-gray-800 text-lg mb-2">Overall Feedback</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {sessionDetails.feedback_summary.overall_summary}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="glass-card rounded-4xl p-6 shadow-sm border border-white/60">
                    <h4 className="font-bold text-emerald-600 mb-3 flex items-center gap-1.5">
                      <Award size={18} /> Key Strengths
                    </h4>
                    <ul className="text-sm text-gray-600 space-y-1.5 list-disc pl-4">
                      {sessionDetails.feedback_summary.key_strengths?.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>

                  <div className="glass-card rounded-4xl p-6 shadow-sm border border-white/60">
                    <h4 className="font-bold text-amber-600 mb-3 flex items-center gap-1.5">
                      <AlertTriangle size={18} /> Key Weaknesses
                    </h4>
                    <ul className="text-sm text-gray-600 space-y-1.5 list-disc pl-4">
                      {sessionDetails.feedback_summary.key_weaknesses?.map((w, i) => <li key={i}>{w}</li>)}
                    </ul>
                  </div>
                </div>

                 <div className="glass-card rounded-4xl p-6 shadow-sm border border-white/60">
                  <h4 className="font-bold text-gray-800 text-lg mb-3">Action Items</h4>
                  <ul className="text-sm text-gray-600 space-y-2">
                    {sessionDetails.feedback_summary.action_items?.map((item, i) => (
                      <li key={i} className="flex gap-2 items-start">
                        <span className="text-primary-500 font-bold mt-0.5">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Q&A logs review */}
            {sessionDetails?.feedback_logs?.length > 0 && (
              <div className="mt-8">
                <h3 className="text-xl font-extrabold text-gray-800 mb-4 pl-1">Review Answers</h3>
                <div className="space-y-4">
                  {sessionDetails.feedback_logs.map((log) => (
                    <div key={log.id} className="bg-white rounded-3xl p-5 border border-gray-150 shadow-sm space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-black text-primary-600 uppercase tracking-wide">
                          Question {log.question_number}
                        </span>
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                          Score: {log.confidence_score || 0}
                        </span>
                      </div>
                      <h4 className="font-bold text-gray-800 text-sm leading-snug">{log.question_text}</h4>
                      <div className="bg-gray-50/50 p-3 rounded-2xl border border-gray-100">
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Your Answer</p>
                        <p className="text-sm text-gray-600 italic">"{log.user_answer}"</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => navigate('/dashboard')}
              className="w-full gradient-header text-white font-semibold py-4 rounded-3xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 hover:opacity-90 btn-interactive"
            >
              Back to Dashboard
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
