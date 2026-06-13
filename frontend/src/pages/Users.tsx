import { useEffect, useState, useCallback } from 'react';
import apiClient from '../api/client';
import Layout from '../components/Layout';
import ConfirmModal from '../components/ConfirmModal';
import { useAuth } from '../auth/useAuth';
import { Button, Avatar, Badge, Modal, ModalHead, ModalBody, ModalFoot, ErrorBanner, PageHeader, SearchInput } from '../components/ui';

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

function RoleChip({ role, selected, onClick }: { role: string; selected?: boolean; onClick?: () => void }) {
  const c = ROLE_COLORS[role] ?? { bg: 'var(--gv-line-soft)', color: 'var(--gv-ink-2)' };
  return (
    <button
      className={`gv-role-chip${selected ? ' selected' : ''}`}
      onClick={onClick}
      style={selected ? { background: c.bg, color: c.color, borderColor: c.color } : undefined}
    >
      {role}
    </button>
  );
}

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
  const [createError, setCreateError] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<KcUser | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const usersRes = await apiClient.get<KcUser[]>('/api/users');
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
    if (form.password.length < 12) { setCreateError('Password must be at least 12 characters.'); return; }
    setSaving(true);
    setCreateError(null);
    try {
      await apiClient.post('/api/users', form);
      setShowCreate(false);
      setForm(EMPTY_FORM);
      await load();
    } catch (err: any) {
      const msg = err?.response?.data?.detail ?? 'Failed to create user.';
      setCreateError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally { setSaving(false); }
  }

  async function handleToggle(u: KcUser) {
    try {
      await apiClient.put(`/api/users/${u.id}`, { enabled: !u.enabled });
      await load();
    } catch {
      setPageError(`Failed to ${u.enabled ? 'disable' : 'enable'} user "${u.username}". Please try again.`);
    }
  }

  async function confirmDeleteUser() {
    if (!confirmDelete) return;
    try {
      await apiClient.delete(`/api/users/${confirmDelete.id}`);
      setConfirmDelete(null);
      await load();
    } catch {
      setConfirmDelete(null);
      setPageError(`Failed to delete user "${confirmDelete.username}". Please try again.`);
    }
  }

  async function handleSaveRoles(userId: string, roles: string[]) {
    try {
      await apiClient.put(`/api/users/${userId}/roles`, { roles });
      setRoleModal(null);
      await load();
    } catch {
      setPageError('Failed to update roles. Please try again.');
    }
  }

  function closeCreate() { setShowCreate(false); setForm(EMPTY_FORM); setCreateError(null); }

  return (
    <Layout>
      <PageHeader
        title="Users"
        sub={`${users.length} accounts in the greyvetro realm`}
        action={isSuperAdmin ? (
          <Button variant="primary" onClick={() => setShowCreate(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} width={13} height={13}><path d="M12 5v14M5 12h14" strokeLinecap="round"/></svg>
            New User
          </Button>
        ) : undefined}
      />

      {pageError && <ErrorBanner message={pageError} onDismiss={() => setPageError(null)} style={{ marginBottom: 14 }} />}

      <div className="gv-card">
        <div className="gv-toolbar">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by username or email…" style={{ flex: 1 }} />
        </div>

        <table className="gv-table">
          <thead>
            <tr>
              <th className="gv-th">User</th>
              <th className="gv-th">Email</th>
              <th className="gv-th">Roles</th>
              <th className="gv-th">Status</th>
              {isSuperAdmin && <th className="gv-th">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td className="gv-td gv-dim" colSpan={5}>Loading…</td></tr>}
            {!loading && filtered.length === 0 && <tr><td className="gv-td gv-dim" colSpan={5}>No users found.</td></tr>}
            {filtered.map(u => (
              <tr key={u.id} className="gv-tr">
                <td className="gv-td">
                  <div className="gv-row">
                    <Avatar name={u.firstName || u.username} size="sm" shape="circle" style={{ background: 'linear-gradient(135deg,#5B6CF0,#8B7BF0)' }} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{u.firstName} {u.lastName}</div>
                      <div className="gv-dim" style={{ fontSize: 11 }}>@{u.username}</div>
                    </div>
                  </div>
                </td>
                <td className="gv-td gv-muted">{u.email}</td>
                <td className="gv-td">
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {(u.realmRoles ?? []).map(r => <RoleChip key={r} role={r} selected />)}
                    {isSuperAdmin && (
                      <Button variant="secondary" size="xs" onClick={() => setRoleModal({ user: u, currentRoles: u.realmRoles ?? [] })}>
                        Edit
                      </Button>
                    )}
                  </div>
                </td>
                <td className="gv-td">
                  <Badge variant={u.enabled ? 'green' : 'gray'}>{u.enabled ? 'Active' : 'Disabled'}</Badge>
                </td>
                {isSuperAdmin && (
                  <td className="gv-td">
                    <div className="gv-row">
                      <Button variant="secondary" size="sm" onClick={() => handleToggle(u)}>{u.enabled ? 'Disable' : 'Enable'}</Button>
                      <Button variant="ghost-danger" size="sm" onClick={() => setConfirmDelete(u)}>Delete</Button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <Modal onClose={closeCreate}>
          <ModalHead title="Create New User" onClose={closeCreate} />
          <ModalBody>
            {createError && <ErrorBanner message={createError} onDismiss={() => setCreateError(null)} style={{ marginBottom: 14 }} />}
            <div className="gv-grid-2">
              <div className="gv-field">
                <label className="gv-label">First Name</label>
                <input className="gv-input" value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} placeholder="First" />
              </div>
              <div className="gv-field">
                <label className="gv-label">Last Name</label>
                <input className="gv-input" value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} placeholder="Last" />
              </div>
            </div>
            <div className="gv-field">
              <label className="gv-label">Username</label>
              <input className="gv-input" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} placeholder="username" />
            </div>
            <div className="gv-field">
              <label className="gv-label">Email</label>
              <input className="gv-input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="user@example.com" />
            </div>
            <div className="gv-field">
              <label className="gv-label">Initial Password</label>
              <input className="gv-input" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Min 12 chars, upper, lower, digit, special" />
            </div>
            <div className="gv-field">
              <label className="gv-label">Roles</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {APP_ROLES.map(r => (
                  <RoleChip key={r} role={r} selected={form.roles.includes(r)} onClick={() => setForm(f => ({ ...f, roles: f.roles.includes(r) ? f.roles.filter(x => x !== r) : [...f.roles, r] }))} />
                ))}
              </div>
            </div>
          </ModalBody>
          <ModalFoot>
            <Button variant="secondary" onClick={closeCreate}>Cancel</Button>
            <Button variant="primary" onClick={handleCreate} disabled={saving}>{saving ? 'Creating…' : 'Create User'}</Button>
          </ModalFoot>
        </Modal>
      )}

      {roleModal && (
        <RoleEditModal
          user={roleModal.user}
          currentRoles={roleModal.currentRoles}
          onSave={handleSaveRoles}
          onClose={() => setRoleModal(null)}
        />
      )}

      {confirmDelete && (
        <ConfirmModal
          title={`Delete @${confirmDelete.username}?`}
          message="This permanently removes the user from Keycloak. This cannot be undone."
          confirmLabel="Delete User"
          onConfirm={confirmDeleteUser}
          onCancel={() => setConfirmDelete(null)}
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

  async function save() {
    setSaving(true);
    try { await onSave(user.id, selected); } finally { setSaving(false); }
  }

  return (
    <Modal size="sm" onClose={onClose}>
      <ModalHead title={`Edit Roles — @${user.username}`} onClose={onClose} />
      <ModalBody>
        <p className="gv-dim" style={{ fontSize: 12, marginBottom: 12 }}>Select all realm roles this user should have.</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          {APP_ROLES.map(r => (
            <RoleChip
              key={r}
              role={r}
              selected={selected.includes(r)}
              onClick={() => setSelected(s => s.includes(r) ? s.filter(x => x !== r) : [...s, r])}
            />
          ))}
        </div>
      </ModalBody>
      <ModalFoot>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Roles'}</Button>
      </ModalFoot>
    </Modal>
  );
}
