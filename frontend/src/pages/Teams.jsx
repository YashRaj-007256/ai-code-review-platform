import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Plus, LogIn, Copy, Loader2, Check, Shield, FileText } from 'lucide-react';
import api from '../lib/api';

export default function Teams() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTeamName, setNewTeamName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [selected, setSelected] = useState(null);
  const [members, setMembers] = useState([]);
  const [teamReviews, setTeamReviews] = useState([]);
  const [error, setError] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  const load = () => {
    setLoading(true);
    api.get('/teams').then((res) => setTeams(res.data.teams)).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const createTeam = async (e) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    const res = await api.post('/teams', { name: newTeamName });
    setNewTeamName('');
    setTeams((prev) => [res.data.team, ...prev]);
  };

  const joinTeam = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/teams/join', { inviteCode });
      setInviteCode('');
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to join team');
    }
  };

  const openTeam = async (team) => {
    setSelected(team);
    const [m, r] = await Promise.all([
      api.get(`/teams/${team.id}/members`),
      api.get(`/teams/${team.id}/reviews`),
    ]);
    setMembers(m.data.members);
    setTeamReviews(r.data.reviews);
  };

  const copyInvite = (code) => {
    navigator.clipboard?.writeText(code).catch(() => {});
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      {/* Title */}
      <div className="mb-8">
        <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          Team Workspaces
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Collaborate with your team, share code reviews, and standardize quality
        </p>
      </div>

      {/* Action Forms */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
        <form onSubmit={createTeam} className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
            <Plus size={15} className="text-blue-600" /> Create a New Team
          </p>
          <div className="flex gap-2">
            <input
              value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)}
              placeholder="e.g. Frontend Core Team"
              className="flex-1 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-xl px-5 py-2.5 text-sm shadow-md shadow-blue-500/20 transition-all">
              Create
            </button>
          </div>
        </form>

        <form onSubmit={joinTeam} className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
            <LogIn size={15} className="text-blue-600" /> Join via Invite Code
          </p>
          <div className="flex gap-2">
            <input
              value={inviteCode} onChange={(e) => setInviteCode(e.target.value)}
              placeholder="Enter team invite code..."
              className="flex-1 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
            <button type="submit" className="border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-white font-bold rounded-xl px-5 py-2.5 text-sm transition-colors">
              Join
            </button>
          </div>
          {error && <p className="text-red-500 text-xs mt-2 font-medium">{error}</p>}
        </form>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-blue-600">
          <Loader2 size={28} className="animate-spin" />
        </div>
      ) : teams.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl py-16 text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center mx-auto mb-3">
            <Users size={24} />
          </div>
          <h3 className="font-heading font-bold text-base text-slate-800 dark:text-white mb-1">No Team Workspaces</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto">Create a new team above or ask your teammates for an invite code to join.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Team Selector List */}
          <div className="md:col-span-4 space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Your Teams</label>
            {teams.map((t) => (
              <button
                key={t.id} onClick={() => openTeam(t)}
                className={`w-full text-left border rounded-2xl p-4 transition-all ${
                  selected?.id === t.id
                    ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 shadow-sm'
                    : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="font-heading font-bold text-slate-900 dark:text-white text-base">{t.name}</p>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {t.role}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Selected Team Detail Container */}
          <div className="md:col-span-8">
            {selected ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div>
                    <h2 className="font-heading text-xl font-extrabold text-slate-900 dark:text-white">{selected.name}</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Role: <span className="capitalize font-bold text-slate-700 dark:text-slate-300">{selected.role}</span></p>
                  </div>
                  <button
                    onClick={() => copyInvite(selected.invite_code)}
                    className="flex items-center gap-1.5 text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-white px-3.5 py-2 rounded-xl transition-colors"
                  >
                    {copiedCode ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    <span>{selected.invite_code}</span>
                  </button>
                </div>

                {/* Team Members */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Members ({members.length})</h4>
                  <div className="flex flex-wrap gap-2">
                    {members.map((m) => (
                      <div key={m.id} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 rounded-full px-3.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                        <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
                          {m.name ? m.name[0].toUpperCase() : 'U'}
                        </div>
                        <span>{m.name}</span>
                        <span className="text-[10px] text-slate-400">({m.role})</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Team Shared Reviews */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Shared Reviews ({teamReviews.length})</h4>
                  {teamReviews.length === 0 ? (
                    <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-center text-slate-400 text-sm">
                      No code reviews shared with this team yet.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {teamReviews.map((r) => (
                        <Link
                          key={r.id}
                          to={`/review/${r.id}`}
                          className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-blue-500/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-all"
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <FileText size={16} className="text-blue-600 shrink-0" />
                            <span className="font-semibold text-sm text-slate-800 dark:text-white truncate">{r.title}</span>
                          </div>
                          <div className="flex items-center gap-3 shrink-0 text-xs text-slate-400">
                            <span>{r.author}</span>
                            <span className="font-extrabold text-blue-600 dark:text-blue-400">{r.score != null ? `${r.score}/100` : '—'}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl py-20 text-center text-slate-400 text-sm shadow-sm">
                Select a team workspace from the left list to view details.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

