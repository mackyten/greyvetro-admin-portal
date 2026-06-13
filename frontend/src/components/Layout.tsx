import { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';

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

function NavItem({ to, icon, label }: { to: string; icon: ReactNode; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `gv-nav-item${isActive ? ' active' : ''}`}
    >
      <span className="gv-nav-item-icon">{icon}</span>
      {label}
    </NavLink>
  );
}

export default function Layout({ children }: { children: ReactNode }) {
  const { user, roles, logout } = useAuth();
  const initials = [user?.given_name?.[0], user?.family_name?.[0]].filter(Boolean).join('').toUpperCase() || '?';
  const topRole = roles.find(r => ['SuperAdmin','OrgManager','Auditor'].includes(r)) ?? roles[0] ?? 'User';

  return (
    <div className="gv-layout">
      <aside className="gv-sidebar">
        <div className="gv-sidebar-brand">
          <div className="gv-sidebar-logo">
            <svg viewBox="0 0 24 24" fill="none" width={15} height={15}>
              <path d="M12 2 4 6v6c0 5 3.5 8 8 10 4.5-2 8-5 8-10V6l-8-4Z" fill="#fff" opacity={.95}/>
              <path d="M9 12l2 2 4-4.5" stroke="#0E9F8E" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <span className="gv-sidebar-brand-name">Greyvetro</span>
            <small className="gv-sidebar-brand-sub">Admin Portal</small>
          </div>
        </div>

        <NavItem to="/"             icon={icons.dashboard} label="Dashboard" />
        <NavItem to="/users"        icon={icons.users}     label="Users" />
        <NavItem to="/organisations" icon={icons.orgs}     label="Organisations" />

        <div className="gv-sidebar-nav-label">Governance</div>
        <NavItem to="/audit" icon={icons.audit} label="Audit Trail" />

        <div className="gv-sidebar-spacer" />

        <div className="gv-sidebar-user">
          <div className="gv-sidebar-user-avatar">{initials}</div>
          <div className="gv-sidebar-user-info">
            <b className="gv-sidebar-user-name">{user?.preferred_username ?? '—'}</b>
            <span className="gv-sidebar-user-role">{topRole}</span>
          </div>
          <button className="gv-sidebar-logout" onClick={logout} title="Sign out">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={14} height={14}>
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" strokeLinecap="round"/>
              <polyline points="16 17 21 12 16 7" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="21" y1="12" x2="9" y2="12" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </aside>

      <main className="gv-main">{children}</main>
    </div>
  );
}
