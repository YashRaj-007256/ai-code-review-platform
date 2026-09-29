import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { DiffEditor } from '@monaco-editor/react';
import { Loader2, Zap, Calendar, ShieldCheck, ArrowRightLeft, Copy, Check } from 'lucide-react';
import axios from 'axios';
import ScoreGauge from '../components/ScoreGauge';
import { useTheme } from '../context/ThemeContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function SharedReview() {
  const { shareId } = useParams();
  const { darkMode } = useTheme();
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [codeTab, setCodeTab] = useState('original'); // 'original' | 'fixed' | 'diff'
  const [copiedFix, setCopiedFix] = useState(false);

  useEffect(() => {
    axios.get(`${API_URL}/reviews/share/${shareId}`)
      .then((res) => setReview(res.data.review))
      .catch(() => setError('This shared review does not exist or is no longer public.'))
      .finally(() => setLoading(false));
  }, [shareId]);

  const copyFixedCode = () => {
    if (!review?.fixed_code) return;
    navigator.clipboard?.writeText(review.fixed_code).catch(() => {});
    setCopiedFix(true);
    setTimeout(() => setCopiedFix(false), 3000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-blue-600">
        <Loader2 size={32} className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      {/* Brand Header */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <Link to="/" className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/30">
            <Zap size={18} fill="currentColor" />
          </div>
          <span>Code<span className="text-blue-600 dark:text-blue-400">Lens</span></span>
        </Link>
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
          Public Shared Review
        </span>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-sm font-semibold rounded-2xl p-6 text-center">
          {error}
        </div>
      )}

      {review && (
        <>
          {/* Header Info Banner */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xl mb-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <ScoreGauge score={review.score} />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-mono">
                    {review.language}
                  </span>
                  <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                    <Calendar size={13} /> {new Date(review.created_at).toLocaleString()}
                  </span>
                </div>
                <h1 className="font-heading text-2xl font-extrabold text-slate-900 dark:text-white">{review.title}</h1>
              </div>
            </div>
          </div>

          {/* Submitted Code Block & Diff */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xl mb-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">Code Workspace</span>
                <span className="text-xs font-mono text-slate-500">{review.language}</span>
              </div>

              <div className="flex items-center gap-2">
                {review.fixed_code && (
                  <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
                    <button
                      onClick={() => setCodeTab('original')}
                      className={`px-3 py-1 rounded-lg transition-colors ${
                        codeTab === 'original'
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      Original Code
                    </button>
                    <button
                      onClick={() => setCodeTab('fixed')}
                      className={`px-3 py-1 rounded-lg transition-colors flex items-center gap-1 ${
                        codeTab === 'fixed'
                          ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      <ShieldCheck size={14} /> AI Fixed Code
                    </button>
                    <button
                      onClick={() => setCodeTab('diff')}
                      className={`px-3 py-1 rounded-lg transition-colors flex items-center gap-1 ${
                        codeTab === 'diff'
                          ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      <ArrowRightLeft size={13} /> Side-by-Side Diff
                    </button>
                  </div>
                )}

                {review.fixed_code && (
                  <button
                    onClick={copyFixedCode}
                    className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg px-3 py-1.5 transition-colors"
                  >
                    {copiedFix ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                    {copiedFix ? 'Copied' : 'Copy Fixed'}
                  </button>
                )}
              </div>
            </div>

            {codeTab === 'diff' && review.fixed_code ? (
              <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                <DiffEditor
                  height="400px"
                  language={review.language === 'cpp' ? 'cpp' : review.language}
                  theme={darkMode ? 'vs-dark' : 'light'}
                  original={review.code}
                  modified={review.fixed_code}
                  options={{
                    fontSize: 13,
                    fontFamily: 'JetBrains Mono, monospace',
                    minimap: { enabled: false },
                    readOnly: true,
                    renderSideBySide: true,
                  }}
                />
              </div>
            ) : codeTab === 'fixed' && review.fixed_code ? (
              <pre className="overflow-x-auto text-xs sm:text-sm font-mono text-emerald-400 leading-relaxed p-4 bg-slate-900 rounded-xl border border-slate-800">
                {review.fixed_code}
              </pre>
            ) : (
              <pre className="overflow-x-auto text-xs sm:text-sm font-mono text-slate-800 dark:text-slate-200 leading-relaxed p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200/60 dark:border-slate-800">
                {review.code}
              </pre>
            )}
          </div>

          {/* AI Markdown Review Output */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-8 shadow-xl markdown-body">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{review.review_markdown}</ReactMarkdown>
          </div>
        </>
      )}
    </div>
  );
}

