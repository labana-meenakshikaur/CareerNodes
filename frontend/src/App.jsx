import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

const API_BASE = 'http://localhost:5001/api';

export default function PlacementMentorApp() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(null);
  
  // Navigation & Auth View Switches
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  // Auth Inputs
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authCompany, setAuthCompany] = useState('Google');

  // Interactive AI Module Inputs
  const [doubtInput, setDoubtInput] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  
  // Dynamic Mock Interview State
  const [interviewQuestion, setInterviewQuestion] = useState('');
  const [userAnswer, setUserAnswer] = useState('');
  const [interviewFeedback, setInterviewFeedback] = useState('');
  const [interviewScore, setInterviewScore] = useState(null);
  
  // Custom DSA Topic Input
  const [newTopicName, setNewTopicName] = useState('');

  const [loading, setLoading] = useState(false);
  const [questionLoading, setQuestionLoading] = useState(false);

  // Load User Profile on Auth
  useEffect(() => {
    if (token) {
      fetch(`${API_BASE}/user/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then((res) => {
          if (!res.ok) throw new Error('Session Expired');
          return res.json();
        })
        .then((data) => setUser(data))
        .catch(() => handleLogout());
    }
  }, [token]);

  // Fetch dynamic question when switching to AI Mock Interview tab
  useEffect(() => {
    if (activeTab === 'ai-interview' && token && !interviewQuestion) {
      fetchNewQuestion();
    }
  }, [activeTab, token]);

  const fetchNewQuestion = async () => {
    setQuestionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/ai/generate-question`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.question) {
        setInterviewQuestion(data.question);
        setInterviewFeedback('');
        setInterviewScore(null);
        setUserAnswer('');
      }
    } catch (err) {
      console.error('Failed to fetch AI question:', err);
    } finally {
      setQuestionLoading(false);
    }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    const endpoint = isRegisterMode ? '/auth/register' : '/auth/login';
    const payload = isRegisterMode 
      ? { name: authName, email: authEmail, password: authPassword, targetCompany: authCompany }
      : { email: authEmail, password: authPassword };

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Authentication Failed');

      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
  };

  const handleUpdateDSA = async (topicName, increment) => {
    try {
      const res = await fetch(`${API_BASE}/user/dsa/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ topicName, increment })
      });
      const updatedTopics = await res.json();
      if (res.ok) {
        setUser(prev => ({ ...prev, dsaTopics: updatedTopics }));
      }
    } catch (err) {
      console.error('Failed to update DSA topic', err);
    }
  };

  const handleAddCustomTopic = async (e) => {
    e.preventDefault();
    if (!newTopicName.trim()) return;

    try {
      const res = await fetch(`${API_BASE}/user/dsa/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ topicName: newTopicName, totalCount: 10 })
      });
      const updatedTopics = await res.json();
      if (res.ok) {
        setUser(prev => ({ ...prev, dsaTopics: updatedTopics }));
        setNewTopicName('');
      }
    } catch (err) {
      console.error('Failed to add custom topic', err);
    }
  };

  const handleAskDoubt = async () => {
    if (!doubtInput.trim()) return;
    setLoading(true);
    setAiResponse('');
    try {
      const res = await fetch(`${API_BASE}/ai/ask-doubt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ doubt: doubtInput })
      });
      const data = await res.json();
      setAiResponse(data.reply || data.error);
    } catch (err) {
      setAiResponse('Error requesting AI evaluation.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitInterview = async () => {
    if (!userAnswer.trim()) return;
    setLoading(true);
    setInterviewFeedback('');
    setInterviewScore(null);
    try {
      const res = await fetch(`${API_BASE}/ai/mock-interview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          question: interviewQuestion,
          userAnswer,
          company: user?.targetCompany || 'Google'
        })
      });
      const data = await res.json();
      setInterviewFeedback(data.feedback || data.error);
      if (data.score) setInterviewScore(data.score);
    } catch (err) {
      setInterviewFeedback('Error evaluating mock interview answer.');
    } finally {
      setLoading(false);
    }
  };

  // --- UNAUTHENTICATED UI VIEW ---
  if (!token) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl max-w-md w-full shadow-2xl">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-extrabold text-indigo-400">AI Placement Mentor</h1>
            <p className="text-slate-400 text-sm mt-1">Target your dream roles at D. E. Shaw, Google & tier-1 tech.</p>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {isRegisterMode && (
              <>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={authName}
                  required
                  onChange={(e) => setAuthName(e.target.value)}
                  className="w-full p-3 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                />
                <input
                  type="text"
                  placeholder="Target Company (e.g. Google)"
                  value={authCompany}
                  onChange={(e) => setAuthCompany(e.target.value)}
                  className="w-full p-3 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                />
              </>
            )}

            <input
              type="email"
              placeholder="Email Address"
              value={authEmail}
              required
              onChange={(e) => setAuthEmail(e.target.value)}
              className="w-full p-3 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
            />
            <input
              type="password"
              placeholder="Password"
              value={authPassword}
              required
              onChange={(e) => setAuthPassword(e.target.value)}
              className="w-full p-3 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
            />

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 transition-all text-white font-bold py-3 rounded-lg shadow-lg"
            >
              {isRegisterMode ? 'Create Mentorship Account' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsRegisterMode(!isRegisterMode)}
              className="text-xs text-indigo-400 hover:underline"
            >
              {isRegisterMode ? 'Already have an account? Sign In' : 'New student? Register here'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- AUTHENTICATED DASHBOARD VIEW ---
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="bg-slate-900 border-b border-slate-800 p-4 px-8 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <span className="text-xl font-black tracking-wider text-indigo-400">PLACEMENT.AI</span>
          <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
            🔥 {user?.streakCount || 1} Day Streak
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-slate-300">Welcome, <strong>{user?.name}</strong></span>
          <button
            onClick={handleLogout}
            className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 px-3 py-1.5 rounded-lg text-xs font-semibold"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Navigation Sidebar */}
        <nav className="w-64 bg-slate-900/60 border-r border-slate-800 p-4 space-y-2">
          {[
            { id: 'dashboard', label: 'Dashboard' },
            { id: 'dsa', label: 'DSA & Topic Checklist' },
            { id: 'ai-interview', label: 'AI Mock Interview' },
            { id: 'ai-doubt', label: 'AI Technical Assistant' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Main Dashboard Panel */}
        <main className="flex-1 p-8 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <div className="space-y-6 max-w-5xl">
              <h2 className="text-2xl font-bold">Preparation Dashboard</h2>

              {/* Stats Cards */}
              <div className="grid grid-cols-3 gap-6">
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Target Company</p>
                  <p className="text-2xl font-bold text-indigo-400">{user?.targetCompany}</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Active Streak</p>
                  <p className="text-2xl font-bold text-amber-400">{user?.streakCount} Days</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Weekly Goals</p>
                  <p className="text-2xl font-bold text-emerald-400">
                    {user?.weeklyGoals?.filter((g) => g.isCompleted).length} / {user?.weeklyGoals?.length || 0}
                  </p>
                </div>
              </div>

              {/* Company Specific Preparation Roadmap */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4">
                <h3 className="text-lg font-bold text-slate-200">{user?.targetCompany} Interview Roadmap</h3>
                <div className="space-y-3">
                  {user?.companyRoadmap?.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-slate-800/40 border border-slate-700/50 p-3 rounded-lg">
                      <span className="text-sm font-medium">{item.stepTitle}</span>
                      <span className="text-xs px-2.5 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-md font-mono">
                        {item.category}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Skill Proficiency Tracker */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4">
                <h3 className="text-lg font-bold text-slate-200">Skill Proficiency Breakdown</h3>
                {user?.skills?.map((skill) => (
                  <div key={skill.name} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-300">{skill.name}</span>
                      <span className="text-slate-400 font-mono">{skill.proficiency}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-indigo-500 h-full rounded-full transition-all duration-500" style={{ width: `${skill.proficiency}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* DSA Topic Checklist */}
          {activeTab === 'dsa' && (
            <div className="space-y-6 max-w-4xl">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Data Structures & Algorithms Tracker</h2>
              </div>

              {/* Add Custom Topic Input */}
              <form onSubmit={handleAddCustomTopic} className="flex gap-3 bg-slate-900 border border-slate-800 p-4 rounded-xl">
                <input
                  type="text"
                  placeholder="Add custom topic (e.g., Trie & Segment Trees)..."
                  value={newTopicName}
                  onChange={(e) => setNewTopicName(e.target.value)}
                  className="flex-1 bg-slate-800 border border-slate-700 px-4 py-2 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-lg font-bold text-sm transition-all"
                >
                  + Add Topic
                </button>
              </form>

              <div className="grid gap-4">
                {user?.dsaTopics?.map((topic) => (
                  <div key={topic.topicName} className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-base text-slate-200">{topic.topicName}</h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Solved: <span className="font-mono text-indigo-400">{topic.solvedCount}</span> / {topic.totalCount} problems
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleUpdateDSA(topic.topicName, -1)}
                        className="bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded text-sm font-bold border border-slate-700"
                      >
                        -
                      </button>
                      <button
                        onClick={() => handleUpdateDSA(topic.topicName, 1)}
                        className="bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded text-sm font-bold border border-slate-700"
                      >
                        +
                      </button>
                      <span className={`text-xs px-3 py-1 rounded-full border ${
                        topic.isMastered ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {topic.isMastered ? 'Mastered' : 'In Progress'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Mock Interview Module */}
          {activeTab === 'ai-interview' && (
            <div className="space-y-6 max-w-3xl">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">AI Technical Interview</h2>
                <button
                  onClick={fetchNewQuestion}
                  disabled={questionLoading}
                  className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-indigo-400 text-xs px-4 py-2 rounded-lg font-semibold transition-all disabled:opacity-50"
                >
                  {questionLoading ? 'Generating...' : '🔄 Generate New Question'}
                </button>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4">
                <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                  Target Role: {user?.targetCompany} Technical Assessment
                </span>
                
                {questionLoading ? (
                  <p className="text-slate-400 text-sm animate-pulse">Generating tailored question from AI...</p>
                ) : (
                  <p className="text-base font-semibold text-slate-200">{interviewQuestion || 'Click "Generate New Question" to begin.'}</p>
                )}

                <textarea
                  rows="6"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Type your explanation, Big-O analysis, and pseudo code here..."
                  className="w-full p-4 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 font-mono"
                ></textarea>

                <button
                  onClick={handleSubmitInterview}
                  disabled={loading || !interviewQuestion}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-lg font-bold text-sm disabled:opacity-50 transition-all"
                >
                  {loading ? 'Evaluating Response...' : 'Submit Response'}
                </button>
              </div>

              {interviewFeedback && (
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold text-emerald-400">Interviewer Feedback</h3>
                    {interviewScore && (
                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-bold">
                        Score: {interviewScore} / 10
                      </span>
                    )}
                  </div>
                  <div className="text-slate-300 text-sm leading-relaxed prose prose-invert max-w-none">
                    <ReactMarkdown>{interviewFeedback}</ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* AI Technical Assistant */}
          {activeTab === 'ai-doubt' && (
            <div className="space-y-6 max-w-3xl">
              <h2 className="text-2xl font-bold">AI Technical Doubt Assistant</h2>
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4">
                <textarea
                  rows="4"
                  value={doubtInput}
                  onChange={(e) => setDoubtInput(e.target.value)}
                  placeholder="Ask any core CS concept or coding doubt (e.g., Explain Garbage Collection vs ARC memory management)..."
                  className="w-full p-4 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
                ></textarea>
                <button
                  onClick={handleAskDoubt}
                  disabled={loading}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-lg font-bold text-sm disabled:opacity-50 transition-all"
                >
                  {loading ? 'Analyzing Query...' : 'Ask Assistant'}
                </button>
              </div>

              {aiResponse && (
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-3">
                  <h3 className="text-lg font-bold text-indigo-400">Explanation & Insights</h3>
                  <div className="text-slate-300 text-sm leading-relaxed prose prose-invert max-w-none">
                    <ReactMarkdown>{aiResponse}</ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}