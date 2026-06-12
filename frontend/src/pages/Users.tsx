import { useEffect, useState, useCallback } from 'react';
import apiClient from '../api/client';
import Layout from '../components/Layout';
import { useAuth } from '../auth/useAuth';

interface KcUser {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  enabled: boolean;
  createdTimestamp: number;
  realmRoles?: string[];
}

interface Role { id: string; name: string; description: string; }

const APP_ROLES = ['SuperAdmin', 'OrgManager', 'Auditor', 'Doctor', 'Nurse', 'MedicalClerk', 'Cashier', 'ShiftLead', 'StoreManager'];

const ROLE_COLORS: Record<string, { bg: string; color: string }> = {
  SuperAdmin:   { bg: 'var(--gv-bad-wash)',    color: 'var(--gv-bad)' },
  OrgManager:   { bg: 'var(--gv-warn-wash)',   color: 'var(--gv-warn)' },
  Auditor:      { bg: 'var(--gv-line-soft)',   color: 'var(--gv-ink-2)' },
  Doctor:       { bg: '#EEF0FE',               color: 'var(--gv-indigo)' },
  Nurse:        { bg: '#EEF0FE',               color: 'var(--gv-indigo)' },
  MedicalClerk: { bg: '#EEF0FE',               color: 'var(--gv-indigo)' },
  Cashier:      { bg: 'var(--gv-brand-wash)',  color: 'var(--gv-brand)' },
  ShiftLead:    { bg: 'var(--gv-brand-wash)',  color: 'var(--gv-brand)' },
  StoreManager: { bg: 'var(--gv-brand-wash)',  color: 'var(--gv-brand)' },
};

function RoleChip({ role }: { role: string }) {
  const c = ROLE_COLORS[role] ?? { bg: 'var(--gv-line-soft)', color: 'var(--gv-ink-2)' };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: 10.5, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: c.bg, color: c.color, marginRight: 4, marginBottom: 2 }}>
      {role}
    </span>
  );
}

const S: Record<string, React.CSSProperties> = {
  topbar:  { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  h1:      { fontSize: 20, fontWeight: 700, letterSpacing: '-0.03em' },
  sub:     { fontSize: 12.5, color: 'var(--gv-ink-2)', marginTop: 2 },
  card:    { background: 'var(--gv-card)', border: '1px solid var(--gv-line)', borderRadius: 'var(--gv-r-card)', boxShadow: 'var(--gv-shadow)', overflow: 'hidden' },
  toolbar: { display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: '1px solid var(--gv-line-soft)' },
  search:  { flex: 1, height: 34, border: '1px solid var(--gv-line)', borderRadius: 'var(--gv-r-ctrl)', padding: '0 12px', fontSize: 13, color: 'var(--gv-ink)', background: 'var(--gv-bg)', outline: 'none' },
  btn:     { display: 'inline-flex', alignItems: 'center', gap: 6, height: 34, padding: '0 14px', border: '1px solid var(--gv-line)', borderRadius: 'var(--gv-r-ctrl)', fontSize: 12.5, fontWeight: 600, color: 'var(--gv-ink-2)', background: 'var(--gv-card)', cursor: 'pointer' },
  btnPri:  { display: 'inline-flex', alignItems: 'center', gap: 6, height: 34, padding: '0 14px', border: '1px solid var(--gv-brand)', borderRadius: 'var(--gv-r-ctrl)', fontSize: 12.5, fontWeight: 600, color: '#fff', background: 'var(--gv-brand)', cursor: 'pointer', boxShadow: '0 3px 10px rgba(14,159,142,.25)' },
  table:   { width: '100%', borderCollapse: 'collapse' as const },
  th:      { fontSize: 10.5, fontWeight: 700, color: 'var(--gv-ink-3)', textTransform: 'uppercase' as const, letterSpacing: '.06em', padding: '10px 16px', textAlign: 'left' as const, borderBottom: '1px solid var(--gv-line-soft)', background: 'var(--gv-bg)' },
  td:      { fontSize: 12.5, padding: '11px 16px', borderBottom: '1px solid var(--gv-line-soft)', verticalAlign: 'middle' },
  // Modal
  overlay: { position: 'fixed' as const, inset: 0, background: 'rgba(14,23,33,.45)', display: 'grid', placeItems: 'center', zIndex: 100 },
  modal:   { background: '#fff', borderRadius: 16, boxShadow: 'var(--gv-shadow-lg)', width: 480, maxHeight: '90vh', overflow: 'auto' },
  mHead:   { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px 14px', borderBottom: '1px solid var(--gv-line-soft)' },
  mTitle:  { fontSize: 15, fontWeight: 700, letterSpacing: '-0.02em' },
  mBody:   { padding: '16px 20px' },
  mFoot:   { display: 'flex', gap: 8, justifyContent: 'flex-end', padding: '12px 20px 18px', borderTop: '1px solid var(--gv-line-soft)' },
  field:   { marginBottom: 14 },
  label:   { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--gv-ink-2)', marginBottom: 5 },
  input:   { width: '100%', height: 36, border: '1px solid var(--gv-line)', borderRadius: 9, padding: '0 11px', fontSize: 13, color: 'var(--gv-ink)', outline: 'none', background: '#fff' },
  row2:    { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
};

interface CreateForm { username: string; email: string; firstName: string; lastName: string; password: string; roles: string[]; }
const EMPTY_FORM: CreateForm = { username: '', email: '', firstName: '', lastName: '', password: '', roles: [] };

interface RoleModalState { user: KcUser; currentRoles: string[]; }

export default function Users() {
  const { hasRole } = useAuth();
  const isSuperAdmin = hasRole('SuperAdmin');

  const [users, setUsers]       = useState<KcUser[]>([]);
  const [search, setSearch]     = useState('');
  const [loading, setLoading]   = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [roleModal, setRoleModal]   = useState<RoleModalState | null>(null);
  const [form, setForm]         = useState<CreateForm>(EMPTY_FORM);
  const [saving, setSaving]     = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes] = await Promise.all([
        apiClient.get<KcUser[]>('/api/users'),
      ]);
      // fetch roles for each user
      const withRoles = await Promise.all(
        usersRes.data.map(async u => {
          try {
            const rolesRes = await apiClient.get<Role[]>(`/api/users/${u.id}/roles`);
            return { ...u, realmRoles: rolesRes.data.map(r => r.name) };
          } catch { return u; }
        })
      );
      setUsers(withRoles);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  async function handleCreate() {
    if (!form.username || !form.email || !form.password) return;
    setSaving(true);
    try {
      await apiClient.post('/api/users', form);
      setShowCreate(false);
      setForm(EMPTY_FORM);
      await load();
    } finally { setSaving(false); }
  }

  async function handleToggle(u: KcUser) {
    await apiClient.put(`/api/users/${u.id}`, { enabled: !u.enabled });
    await load();
  }

  async function handleDelete(u: KcUser) {
    if (!confirm(`Delete user "${u.username}"? This cannot be undone.`)) return;
    await apiClient.delete(`/api/users/${u.id}`);
    await load();
  }

  async function handleSaveRoles(userId: string, roles: string[]) {
    await apiClient.put(`/api/users/${userId}/roles`, { roles });
    setRoleModal(null);
    await load();
  }

  function toggleFormRole(r: string) {
    setForm(f => ({ ...f, roles: f.roles.includes(r) ? f.roles.filter(x => x !== r) : [...f.roles, r] }));
  }

  return (
    <Layout>
      <div style={S.topbar}>
        <div>
          <h1 style={S.h1}>Users</h1>
          <p style={S.sub}>{users.length} accounts in the greyvetro realm</p>
        </div>
        {isSuperAdmin && (
          <button style={S.btnPri} onClick={() => setShowCreate(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} width={13} height={13}><path d="M12 5v14M5 12h14" strokeLinecap="round"/></svg>
            New User
          </button>
        )}
      </div>

      <div style={S.card}>
        <div style={S.toolbar}>
          <input style={S.search} placeholder="Search by username or email…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>User</th>
              <th style={S.th}>Email</th>
              <th style={S.th}>Roles</th>
              <th style={S.th}>Status</th>
              {isSuperAdmin && <th style={S.th}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td style={{ ...S.td, color: 'var(--gv-ink-3)' }} colSpan={5}>Loading…</td></tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr><td style={{ ...S.td, color: 'var(--gv-ink-3)' }} colSpan={5}>No users found.</td></tr>
            )}
            {filtered.map(u => (
              <tr key={u.id} style={{ transition: 'background .1s' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--gv-bg)')}
                onMouseLeave={e => (e.currentTarget.style.background = '')}
              >
                <td style={S.td}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#5B6CF0,#8B7BF0)', display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 700, fontSize: 11, flexShrink: 0 }}>
                      {(u.firstName?.[0] ?? u.username[0]).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{u.firstName} {u.lastName}</div>
                      <div style={{ fontSize: 11, color: 'var(--gv-ink-3)' }}>@{u.username}</div>
                    </div>
                  </div>
                </td>
                <td style={{ ...S.td, color: 'var(--gv-ink-2)' }}>{u.email}</td>
                <td style={S.td}>
                  <div style={{ display: 'flex', flexWrap: 'wrap' as const }}>
                    {(u.realmRoles ?? []).map(r => <RoleChip key={r} role={r} />)}
                    {isSuperAdmin && (
                      <button style={{ ...S.btn, height: 20, padding: '0 7px', fontSize: 10.5 }} onClick={() => setRoleModal({ user: u, currentRoles: u.realmRoles ?? [] })}>
                        Edit
                      </button>
                    )}
                  </div>
                </td>
                <td style={S.td}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: u.enabled ? 'var(--gv-good-wash)' : 'var(--gv-line-soft)', color: u.enabled ? 'var(--gv-good)' : 'var(--gv-ink-3)' }}>
                    {u.enabled ? 'Active' : 'Disabled'}
                  </span>
                </td>
                {isSuperAdmin && (
                  <td style={S.td}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button style={S.btn} onClick={() => handleToggle(u)}>{u.enabled ? 'Disable' : 'Enable'}</button>
                      <button style={{ ...S.btn, color: 'var(--gv-bad)', borderColor: 'var(--gv-bad-wash)' }} onClick={() => handleDelete(u)}>Delete</button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create user modal */}
      {showCreate && (
        <div style={S.overlay} onClick={e => { if (e.target === e.currentTarget) { setShowCreate(false); setForm(EMPTY_FORM); } }}>
          <div style={S.modal}>
            <div style={S.mHead}>
              <span style={S.mTitle}>Create New User</span>
              <button style={{ border: 0, background: 'none', cursor: 'pointer', color: 'var(--gv-ink-3)', fontSize: 18 }} onClick={() => { setShowCreate(false); setForm(EMPTY_FORM); }}>✕</button>
            </div>
            <div style={S.mBody}>
              <div style={S.row2}>
                <div style={S.field}>
                  <label style={S.label}>First Name</label>
                  <input style={S.input} value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} placeholder="First" />
                </div>
                <div style={S.field}>
                  <label style={S.label}>Last Name</label>
                  <input style={S.input} value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} placeholder="Last" />
                </div>
              </div>
              <div style={S.field}>
                <label style={S.label}>Username</label>
                <input style={S.input} value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} placeholder="username" />
              </div>
              <div style={S.field}>
                <label style={S.label}>Email</label>
                <input style={S.input} type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="user@example.com" />
              </div>
              <div style={S.field}>
                <label style={S.label}>Initial Password</label>
                <input style={S.input} type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Min 12 chars, upper, lower, digit, special" />
              </div>
              <div style={S.field}>
                <label style={S.label}>Roles</label>
                <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6 }}>
                  {APP_ROLES.map(r => {
                    const selected = form.roles.includes(r);
                    const c = ROLE_COLORS[r] ?? { bg: 'var(--gv-line-soft)', color: 'var(--gv-ink-2)' };
                    return (
                      <button key={r} onClick={() => toggleFormRole(r)} style={{ fontSize: 11.5, fontWeight: 700, padding: '4px 10px', borderRadius: 20, border: '1.5px solid', cursor: 'pointer', background: selected ? c.bg : 'transparent', color: selected ? c.color : 'var(--gv-ink-3)', borderColor: selected ? c.color : 'var(--gv-line)' }}>
                        {r}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div style={S.mFoot}>
              <button style={S.btn} onClick={() => { setShowCreate(false); setForm(EMPTY_FORM); }}>Cancel</button>
              <button style={S.btnPri} onClick={handleCreate} disabled={saving}>{saving ? 'Creating…' : 'Create User'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Role edit modal */}
      {roleModal && (
        <RoleEditModal
          user={roleModal.user}
          currentRoles={roleModal.currentRoles}
          onSave={handleSaveRoles}
          onClose={() => setRoleModal(null)}
        />
      )}
    </Layout>
  );
}

function RoleEditModal({ user, currentRoles, onSave, onClose }: {
  user: KcUser;
  currentRoles: string[];
  onSave: (userId: string, roles: string[]) => Promise<void>;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<string[]>(currentRoles);
  const [saving, setSaving] = useState(false);

  function toggle(r: string) {
    setSelected(s => s.includes(r) ? s.filter(x => x !== r) : [...s, r]);
  }

  async function save() {
    setSaving(true);
    try { await onSave(user.id, selected); } finally { setSaving(false); }
  }

  const S2: Record<string, React.CSSProperties> = {
    overlay: { position: 'fixed' as const, inset: 0, background: 'rgba(14,23,33,.45)', display: 'grid', placeItems: 'center', zIndex: 100 },
    modal:   { background: '#fff', borderRadius: 16, boxShadow: 'var(--gv-shadow-lg)', width: 420 },
    mHead:   { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px 12px', borderBottom: '1px solid var(--gv-line-soft)' },
    mTitle:  { fontSize: 14.5, fontWeight: 700, letterSpacing: '-0.02em' },
    mBody:   { padding: '14px 18px' },
    mFoot:   { display: 'flex', gap: 8, justifyContent: 'flex-end', padding: '10px 18px 16px', borderTop: '1px solid var(--gv-line-soft)' },
    btn:     { display: 'inline-flex', alignItems: 'center', gap: 6, height: 34, padding: '0 14px', border: '1px solid var(--gv-line)', borderRadius: 'var(--gv-r-ctrl)', fontSize: 12.5, fontWeight: 600, color: 'var(--gv-ink-2)', background: 'var(--gv-card)', cursor: 'pointer' },
    btnPri:  { display: 'inline-flex', alignItems: 'center', gap: 6, height: 34, padding: '0 14px', border: '1px solid var(--gv-brand)', borderRadius: 'var(--gv-r-ctrl)', fontSize: 12.5, fontWeight: 600, color: '#fff', background: 'var(--gv-brand)', cursor: 'pointer' },
  };

  return (
    <div style={S2.overlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={S2.modal}>
        <div style={S2.mHead}>
          <span style={S2.mTitle}>Edit Roles — @{user.username}</span>
          <button style={{ border: 0, background: 'none', cursor: 'pointer', color: 'var(--gv-ink-3)', fontSize: 18 }} onClick={onClose}>✕</button>
        </div>
        <div style={S2.mBody}>
          <div style={{ fontSize: 12, color: 'var(--gv-ink-2)', marginBottom: 12 }}>Select all realm roles this user should have.</div>
          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 7 }}>
            {APP_ROLES.map(r => {
              const on = selected.includes(r);
              const c = ROLE_COLORS[r] ?? { bg: 'var(--gv-line-soft)', color: 'var(--gv-ink-2)' };
              return (
                <button key={r} onClick={() => toggle(r)} style={{ fontSize: 12, fontWeight: 700, padding: '5px 11px', borderRadius: 20, border: '1.5px solid', cursor: 'pointer', background: on ? c.bg : 'transparent', color: on ? c.color : 'var(--gv-ink-3)', borderColor: on ? c.color : 'var(--gv-line)' }}>
                  {r}
                </button>
              );
            })}
          </div>
        </div>
        <div style={S2.mFoot}>
          <button style={S2.btn} onClick={onClose}>Cancel</button>
          <button style={S2.btnPri} onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Roles'}</button>
        </div>
      </div>
    </div>
  );
}
