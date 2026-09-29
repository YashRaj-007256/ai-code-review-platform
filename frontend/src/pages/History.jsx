import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, FileCode, Loader2, Search, Calendar, Code, ChevronRight } from 'lucide-react';
import api from '../lib/api';

export default function History() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  const load = () => {
    setLoading(true);
    api.get('/reviews').then((res) => setReviews(res.data.reviews)).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const remove = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    await api.delete(`/reviews/${id}`);
    setReviews((prev) => prev.filter((r) => r.id !== id));
  };

  const filtered = reviews.filter((r) => 
    r.title.toLowerCase().includes(query.toLowerCase()) || 
    r.language.toLowerCase().includes(query.toLowerCase())
  );

  const getScoreBadge = (s) => {
    if (s == null) return <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 px-3 py-1 rounded-full text-xs font-bold">Unrated</span>;
    if (s >= 80) return <span className="bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 px-3 py-1 rounded-full text-xs font-extrabold">{s}/100</span>;
    if (s >= 50) return <span className="bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 px-3 py-1 rounded-full text-xs font-extrabold">{s}/100</span>;
    return <span className="bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 px-3 py-1 rounded-full text-xs font-extrabold">{s}/100</span>;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      {/* Page Title & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Review History
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Browse and manage all code reviews you've previously run
          </p>
        </div>

        <div className="relative min-w-[240px]">
          <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title or language..."
            className="w-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm font-medium text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm"
          />
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20 text-blue-600">
          <Loader2 size={28} className="animate-spin" />
        </div>
      )}

      {!loading && reviews.length === 0 && (
        <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl py-16 text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center mx-auto mb-3">
            <FileCode size={24} />
          </div>
          <h3 className="font-heading font-bold text-base text-slate-800 dark:text-white mb-1">No code reviews yet</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">Paste code in the editor to start your first AI review.</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-full px-5 py-2.5 shadow-md shadow-blue-500/20 transition-all"
          >
            Run First Review <ChevronRight size={14} />
          </Link>
        </div>
      )}

      {!loading && reviews.length > 0 && filtered.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          No reviews match your search query "{query}".
        </div>
      )}

      {/* Review Items Grid */}
      <div className="space-y-3">
        {filtered.map((r) => (
          <Link
            key={r.id}
            to={`/review/${r.id}`}
            className="flex flex-col sm:flex-row sm:items-center justify-between bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:px-6 hover:border-blue-500/50 hover:shadow-md transition-all group gap-3"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 mb-1">
                <span className="text-xs font-extrabold uppercase px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                  {r.language}
                </span>
                <h3 className="font-heading font-bold text-slate-900 dark:text-white text-base truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {r.title}
                </h3>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <Calendar size={13} /> {new Date(r.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-slate-800">
              {getScoreBadge(r.score)}
              <button
                onClick={(e) => remove(r.id, e)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                title="Delete review"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

