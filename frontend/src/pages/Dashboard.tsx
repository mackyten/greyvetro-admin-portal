import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import Layout from '../components/Layout';
import { useAuth } from '../auth/useAuth';

interface Stats {
  totalUsers: number;
  enabledUsers: number;
  totalOrgs: number;
  totalRoles: number;
  recentUsers: Array<{ id: string; username: string; email: string; createdTimestamp: number; enabled: boolean }>;
}

function kpiIcon(label: string) {
  if (label === 'Total Users')   return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={13} height={13}><circle cx="9" cy="7" r="3"/><path d="M3 20c0-3 3-5 6-5s6 2 6 5" strokeLinecap="round"/></svg>;
  if (label === 'Active Users')  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={13} height={13}><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
  if (label === 'Organisations') return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={13} height={13}><path d="M5 21V7l7-4 7 4v14" strokeLinejoin="round"/><path d="M9 21v-6h6v6" strokeLinejoin="round"/></svg>;
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={13} height={13}><path d="M12 3l1.8 4.6L18 9l-4.2 1.4L12 15l-1.8-4.6L6 9l4.2-1.4L12 3Z" strokeLinejoin="round"/></svg>;
}

function Kpi({ label, value, sub, color, bg }: { label: string; value: number | string; sub: string; color: string; bg: string }) {
  return (
    <div className="gv-card gv-kpi-card">
      <div className="gv-kpi-label">
        <div className="gv-kpi-icon" style={{ background: bg, color }}>{kpiIcon(label)}</div>
        {label}
      </div>
      <div className="gv-kpi-value" style={{ color }}>{value}</div>
      <div className="gv-kpi-sub">{sub}</div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    apiClient.get<Stats>('/api/stats').then(r => setStats(r.data)).catch(console.error);
  }, []);

  const firstName = user?.given_name ?? user?.preferred_username ?? 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <Layout>
      <div className="gv-page-header">
        <div>
          <h1 className="gv-page-title">{greeting}, {firstName}</h1>
          <p className="gv-page-sub">{today}</p>
        </div>
      </div>

      <div className="gv-kpi-grid">
        <Kpi label="Total Users"   value={stats?.totalUsers ?? '—'}   sub={`${stats?.enabledUsers ?? '—'} enabled`}  color="var(--gv-brand)"  bg="var(--gv-brand-wash)" />
        <Kpi label="Active Users"  value={stats?.enabledUsers ?? '—'} sub="accounts enabled"                          color="var(--gv-good)"   bg="var(--gv-good-wash)" />
        <Kpi label="Organisations" value={stats?.totalOrgs ?? '—'}    sub="top-level groups"                          color="var(--gv-indigo)" bg="#EEF0FE" />
        <Kpi label="Roles"         value={stats?.totalRoles ?? '—'}   sub="realm roles defined"                       color="var(--gv-warn)"   bg="var(--gv-warn-wash)" />
      </div>

      <div className="gv-bottom-grid">
        {/* Recent Users */}
        <div className="gv-card">
          <div className="gv-panel-header">
            <span className="gv-panel-title">Recently Created Users</span>
            <button className="gv-panel-link" onClick={() => navigate('/users')}>View all →</button>
          </div>
          <table className="gv-table">
            <thead>
              <tr>
                <th className="gv-th">Username</th>
                <th className="gv-th">Email</th>
                <th className="gv-th">Status</th>
              </tr>
            </thead>
            <tbody>
              {(stats?.recentUsers ?? []).map(u => (
                <tr key={u.id} className="gv-tr" onClick={() => navigate('/users')}>
                  <td className="gv-td">{u.username}</td>
                  <td className="gv-td gv-muted">{u.email}</td>
                  <td className="gv-td">
                    <span className={`gv-badge ${u.enabled ? 'gv-badge-green' : 'gv-badge-gray'}`}>
                      {u.enabled ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                </tr>
              ))}
              {!stats && (
                <tr><td className="gv-td gv-dim" colSpan={3}>Loading…</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Quick Actions */}
        <div className="gv-card">
          <div className="gv-panel-header">
            <span className="gv-panel-title">Quick Actions</span>
          </div>
          <div style={{ padding: '4px 14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Create new user',      sub: 'Provision a user account and assign roles',   path: '/users',         color: 'var(--gv-brand-wash)', ink: 'var(--gv-brand)' },
              { label: 'Create organisation',  sub: 'Add a top-level group for a new tenant',      path: '/organisations', color: '#EEF0FE',               ink: 'var(--gv-indigo)' },
              { label: 'Manage user roles',    sub: 'Assign or revoke realm roles from users',     path: '/users',         color: 'var(--gv-warn-wash)',  ink: 'var(--gv-warn)' },
              { label: 'View audit trail',     sub: 'Review access and configuration events',      path: '/audit',         color: 'var(--gv-line-soft)',  ink: 'var(--gv-ink-2)' },
            ].map(item => (
              <button key={item.label} className="gv-qa-item" onClick={() => navigate(item.path)}>
                <div className="gv-qa-icon" style={{ background: item.color, color: item.ink }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={15} height={15}><path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <div>
                  <div className="gv-qa-label">{item.label}</div>
                  <div className="gv-qa-sub">{item.sub}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
