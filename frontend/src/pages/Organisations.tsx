import { useEffect, useState, useCallback, useRef } from 'react';
import apiClient from '../api/client';
import Layout from '../components/Layout';
import ConfirmModal from '../components/ConfirmModal';
import { useAuth } from '../auth/useAuth';

interface KcGroup { id: string; name: string; path: string; subGroups?: KcGroup[]; }
interface KcUser  { id: string; username: string; email: string; firstName: string; lastName: string; }

const S: Record<string, React.CSSProperties> = {
  topbar:  { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  h1:      { fontSize: 20, fontWeight: 700, letterSpacing: '-0.03em' },
  sub:     { fontSize: 12.5, color: 'var(--gv-ink-2)', marginTop: 2 },
  grid:    { display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16, alignItems: 'start' },
  card:    { background: 'var(--gv-card)', border: '1px solid var(--gv-line)', borderRadius: 'var(--gv-r-card)', boxShadow: 'var(--gv-shadow)', overflow: 'hidden' },
  panelH:  { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 10px', borderBottom: '1px solid var(--gv-line-soft)' },
  panelHt: { fontSize: 14, fontWeight: 700, letterSpacing: '-0.02em' },
  btn:     { display: 'inline-flex', alignItems: 'center', gap: 6, height: 32, padding: '0 12px', border: '1px solid var(--gv-line)', borderRadius: 'var(--gv-r-ctrl)', fontSize: 12, fontWeight: 600, color: 'var(--gv-ink-2)', background: 'var(--gv-card)', cursor: 'pointer' },
  btnPri:  { display: 'inline-flex', alignItems: 'center', gap: 6, height: 32, padding: '0 12px', border: '1px solid var(--gv-brand)', borderRadius: 'var(--gv-r-ctrl)', fontSize: 12, fontWeight: 600, color: '#fff', background: 'var(--gv-brand)', cursor: 'pointer', boxShadow: '0 2px 8px rgba(14,159,142,.25)' },
  overlay: { position: 'fixed' as const, inset: 0, background: 'rgba(14,23,33,.45)', display: 'grid', placeItems: 'center', zIndex: 100 },
  modal:   { background: '#fff', borderRadius: 16, boxShadow: 'var(--gv-shadow-lg)', width: 380 },
  mHead:   { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px 12px', borderBottom: '1px solid var(--gv-line-soft)' },
  mTitle:  { fontSize: 14.5, fontWeight: 700, letterSpacing: '-0.02em' },
  mBody:   { padding: '14px 18px' },
  mFoot:   { display: 'flex', gap: 8, justifyContent: 'flex-end', padding: '10px 18px 16px', borderTop: '1px solid var(--gv-line-soft)' },
  field:   { marginBottom: 14 },
  label:   { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--gv-ink-2)', marginBottom: 5 },
  input:   { width: '100%', height: 36, border: '1px solid var(--gv-line)', borderRadius: 9, padding: '0 11px', fontSize: 13, color: 'var(--gv-ink)', outline: 'none', background: '#fff' },
  table:   { width: '100%', borderCollapse: 'collapse' as const },
  th:      { fontSize: 10.5, fontWeight: 700, color: 'var(--gv-ink-3)', textTransform: 'uppercase' as const, letterSpacing: '.06em', padding: '10px 16px', textAlign: 'left' as const, borderBottom: '1px solid var(--gv-line-soft)', background: 'var(--gv-bg)' },
  td:      { fontSize: 12.5, padding: '11px 16px', borderBottom: '1px solid var(--gv-line-soft)', verticalAlign: 'middle' },
};

export default function Organisations() {
  const { hasRole } = useAuth();
  const isSuperAdmin = hasRole('SuperAdmin');

  const [orgs, setOrgs]               = useState<KcGroup[]>([]);
  const [selected, setSelected]       = useState<KcGroup | null>(null);
  const [members, setMembers]         = useState<KcUser[]>([]);
  const [allUsers, setAllUsers]       = useState<KcUser[]>([]);
  const [loading, setLoading]         = useState(true);
  const [membersLoading, setMembersLoading] = useState(false);
  const [showCreate, setShowCreate]   = useState(false);
  const [newOrgName, setNewOrgName]   = useState('');
  const [saving, setSaving]           = useState(false);
  const [addUserId, setAddUserId]     = useState('');
  const [error, setError]             = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<KcGroup | null>(null);

  const loadOrgs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<KcGroup[]>('/api/organisations');
      setOrgs(res.data);
    } finally { setLoading(false); }
  }, []);

  const loadMembers = useCallback(async (org: KcGroup) => {
    setMembersLoading(true);
    try {
      const [membersRes, usersRes] = await Promise.all([
        apiClient.get<KcUser[]>(`/api/organisations/${org.id}/members`),
        apiClient.get<KcUser[]>('/api/users'),
      ]);
      setMembers(membersRes.data);
      setAllUsers(usersRes.data);
    } finally { setMembersLoading(false); }
  }, []);

  useEffect(() => { loadOrgs(); }, [loadOrgs]);

  useEffect(() => {
    setError(null);
    if (selected) loadMembers(selected);
    else { setMembers([]); setAllUsers([]); }
  }, [selected, loadMembers]);

  async function handleCreate() {
    if (!newOrgName.trim()) return;
    setSaving(true);
    try {
      await apiClient.post('/api/organisations', { name: newOrgName.trim() });
      setShowCreate(false);
      setNewOrgName('');
      await loadOrgs();
    } finally { setSaving(false); }
  }

  async function handleDelete(org: KcGroup) {
    setConfirmDelete(org);
  }

  async function confirmDeleteOrg() {
    if (!confirmDelete) return;
    try {
      await apiClient.delete(`/api/organisations/${confirmDelete.id}`);
      if (selected?.id === confirmDelete.id) setSelected(null);
      setConfirmDelete(null);
      await loadOrgs();
    } catch {
      setConfirmDelete(null);
      setError('Failed to delete organisation. Please try again.');
    }
  }

  async function handleAddMember() {
    if (!selected || !addUserId) return;
    try {
      await apiClient.post(`/api/organisations/${selected.id}/members/${addUserId}`, {});
      setAddUserId('');
      await loadMembers(selected);
    } catch {
      setError('Failed to add member. Please try again.');
    }
  }

  async function handleRemoveMember(userId: string) {
    if (!selected) return;
    try {
      await apiClient.delete(`/api/organisations/${selected.id}/members/${userId}`);
      await loadMembers(selected);
    } catch {
      setError('Failed to remove member. Please try again.');
    }
  }

  const nonMembers = allUsers.filter(u => !members.some(m => m.id === u.id));

  return (
    <Layout>
      <div style={S.topbar}>
        <div>
          <h1 style={S.h1}>Organisations</h1>
          <p style={S.sub}>{orgs.length} top-level groups in the greyvetro realm</p>
        </div>
        {isSuperAdmin && (
          <button style={S.btnPri} onClick={() => setShowCreate(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} width={12} height={12}><path d="M12 5v14M5 12h14" strokeLinecap="round"/></svg>
            New Organisation
          </button>
        )}
      </div>

      <div style={S.grid}>
        {/* Left: org list */}
        <div style={S.card}>
          <div style={S.panelH}>
            <span style={S.panelHt}>All Organisations</span>
            <span style={{ fontSize: 11.5, color: 'var(--gv-ink-3)' }}>{orgs.length} total</span>
          </div>
          <div style={{ padding: '6px 0' }}>
            {loading && <div style={{ padding: '12px 16px', fontSize: 13, color: 'var(--gv-ink-3)' }}>Loading…</div>}
            {!loading && orgs.length === 0 && <div style={{ padding: '12px 16px', fontSize: 13, color: 'var(--gv-ink-3)' }}>No organisations yet.</div>}
            {orgs.map(org => (
              <div
                key={org.id}
                onClick={() => setSelected(selected?.id === org.id ? null : org)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', cursor: 'pointer', background: selected?.id === org.id ? 'var(--gv-brand-wash)' : 'transparent', borderLeft: selected?.id === org.id ? '3px solid var(--gv-brand)' : '3px solid transparent', transition: 'background .1s' }}
              >
                <div style={{ width: 30, height: 30, borderRadius: 8, background: selected?.id === org.id ? 'var(--gv-brand)' : 'linear-gradient(135deg,#5B6CF0,#8B7BF0)', display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 800, fontSize: 11, flexShrink: 0 }}>
                  {org.name[0].toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: selected?.id === org.id ? 'var(--gv-brand-ink)' : 'var(--gv-ink)' }}>{org.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--gv-ink-3)' }}>{org.path}</div>
                </div>
                {isSuperAdmin && (
                  <button onClick={e => { e.stopPropagation(); handleDelete(org); }} style={{ ...S.btn, height: 24, padding: '0 8px', fontSize: 10.5, color: 'var(--gv-bad)', borderColor: 'var(--gv-bad-wash)' }}>
                    Del
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right: members panel */}
        <div style={S.card}>
          {!selected ? (
            <div style={{ padding: 32, textAlign: 'center' as const, color: 'var(--gv-ink-3)' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🏢</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--gv-ink-2)' }}>Select an organisation</div>
              <div style={{ fontSize: 12.5, marginTop: 4 }}>Click any group on the left to view and manage its members.</div>
            </div>
          ) : (
            <>
              <div style={S.panelH}>
                <div>
                  <span style={S.panelHt}>{selected.name}</span>
                  <span style={{ fontSize: 11, color: 'var(--gv-ink-3)', marginLeft: 8 }}>{members.length} members</span>
                </div>
                {isSuperAdmin && nonMembers.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <UserCombobox users={nonMembers} value={addUserId} onChange={setAddUserId} />
                    <button style={S.btnPri} onClick={handleAddMember} disabled={!addUserId}>Add</button>
                  </div>
                )}
              </div>

              {error && (
                <div style={{ margin: '10px 16px 0', padding: '9px 12px', borderRadius: 8, background: 'var(--gv-bad-wash)', color: 'var(--gv-bad)', fontSize: 12.5, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  {error}
                  <button onClick={() => setError(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--gv-bad)', fontSize: 14, lineHeight: 1, padding: '0 2px' }}>✕</button>
                </div>
              )}

              <table style={S.table}>
                <thead>
                  <tr>
                    <th style={S.th}>Member</th>
                    <th style={S.th}>Email</th>
                    {isSuperAdmin && <th style={S.th}></th>}
                  </tr>
                </thead>
                <tbody>
                  {membersLoading && <tr><td style={{ ...S.td, color: 'var(--gv-ink-3)' }} colSpan={3}>Loading…</td></tr>}
                  {!membersLoading && members.length === 0 && <tr><td style={{ ...S.td, color: 'var(--gv-ink-3)' }} colSpan={3}>No members yet.</td></tr>}
                  {members.map(m => (
                    <tr key={m.id}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--gv-bg)')}
                      onMouseLeave={e => (e.currentTarget.style.background = '')}
                    >
                      <td style={S.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,var(--gv-brand-2),var(--gv-brand))', display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 700, fontSize: 11, flexShrink: 0 }}>
                            {(m.firstName?.[0] ?? m.username[0]).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 13 }}>{m.firstName} {m.lastName}</div>
                            <div style={{ fontSize: 11, color: 'var(--gv-ink-3)' }}>@{m.username}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ ...S.td, color: 'var(--gv-ink-2)' }}>{m.email}</td>
                      {isSuperAdmin && (
                        <td style={S.td}>
                          <button style={{ ...S.btn, color: 'var(--gv-bad)', borderColor: 'var(--gv-bad-wash)' }} onClick={() => handleRemoveMember(m.id)}>
                            Remove
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>

      {showCreate && (
        <div style={S.overlay} onClick={e => { if (e.target === e.currentTarget) { setShowCreate(false); setNewOrgName(''); } }}>
          <div style={S.modal}>
            <div style={S.mHead}>
              <span style={S.mTitle}>New Organisation</span>
              <button style={{ border: 0, background: 'none', cursor: 'pointer', color: 'var(--gv-ink-3)', fontSize: 18 }} onClick={() => { setShowCreate(false); setNewOrgName(''); }}>✕</button>
            </div>
            <div style={S.mBody}>
              <div style={S.field}>
                <label style={S.label}>Organisation Name</label>
                <input style={S.input} value={newOrgName} onChange={e => setNewOrgName(e.target.value)} placeholder="e.g. Sizzle House Group" autoFocus onKeyDown={e => e.key === 'Enter' && handleCreate()} />
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--gv-ink-3)' }}>This creates a top-level Keycloak group. Sub-groups (locations, departments) can be added later.</div>
            </div>
            <div style={S.mFoot}>
              <button style={S.btn} onClick={() => { setShowCreate(false); setNewOrgName(''); }}>Cancel</button>
              <button style={S.btnPri} onClick={handleCreate} disabled={saving || !newOrgName.trim()}>{saving ? 'Creating…' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}
      {confirmDelete && (
        <ConfirmModal
          title={`Delete "${confirmDelete.name}"?`}
          message="This removes the Keycloak group but does not delete its members."
          confirmLabel="Delete Organisation"
          onConfirm={confirmDeleteOrg}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </Layout>
  );
}

function UserCombobox({ users, value, onChange }: {
  users: KcUser[];
  value: string;
  onChange: (id: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = users.find(u => u.id === value);

  const filtered = query.trim()
    ? users.filter(u =>
        u.username.toLowerCase().includes(query.toLowerCase()) ||
        u.email?.toLowerCase().includes(query.toLowerCase())
      )
    : users;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function pick(u: KcUser) {
    onChange(u.id);
    setQuery('');
    setOpen(false);
  }

  function clear() {
    onChange('');
    setQuery('');
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', height: 32, border: '1px solid var(--gv-line)', borderRadius: 9, background: 'var(--gv-bg)', overflow: 'hidden', minWidth: 220 }}>
        <input
          value={open || !selected ? query : `@${selected.username}`}
          onChange={e => { setQuery(e.target.value); onChange(''); setOpen(true); }}
          onFocus={() => { setQuery(''); setOpen(true); }}
          placeholder="Search user…"
          style={{ flex: 1, height: '100%', border: 'none', background: 'transparent', padding: '0 10px', fontSize: 12, color: 'var(--gv-ink)', outline: 'none' }}
        />
        {value && (
          <button onClick={clear} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--gv-ink-3)', padding: '0 8px', fontSize: 14, lineHeight: 1 }}>✕</button>
        )}
      </div>

      {open && (
        <div style={{ position: 'absolute', top: 36, right: 0, minWidth: 260, maxHeight: 220, overflowY: 'auto', background: '#fff', border: '1px solid var(--gv-line)', borderRadius: 10, boxShadow: 'var(--gv-shadow-lg)', zIndex: 50 }}>
          {filtered.length === 0 && (
            <div style={{ padding: '10px 14px', fontSize: 12, color: 'var(--gv-ink-3)' }}>No users found.</div>
          )}
          {filtered.map(u => (
            <div
              key={u.id}
              onMouseDown={() => pick(u)}
              style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 12px', cursor: 'pointer', transition: 'background .1s' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--gv-bg)')}
              onMouseLeave={e => (e.currentTarget.style.background = '')}
            >
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg,var(--gv-brand-2),var(--gv-brand))', display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 700, fontSize: 10, flexShrink: 0 }}>
                {(u.firstName?.[0] ?? u.username[0]).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--gv-ink)' }}>
                  {u.firstName} {u.lastName}
                  <span style={{ fontWeight: 400, color: 'var(--gv-ink-3)', marginLeft: 5 }}>@{u.username}</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--gv-ink-3)' }}>{u.email}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
