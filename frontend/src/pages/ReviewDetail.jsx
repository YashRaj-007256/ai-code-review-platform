import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { DiffEditor } from '@monaco-editor/react';
import { Download, Share2, Loader2, Calendar, ArrowLeft, Check, ShieldCheck, ArrowRightLeft, Copy, Edit3 } from 'lucide-react';
import api from '../lib/api';
import ScoreGauge from '../components/ScoreGauge';
import { useTheme } from '../context/ThemeContext';

export default function ReviewDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [codeTab, setCodeTab] = useState('original'); // 'original' | 'fixed' | 'diff'
  const [copiedFix, setCopiedFix] = useState(false);

  useEffect(() => {
    api.get(`/reviews/${id}`).then((res) => setReview(res.data.review)).finally(() => setLoading(false));
  }, [id]);

  const downloadReport = async () => {
    const res = await api.get(`/reviews/${id}/download`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement('a');
    a.href = url;
    a.download = `review-${id}.md`;
    a.click();
  };

  const shareReview = async () => {
    const res = await api.post(`/reviews/${id}/share`);
    const url = `${window.location.origin}/share/${res.data.shareId}`;
    setShareUrl(url);
    setCopied(true);
    navigator.clipboard?.writeText(url).catch(() => {});
    setTimeout(() => setCopied(false), 3000);
  };

  const copyFixedCode = () => {
    if (!review?.fixed_code) return;
    navigator.clipboard?.writeText(review.fixed_code).catch(() => {});
    setCopiedFix(true);
    setTimeout(() => setCopiedFix(false), 3000);
  };

  const handleOpenInEditor = () => {
    if (!review) return;
    localStorage.setItem('codelens_draft_code', review.code || '');
    localStorage.setItem('codelens_draft_language', review.language || 'javascript');
    localStorage.setItem('codelens_draft_title', review.title || 'Untitled Review');
    localStorage.setItem('codelens_draft_review', JSON.stringify(review));
    navigate('/');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-blue-600">
        <Loader2 size={32} className="animate-spin" />
      </div>
    );
  }

  if (!review) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-20 text-center">
        <h2 className="font-heading font-bold text-xl text-slate-800 dark:text-white mb-2">Review Not Found</h2>
        <Link to="/history" className="text-blue-600 hover:underline text-sm font-semibold">← Return to History</Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <Link to="/history" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 mb-6 transition-colors">
        <ArrowLeft size={14} /> Back to History
      </Link>

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

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            onClick={handleOpenInEditor}
            className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 text-blue-600 dark:text-blue-400 font-bold text-xs rounded-full px-4 py-2.5 border border-blue-200 dark:border-blue-800 transition-colors"
          >
            <Edit3 size={14} /> Open in Editor
          </button>
          <button
            onClick={shareReview}
            className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-white font-bold text-xs rounded-full px-4 py-2.5 transition-colors"
          >
            {copied ? <Check size={14} className="text-emerald-500" /> : <Share2 size={14} />}
            {copied ? 'Link Copied' : 'Share'}
          </button>
          <button
            onClick={downloadReport}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-full px-4 py-2.5 shadow-md shadow-blue-500/20 transition-all"
          >
            <Download size={14} /> Download
          </button>
        </div>
      </div>

      {/* Code Block & Diff View */}
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
    </div>
  );
}

