import { useState, useEffect, useRef } from 'react';
import Editor, { DiffEditor } from '@monaco-editor/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Play, Download, Share2, Loader2, Sparkles, ChevronRight, CheckCircle2, ShieldCheck, Code2, Star, Zap, Cpu, HelpCircle, ChevronDown, Info, Wand2, ArrowRightLeft, Copy, Check } from 'lucide-react';
import api from '../lib/api';
import { LANGUAGES } from '../lib/languages';
import { detectLanguage } from '../lib/languageDetector';
import ScoreGauge from '../components/ScoreGauge';
import { useTheme } from '../context/ThemeContext';

const DEFAULT_CODE = `// Paste or write your code here for instant AI review\nfunction calculateDiscount(user, items) {\n  let total = 0;\n  for (let i = 0; i < items.length; i++) {\n    total += items[i].price * items[i].quantity;\n  }\n  \n  if (user.isVip == true) {\n    total = total - (total * 0.20);\n  } else if (items.length > 5) {\n    total = total - (total * 0.10);\n  }\n  \n  return total;\n}`;

export default function Dashboard() {
  const { darkMode } = useTheme();
  const [language, setLanguage] = useState(() => localStorage.getItem('codelens_draft_language') || 'javascript');
  const [isAutoDetected, setIsAutoDetected] = useState(false);
  const [manualOverride, setManualOverride] = useState(false);
  const [autoBadge, setAutoBadge] = useState('');
  const [viewMode, setViewMode] = useState('editor'); // 'editor' | 'diff'
  const [fixApplied, setFixApplied] = useState(false);
  const [copiedFix, setCopiedFix] = useState(false);
  const editorRef = useRef(null);

  const [code, setCode] = useState(() => {
    const saved = localStorage.getItem('codelens_draft_code');
    return saved !== null ? saved : DEFAULT_CODE;
  });
  const [title, setTitle] = useState(() => localStorage.getItem('codelens_draft_title') || 'Checkout Refactor Review');
  const [review, setReview] = useState(() => {
    try {
      const saved = localStorage.getItem('codelens_draft_review');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [teams, setTeams] = useState([]);
  const [teamId, setTeamId] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  useEffect(() => {
    api.get('/teams').then((res) => setTeams(res.data.teams)).catch(() => {});
  }, []);

  // Persist draft workspace state in localStorage so code is preserved across page navigation
  useEffect(() => {
    if (code !== undefined && code !== null) {
      localStorage.setItem('codelens_draft_code', code);
    }
  }, [code]);

  useEffect(() => {
    if (language) {
      localStorage.setItem('codelens_draft_language', language);
    }
  }, [language]);

  useEffect(() => {
    if (title) {
      localStorage.setItem('codelens_draft_title', title);
    }
  }, [title]);

  useEffect(() => {
    if (review) {
      localStorage.setItem('codelens_draft_review', JSON.stringify(review));
    }
  }, [review]);

  const runAutoDetect = (codeSnippet, force = false) => {
    if (!codeSnippet || !codeSnippet.trim()) return;
    if (manualOverride && !force) return;

    const res = detectLanguage(codeSnippet);
    if (res.language && (res.language !== language || force)) {
      setLanguage(res.language);
      setIsAutoDetected(true);
      const label = LANGUAGES.find((l) => l.id === res.language)?.label || res.language;
      setAutoBadge(`Auto-detected: ${label}`);
    }
  };

  const handleCodeChange = (newCode) => {
    const val = newCode || '';
    setCode(val);

    // Auto detect if user pastes or types code and hasn't manually locked language
    if (!manualOverride) {
      runAutoDetect(val);
    }
  };

  const handleLanguageSelect = (newLang) => {
    setLanguage(newLang);
    setManualOverride(true);
    setIsAutoDetected(false);
    setAutoBadge('');
  };

  const handleManualAutoDetect = () => {
    setManualOverride(false);
    const res = detectLanguage(code);
    if (res.language) {
      setLanguage(res.language);
      setIsAutoDetected(true);
      const label = LANGUAGES.find((l) => l.id === res.language)?.label || res.language;
      setAutoBadge(`Auto-detected: ${label}`);
    } else {
      setAutoBadge('Could not detect language');
      setTimeout(() => setAutoBadge(''), 3000);
    }
  };

  const handleEditorMount = (editor) => {
    editorRef.current = editor;
    editor.onDidPaste(() => {
      setTimeout(() => {
        const val = editor.getValue();
        runAutoDetect(val, true);
      }, 50);
    });
  };

  const handleApplyFix = (customFixedCode) => {
    const targetCode = customFixedCode || review?.fixed_code;
    if (!targetCode) return;
    setCode(targetCode);
    setFixApplied(true);
    setViewMode('editor');
    setTimeout(() => setFixApplied(false), 4000);
  };

  const handleCopyFixedCode = (customFixedCode) => {
    const targetCode = customFixedCode || review?.fixed_code;
    if (!targetCode) return;
    navigator.clipboard?.writeText(targetCode).catch(() => {});
    setCopiedFix(true);
    setTimeout(() => setCopiedFix(false), 3000);
  };

  const runReview = async () => {
    setLoading(true);
    setError('');
    setReview(null);
    setShareUrl('');
    try {
      const res = await api.post('/reviews', {
        title, language, code, teamId: teamId || null,
      });
      setReview(res.data.review);

      // Scroll smoothly down to workbench output
      const workbench = document.getElementById('workbench');
      if (workbench) {
        workbench.scrollIntoView({ behavior: 'smooth' });
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Review failed');
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async () => {
    if (!review) return;
    const res = await api.get(`/reviews/${review.id}/download`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement('a');
    a.href = url;
    a.download = `review-${review.id}.md`;
    a.click();
  };

  const shareReview = async () => {
    if (!review) return;
    const res = await api.post(`/reviews/${review.id}/share`);
    const url = `${window.location.origin}/share/${res.data.shareId}`;
    setShareUrl(url);
    setCopied(true);
    navigator.clipboard?.writeText(url).catch(() => {});
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="min-h-screen pb-16">
      {/* HERO SECTION - Sleek Centered Header */}
      <section className="relative overflow-hidden pt-10 pb-12 px-4 sm:px-6 max-w-4xl mx-auto text-center">
        <div className="z-10 flex flex-col items-center">
          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.12] mb-5">
            Master <span className="text-blue-600 dark:text-blue-500">Code Review</span> <br className="hidden sm:inline" />
            Through Interactive AI
          </h1>

          {/* Subtext */}
          <p className="text-slate-700 dark:text-slate-200 text-base sm:text-lg leading-relaxed mb-8 max-w-2xl font-medium">
            See security vulnerabilities, performance bottlenecks, and refactoring suggestions come to life before you deploy. The way senior engineers actually think.
          </p>

          {/* CTA Button */}
          <div>
            <a
              href="#workbench"
              className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-base rounded-full px-9 py-4 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all gap-2"
            >
              Start Reviewing Now
            </a>
          </div>
        </div>
      </section>

      {/* WORKBENCH SECTION */}
      <section id="workbench" className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        
        {/* Workbench Control Bar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 mb-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex-1 min-w-[240px]">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Review Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter code review title..."
              className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Language</label>
                {autoBadge && (
                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/80 px-2 py-0.5 rounded-md animate-pulse">
                    {autoBadge}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <select
                  value={language}
                  onChange={(e) => handleLanguageSelect(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl px-3.5 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.id} value={l.id}>{l.label}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleManualAutoDetect}
                  title="Auto-detect language from code"
                  className="bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/60 hover:text-blue-600 dark:hover:text-blue-400 text-slate-600 dark:text-slate-300 p-2 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors text-xs font-semibold flex items-center gap-1 shrink-0"
                >
                  <Wand2 size={15} />
                  <span className="hidden sm:inline">Auto Detect</span>
                </button>
              </div>
            </div>

            {teams.length > 0 && (
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Team Workspace</label>
                <select
                  value={teamId}
                  onChange={(e) => setTeamId(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl px-3.5 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer"
                >
                  <option value="">Personal (no team)</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="self-end">
              <button
                onClick={runReview}
                disabled={loading || !code.trim()}
                className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm rounded-xl px-6 py-2.5 shadow-md shadow-blue-500/25 transition-all flex items-center gap-2 disabled:opacity-50 hover:shadow-lg"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} fill="currentColor" />}
                {loading ? 'Analyzing Code…' : 'Run AI Review'}
              </button>
            </div>
          </div>
        </div>

        {/* Editor & Review Panels Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Left Monaco Code Editor / Diff Window */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-xl flex flex-col">
            {/* Window Top Controls Bar */}
            <div className="flex items-center justify-between px-4 py-3 bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                <span className="text-xs font-mono text-slate-600 dark:text-slate-400 ml-2 flex items-center gap-1.5">
                  editor.{language}
                  {isAutoDetected && (
                    <span className="text-[11px] text-blue-600 dark:text-blue-400 font-sans font-semibold bg-blue-50 dark:bg-blue-950/80 px-1.5 py-0.5 rounded">
                      Auto-detected
                    </span>
                  )}
                </span>
              </div>

              {/* View Mode Toggle & Apply Fix Action */}
              <div className="flex items-center gap-2">
                {review?.fixed_code && (
                  <div className="flex items-center bg-slate-200 dark:bg-slate-800 p-0.5 rounded-lg text-xs font-semibold">
                    <button
                      onClick={() => setViewMode('editor')}
                      className={`px-2.5 py-1 rounded-md transition-colors ${
                        viewMode === 'editor'
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      Editor
                    </button>
                    <button
                      onClick={() => setViewMode('diff')}
                      className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
                        viewMode === 'diff'
                          ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      <ArrowRightLeft size={13} /> Original vs Fixed Diff
                    </button>
                  </div>
                )}

                {review?.fixed_code && (
                  <button
                    onClick={() => handleApplyFix()}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg px-3 py-1 flex items-center gap-1 shadow-md shadow-emerald-500/20 transition-all"
                    title="Apply AI fixed code to editor"
                  >
                    <Zap size={13} fill="currentColor" /> Apply Fix
                  </button>
                )}
                <span className="text-xs font-mono text-slate-500">{code.length} chars</span>
              </div>
            </div>

            {/* Notification Banner when Fix Applied */}
            {fixApplied && (
              <div className="bg-emerald-500/15 border-b border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs px-4 py-2 font-bold flex items-center justify-between transition-all">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={15} className="text-emerald-500" />
                  AI Fixed code successfully applied to editor!
                </span>
                <span className="text-[10px] font-normal text-emerald-600 dark:text-emerald-400">Ready to run AI Review</span>
              </div>
            )}

            {/* Monaco Editor / Diff Editor Container */}
            <div className="flex-1 min-h-[520px]">
              {viewMode === 'diff' && review?.fixed_code ? (
                <DiffEditor
                  height="520px"
                  language={language === 'cpp' ? 'cpp' : language}
                  theme={darkMode ? 'vs-dark' : 'light'}
                  original={review.code || code}
                  modified={review.fixed_code}
                  options={{
                    fontSize: 13.5,
                    fontFamily: 'JetBrains Mono, monospace',
                    minimap: { enabled: false },
                    padding: { top: 16 },
                    readOnly: true,
                    renderSideBySide: true,
                    automaticLayout: true,
                  }}
                />
              ) : (
                <Editor
                  height="520px"
                  language={language === 'cpp' ? 'cpp' : language}
                  theme={darkMode ? 'vs-dark' : 'light'}
                  value={code}
                  onMount={handleEditorMount}
                  onChange={(v) => handleCodeChange(v || '')}
                  options={{
                    fontSize: 13.5,
                    fontFamily: 'JetBrains Mono, monospace',
                    minimap: { enabled: false },
                    padding: { top: 16 },
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                  }}
                />
              )}
            </div>
          </div>

          {/* Right AI Review Results Window */}
          <div className="border border-slate-200/80 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-xl flex flex-col min-h-[560px] overflow-hidden">
            {/* Header Toolbar */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Sparkles size={16} className="text-blue-600" />
                AI Analysis Report
              </span>

              {review && (
                <div className="flex items-center gap-2">
                  {shareUrl && copied && (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold animate-pulse">
                      Link copied!
                    </span>
                  )}
                  <button
                    onClick={shareReview}
                    title="Copy share link"
                    className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    <Share2 size={14} /> Share
                  </button>
                  <button
                    onClick={downloadReport}
                    title="Download Markdown Report"
                    className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                  >
                    <Download size={14} /> Download
                  </button>
                </div>
              )}
            </div>

            {/* Content Area */}
            <div className="flex-1 p-6 overflow-y-auto max-h-[520px]">
              {!review && !loading && !error && (
                <div className="h-full flex flex-col items-center justify-center text-center py-16 px-4">
                  <div className="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4">
                    <Sparkles size={28} />
                  </div>
                  <h3 className="font-heading font-bold text-lg text-slate-800 dark:text-white mb-1">
                    Ready to Review Your Code
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mb-6">
                    Paste your code in the editor and click <strong className="text-blue-600">Run AI Review</strong> to receive scores, security alerts, and suggestions.
                  </p>
                  <button
                    onClick={runReview}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-full px-5 py-2.5 shadow-md shadow-blue-500/20 transition-all"
                  >
                    Try Sample Review
                  </button>
                </div>
              )}

              {loading && (
                <div className="h-full flex flex-col items-center justify-center text-center py-16">
                  <Loader2 size={36} className="animate-spin text-blue-600 mb-4" />
                  <h3 className="font-heading font-bold text-base text-slate-800 dark:text-white mb-1">
                    Analyzing code structure…
                  </h3>
                  <p className="text-slate-400 text-xs font-mono">evaluating performance, security, and generating fixed code</p>
                </div>
              )}

              {error && (
                <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm rounded-xl p-4">
                  <p className="font-semibold mb-1">Review Failure</p>
                  <p>{error}</p>
                </div>
              )}

              {review && (
                <div className="space-y-6">
                  {/* Top Score Banner */}
                  <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex-wrap">
                    <div className="flex items-center gap-4">
                      <ScoreGauge score={review.score} />
                      <div>
                        <span className="text-xs uppercase tracking-wider font-bold text-blue-600 dark:text-blue-400">Analysis Complete</span>
                        <h2 className="font-heading text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">{review.title}</h2>
                        <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-1">
                          Language: <span className="uppercase text-slate-700 dark:text-slate-300 font-bold">{review.language}</span>
                        </p>
                      </div>
                    </div>

                    {review.fixed_code && (
                      <button
                        onClick={() => handleApplyFix()}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl px-4 py-2.5 shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5 shrink-0"
                      >
                        <Zap size={15} fill="currentColor" /> Apply Fix to Editor
                      </button>
                    )}
                  </div>

                  {/* AI Refactored Fixed Code Banner */}
                  {review.fixed_code && (
                    <div className="border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl p-4 shadow-sm">
                      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                        <div>
                          <h4 className="font-heading font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                            <ShieldCheck size={18} className="text-emerald-600 dark:text-emerald-400" />
                            AI Refactored & Fixed Code
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                            Vulnerabilities and bugs resolved. Click Apply Fix to load into your editor.
                          </p>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={() => {
                              setViewMode('diff');
                              const workbench = document.getElementById('workbench');
                              if (workbench) workbench.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className="flex items-center gap-1 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-lg px-3 py-1.5 transition-colors"
                          >
                            <ArrowRightLeft size={13} /> View Diff
                          </button>
                          <button
                            onClick={() => handleCopyFixedCode()}
                            className="flex items-center gap-1 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-lg px-3 py-1.5 transition-colors"
                          >
                            {copiedFix ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                            {copiedFix ? 'Copied' : 'Copy'}
                          </button>
                          <button
                            onClick={() => handleApplyFix()}
                            className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg px-3.5 py-1.5 shadow-sm shadow-emerald-500/20 transition-all"
                          >
                            <Zap size={13} fill="currentColor" /> Apply Fix
                          </button>
                        </div>
                      </div>

                      <div className="bg-slate-900 rounded-lg p-3 overflow-x-auto border border-slate-800 max-h-[300px]">
                        <pre className="text-xs font-mono text-emerald-400 whitespace-pre leading-relaxed">
                          {review.fixed_code}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Formatted Markdown Output */}
                  <div className="markdown-body">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {review.review_markdown}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </section>

      {/* ABOUT THE PLATFORM SECTION - Matching Reference Image */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-20 pb-12 text-center">
        <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-3">
          <Info size={15} /> About The Platform
        </div>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-6">
          Revolutionizing <span className="text-blue-600 dark:text-blue-500">AI Code Reviews</span>
        </h2>
        <p className="text-slate-600 dark:text-slate-300 text-base sm:text-lg leading-relaxed max-w-3xl mx-auto font-medium">
          CodeLens was created to bridge the gap between static code writing and deep architectural understanding. We believe that receiving instant, senior-engineer level feedback is the key to mastering code quality and security. Whether you're a student preparing for interviews, a developer honing your skills, or a team aiming for standardized code excellence, our platform makes reviewing code engaging, accurate, and effective through interactive AI analysis.
        </p>
      </section>

      {/* FREQUENTLY ASKED QUESTIONS SECTION - Matching Reference Image */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-20 pb-12">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2">
            <HelpCircle size={15} /> Need Help?
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-3">
            Frequently <span className="text-blue-600 dark:text-blue-500">Asked Questions</span>
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
            Quick answers to common questions about our platform
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-3.5 max-w-3xl mx-auto">
          {FAQS.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={index}
                className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full flex items-center justify-between p-5 text-left font-bold text-slate-900 dark:text-white text-base hover:text-blue-600 dark:hover:text-blue-400 transition-colors focus:outline-none"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-blue-600 dark:text-blue-400 font-extrabold">{faq.qNum}.</span>
                    <span>{faq.question}</span>
                  </span>
                  <ChevronDown
                    size={18}
                    className={`text-blue-600 dark:text-blue-400 shrink-0 transition-transform duration-300 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800/80 mt-1 font-medium">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200/80 dark:border-slate-800 mt-16 pt-8 pb-6 text-center text-xs text-slate-500 dark:text-slate-400 font-medium">
        <p>© 2026 CodeLens AI Code Review Platform. All rights reserved.</p>
      </footer>
    </div>
  );
}

const FAQS = [
  {
    qNum: 'Q1',
    question: 'What is CodeLens AI Code Review?',
    answer: 'CodeLens is an AI-powered code analysis platform that provides instant feedback on code quality, security vulnerabilities, performance bottlenecks, and best practice refactoring across 14 programming languages.',
  },
  {
    qNum: 'Q2',
    question: 'Is this tool suitable for beginners?',
    answer: 'Yes! Whether you are a beginner learning to code or a senior engineer optimizing performance, CodeLens gives clear, actionable suggestions with formatted code snippets to help you improve.',
  },
  {
    qNum: 'Q3',
    question: 'Can I use this to prepare for coding interviews?',
    answer: 'Absolutely! You can paste algorithm code (DSA) or system logic to see time/space complexity analysis, edge cases, and cleaner refactored solutions.',
  },
  {
    qNum: 'Q4',
    question: 'Can I use CodeLens with my team?',
    answer: 'Yes! You can create team workspaces, invite team members using invite codes, share code reviews directly with your workspace, or create public read-only links.',
  },
  {
    qNum: 'Q5',
    question: 'Can I download or export review reports?',
    answer: 'Every review report can be exported and downloaded as a formatted Markdown (.md) report with a single click.',
  },
];


