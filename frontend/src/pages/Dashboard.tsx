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

const S: Record<string, React.CSSProperties> = {
  topbar:    { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 22 },
  h1:        { fontSize: 20, fontWeight: 700, letterSpacing: '-0.03em', whiteSpace: 'nowrap' as const },
  sub:       { fontSize: 12.5, color: 'var(--gv-ink-2)', marginTop: 2 },
  kpis:      { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 18 },
  card:      { background: 'var(--gv-card)', border: '1px solid var(--gv-line)', borderRadius: 'var(--gv-r-card)', boxShadow: 'var(--gv-shadow)' },
  kpi:       { padding: '15px 16px' },
  kpiLbl:    { fontSize: 11.5, color: 'var(--gv-ink-2)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 7 },
  kpiIc:     { width: 24, height: 24, borderRadius: 7, display: 'grid', placeItems: 'center', flexShrink: 0 },
  kpiVal:    { fontSize: 28, fontWeight: 750, letterSpacing: '-0.035em', margin: '10px 0 4px' },
  kpiSub:    { fontSize: 11, color: 'var(--gv-ink-3)' },
  bottom:    { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, width: '100%' },
  panelH:    { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 10px' },
  panelHt:   { fontSize: 14, fontWeight: 700, letterSpacing: '-0.02em' },
  panelMeta: { fontSize: 11.5, color: 'var(--gv-ink-3)', fontWeight: 500 },
  link:      { fontSize: 11.5, fontWeight: 700, color: 'var(--gv-brand)', cursor: 'pointer', background: 'none', border: 0 },
  table:     { width: '100%', borderCollapse: 'collapse' as const },
  th:        { fontSize: 10.5, fontWeight: 700, color: 'var(--gv-ink-3)', textTransform: 'uppercase' as const, letterSpacing: '.06em', padding: '0 16px 8px', textAlign: 'left' as const, borderBottom: '1px solid var(--gv-line-soft)' },
  td:        { fontSize: 12.5, padding: '10px 16px', borderBottom: '1px solid var(--gv-line-soft)', color: 'var(--gv-ink)' },
  chip:      { display: 'inline-flex', alignItems: 'center', fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 20 },
};

function Kpi({ label, value, sub, color, bg }: { label: string; value: number | string; sub: string; color: string; bg: string }) {
  return (
    <div style={{ ...S.card, ...S.kpi }}>
      <div style={S.kpiLbl}>
        <div style={{ ...S.kpiIc, background: bg, color }}>{kpiIcon(label)}</div>
        {label}
      </div>
      <div style={{ ...S.kpiVal, color }}>{value}</div>
      <div style={S.kpiSub}>{sub}</div>
    </div>
  );
}

function kpiIcon(label: string) {
  if (label === 'Total Users') return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={13} height={13}><circle cx="9" cy="7" r="3"/><path d="M3 20c0-3 3-5 6-5s6 2 6 5" strokeLinecap="round"/></svg>;
  if (label === 'Active Users') return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={13} height={13}><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
  if (label === 'Organisations') return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={13} height={13}><path d="M5 21V7l7-4 7 4v14" strokeLinejoin="round"/><path d="M9 21v-6h6v6" strokeLinejoin="round"/></svg>;
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={13} height={13}><path d="M12 3l1.8 4.6L18 9l-4.2 1.4L12 15l-1.8-4.6L6 9l4.2-1.4L12 3Z" strokeLinejoin="round"/></svg>;
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
      <div style={S.topbar}>
        <div>
          <h1 style={S.h1}>{greeting}, {firstName}</h1>
          <p style={S.sub}>{today}</p>
        </div>
      </div>

      <div style={S.kpis}>
        <Kpi label="Total Users"   value={stats?.totalUsers ?? '—'}   sub={`${stats?.enabledUsers ?? '—'} enabled`}  color="var(--gv-brand)"  bg="var(--gv-brand-wash)" />
        <Kpi label="Active Users"  value={stats?.enabledUsers ?? '—'} sub="accounts enabled"                          color="var(--gv-good)"   bg="var(--gv-good-wash)" />
        <Kpi label="Organisations" value={stats?.totalOrgs ?? '—'}    sub="top-level groups"                          color="var(--gv-indigo)" bg="#EEF0FE" />
        <Kpi label="Roles"         value={stats?.totalRoles ?? '—'}   sub="realm roles defined"                       color="var(--gv-warn)"   bg="var(--gv-warn-wash)" />
      </div>

      <div style={S.bottom}>
        {/* Recent Users */}
        <div style={S.card}>
          <div style={S.panelH}>
            <span style={S.panelHt}>Recently Created Users</span>
            <button style={S.link} onClick={() => navigate('/users')}>View all →</button>
          </div>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Username</th>
                <th style={S.th}>Email</th>
                <th style={S.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {(stats?.recentUsers ?? []).map(u => (
                <tr key={u.id} style={{ cursor: 'pointer' }} onClick={() => navigate('/users')}>
                  <td style={S.td}>{u.username}</td>
                  <td style={{ ...S.td, color: 'var(--gv-ink-2)' }}>{u.email}</td>
                  <td style={S.td}>
                    <span style={{ ...S.chip, background: u.enabled ? 'var(--gv-good-wash)' : 'var(--gv-line-soft)', color: u.enabled ? 'var(--gv-good)' : 'var(--gv-ink-3)' }}>
                      {u.enabled ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                </tr>
              ))}
              {!stats && <tr><td style={{ ...S.td, color: 'var(--gv-ink-3)' }} colSpan={3}>Loading…</td></tr>}
            </tbody>
          </table>
        </div>

        {/* Quick links */}
        <div style={S.card}>
          <div style={S.panelH}>
            <span style={S.panelHt}>Quick Actions</span>
          </div>
          <div style={{ padding: '4px 14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Create new user', sub: 'Provision a user account and assign roles', path: '/users', color: 'var(--gv-brand-wash)', ink: 'var(--gv-brand)' },
              { label: 'Create organisation', sub: 'Add a top-level group for a new tenant', path: '/organisations', color: '#EEF0FE', ink: 'var(--gv-indigo)' },
              { label: 'Manage user roles', sub: 'Assign or revoke realm roles from users', path: '/users', color: 'var(--gv-warn-wash)', ink: 'var(--gv-warn)' },
              { label: 'View audit trail', sub: 'Review access and configuration events', path: '/audit', color: 'var(--gv-line-soft)', ink: 'var(--gv-ink-2)' },
            ].map(item => (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 12px', borderRadius: 10, border: '1px solid var(--gv-line)', background: 'var(--gv-bg)', cursor: 'pointer', textAlign: 'left' }}
              >
                <div style={{ width: 34, height: 34, borderRadius: 9, background: item.color, color: item.ink, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={15} height={15}><path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gv-ink)' }}>{item.label}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--gv-ink-3)', marginTop: 1 }}>{item.sub}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
