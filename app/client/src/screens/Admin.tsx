import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAsyncData, useMutation } from '../hooks/useAsyncData';
import { Screen } from '../components/Shell';
import { Button, Input, Section } from '../components/ui';
import { ErrorState, LoadingRows } from '../components/states';
import './admin.css';

interface AdminUser {
  id: number;
  email: string;
  name: string | null;
  createdAt: string;
  status: 'active' | 'suspended';
  plan: 'free' | 'plus';
  planStatus: string;
  lastActiveAt: string | null;
  onboarded: boolean;
  isAdmin: boolean;
}

interface Stats {
  totalUsers: number;
  onboardedUsers: number;
  activeLast7Days: number;
  paidUsers: number;
  suspendedUsers: number;
}

function shortDate(value: string | null) {
  if (!value) return '—';
  return value.slice(0, 10);
}

export default function Admin() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const mutation = useMutation();

  const stats = useAsyncData<Stats>(() => api.get<Stats>('/admin/stats'), []);
  const users = useAsyncData<{ total: number; users: AdminUser[] }>(
    () => api.get(`/admin/users?limit=100${search ? `&q=${encodeURIComponent(search)}` : ''}`),
    [search]
  );

  // The server answers 404 for non-admins, so a failed load here means
  // "not an admin" as often as it means a real error.
  const forbidden = users.error?.includes('not_found');
  if (forbidden) return <Navigate to="/today" replace />;

  async function setStatus(user: AdminUser, status: 'active' | 'suspended') {
    const ok = await mutation.run(() => api.patch(`/admin/users/${user.id}/status`, { status }));
    if (ok) {
      users.reload();
      stats.reload();
    }
  }

  return (
    <Screen title="Admin" kicker="Registered accounts" nav={false}>
      <button className="auth-back" onClick={() => navigate('/settings')} style={{ marginBottom: 16 }}>
        ← Settings
      </button>

      <Section title="Overview">
        {stats.loading ? (
          <LoadingRows rows={1} />
        ) : stats.error ? (
          <ErrorState message={stats.error} onRetry={stats.reload} />
        ) : (
          stats.data && (
            <div className="admin-stats">
              <div className="detail-stat">
                <span className="detail-stat-n">{stats.data.totalUsers}</span>
                <span className="detail-stat-l">Users</span>
              </div>
              <div className="detail-stat">
                <span className="detail-stat-n">{stats.data.onboardedUsers}</span>
                <span className="detail-stat-l">Onboarded</span>
              </div>
              <div className="detail-stat">
                <span className="detail-stat-n">{stats.data.activeLast7Days}</span>
                <span className="detail-stat-l">Active 7d</span>
              </div>
              <div className="detail-stat">
                <span className="detail-stat-n">{stats.data.paidUsers}</span>
                <span className="detail-stat-l">Paid</span>
              </div>
            </div>
          )
        )}
      </Section>

      <Section title="Accounts">
        <form
          className="planner-add"
          onSubmit={(e) => {
            e.preventDefault();
            setSearch(query.trim());
          }}
        >
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by email" />
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>

        {mutation.error && <p className="inline-error">{mutation.error}</p>}

        {users.loading ? (
          <LoadingRows rows={5} />
        ) : users.error ? (
          <ErrorState message={users.error} onRetry={users.reload} />
        ) : !users.data || users.data.users.length === 0 ? (
          <p className="today-empty">No accounts match.</p>
        ) : (
          <div className="admin-table" role="table">
            {users.data.users.map((u) => (
              <div className="admin-row" role="row" key={u.id}>
                <div className="admin-row-main">
                  <span className="admin-email">
                    {u.email}
                    {u.isAdmin && <span className="admin-badge">admin</span>}
                  </span>
                  <span className="admin-meta">
                    #{u.id} · joined {shortDate(u.createdAt)} · active {shortDate(u.lastActiveAt)}
                    {u.onboarded ? '' : ' · not onboarded'}
                  </span>
                </div>
                <div className="admin-row-side">
                  <span className={`pill pill-${u.plan === 'plus' ? 'ac' : 'default'}`}>{u.plan}</span>
                  <span className={`pill pill-${u.status === 'active' ? 'ok' : 'dg'}`}>{u.status}</span>
                  {!u.isAdmin && (
                    <button
                      className="today-link"
                      disabled={mutation.busy}
                      onClick={() => setStatus(u, u.status === 'active' ? 'suspended' : 'active')}
                    >
                      {u.status === 'active' ? 'Suspend' : 'Reinstate'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        {users.data && <p className="tr-meta" style={{ marginTop: 12 }}>{users.data.total} total</p>}
      </Section>
    </Screen>
  );
}
