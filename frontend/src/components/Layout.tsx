import { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';

const S: Record<string, React.CSSProperties> = {
  app:   { display: 'flex', minHeight: '100vh' },
  side:  {
    background: 'var(--gv-dark-bg)', color: 'var(--gv-dark-ink)',
    padding: '18px 12px', display: 'flex', flexDirection: 'column',
    gap: 2, width: 220, minWidth: 220, minHeight: '100vh', overflowY: 'auto',
    position: 'sticky', top: 0, alignSelf: 'flex-start', height: '100vh',
  },
  brand: { display: 'flex', alignItems: 'center', gap: 10, padding: '4px 10px 18px' },
  mark:  {
    width: 30, height: 30, borderRadius: 8, flexShrink: 0,
    background: 'var(--gv-brand-grad)', display: 'grid', placeItems: 'center',
    boxShadow: '0 5px 14px rgba(20,184,166,.38)',
  },
  brandName: { fontWeight: 700, fontSize: 14, color: '#fff', letterSpacing: '-0.02em' },
  brandSub:  { display: 'block', fontWeight: 500, fontSize: 10, color: 'var(--gv-dark-muted)', letterSpacing: 0, marginTop: 1 },
  navLabel:  { fontSize: 10, textTransform: 'uppercase', letterSpacing: '.1em', color: '#3E5060', padding: '12px 12px 4px', fontWeight: 600 },
  spacer:    { flex: 1 },
  me: {
    display: 'flex', alignItems: 'center', gap: 9, padding: 10,
    borderRadius: 10, background: 'rgba(255,255,255,.04)', marginTop: 6,
  },
  av: {
    width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#5B6CF0,#8B7BF0)',
    display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 700, fontSize: 11, flexShrink: 0,
  },
  meInfo: { flex: 1 },
  meName: { color: '#fff', fontWeight: 600, fontSize: 12, display: 'block' },
  meRole: { color: 'var(--gv-dark-muted)', fontSize: 10.5 },
  logoutBtn: {
    border: 0, background: 'transparent', color: 'var(--gv-dark-muted)',
    fontSize: 11, cursor: 'pointer', padding: '2px 0',
  },
  main: { flex: 1, minWidth: 0, padding: '22px 26px 32px' },
};

interface NavItemProps { to: string; icon: ReactNode; label: string; }

function NavItem({ to, icon, label }: NavItemProps) {
  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
        borderRadius: 9, fontSize: 13, fontWeight: 500, color: isActive ? '#fff' : '#AEBCC9',
        background: isActive ? 'linear-gradient(90deg, rgba(20,184,166,.18), rgba(20,184,166,.04))' : 'transparent',
        boxShadow: isActive ? 'inset 2px 0 0 var(--gv-brand-2)' : 'none',
        textDecoration: 'none', cursor: 'pointer',
      })}
    >
      <span style={{ width: 16, height: 16, flexShrink: 0, opacity: 0.85 }}>{icon}</span>
      {label}
    </NavLink>
  );
}

const icons = {
  dashboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={16} height={16}>
      <rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/>
      <rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>
    </svg>
  ),
  users: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={16} height={16}>
      <circle cx="9" cy="7" r="3"/><path d="M3 20c0-3 3-5 6-5s6 2 6 5" strokeLinecap="round"/>
      <path d="M17 8h4M19 6v4" strokeLinecap="round"/>
    </svg>
  ),
  orgs: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={16} height={16}>
      <path d="M5 21V7l7-4 7 4v14" strokeLinejoin="round"/>
      <path d="M9 21v-6h6v6" strokeLinejoin="round"/>
    </svg>
  ),
  audit: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={16} height={16}>
      <path d="M4 5h16M4 12h16M4 19h10" strokeLinecap="round"/>
    </svg>
  ),
};

interface Props { children: ReactNode; }

export default function Layout({ children }: Props) {
  const { user, roles, logout } = useAuth();
  const initials = [user?.given_name?.[0], user?.family_name?.[0]].filter(Boolean).join('').toUpperCase() || '?';
  const topRole = roles.find(r => ['SuperAdmin','OrgManager','Auditor'].includes(r)) ?? roles[0] ?? 'User';

  return (
    <div style={S.app}>
      <aside style={S.side}>
        <div style={S.brand}>
          <div style={S.mark}>
            <svg viewBox="0 0 24 24" fill="none" width={15} height={15}>
              <path d="M12 2 4 6v6c0 5 3.5 8 8 10 4.5-2 8-5 8-10V6l-8-4Z" fill="#fff" opacity={.95}/>
              <path d="M9 12l2 2 4-4.5" stroke="#0E9F8E" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <span style={S.brandName}>Greyvetro</span>
            <small style={S.brandSub}>Admin Portal</small>
          </div>
        </div>

        <NavItem to="/" icon={icons.dashboard} label="Dashboard" />
        <NavItem to="/users" icon={icons.users} label="Users" />
        <NavItem to="/organisations" icon={icons.orgs} label="Organisations" />

        <div style={S.navLabel}>Governance</div>
        <NavItem to="/audit" icon={icons.audit} label="Audit Trail" />

        <div style={S.spacer} />

        <div style={S.me}>
          <div style={S.av}>{initials}</div>
          <div style={S.meInfo}>
            <b style={S.meName}>{user?.preferred_username ?? '—'}</b>
            <span style={S.meRole}>{topRole}</span>
          </div>
          <button style={S.logoutBtn} onClick={logout} title="Sign out">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={14} height={14}>
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" strokeLinecap="round"/>
              <polyline points="16 17 21 12 16 7" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="21" y1="12" x2="9" y2="12" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </aside>

      <main style={S.main}>{children}</main>
    </div>
  );
}
