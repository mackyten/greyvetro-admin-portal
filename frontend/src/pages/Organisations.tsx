import { useEffect, useState, useCallback, useRef } from 'react';
import apiClient from '../api/client';
import Layout from '../components/Layout';
import ConfirmModal from '../components/ConfirmModal';
import { useAuth } from '../auth/useAuth';
import { Button, Avatar, Modal, ModalHead, ModalBody, ModalFoot, ErrorBanner, EmptyState, PageHeader, SearchInput } from '../components/ui';

interface KcGroup { id: string; name: string; path: string; subGroups?: KcGroup[]; }
interface KcUser  { id: string; username: string; email: string; firstName: string; lastName: string; }

export default function Organisations() {
  const { hasRole } = useAuth();
  const isSuperAdmin = hasRole('SuperAdmin');

  const [orgs, setOrgs]               = useState<KcGroup[]>([]);
  const [selected, setSelected]       = useState<KcGroup | null>(null);
  const [members, setMembers]         = useState<KcUser[]>([]);
  const [allUsers, setAllUsers]       = useState<KcUser[]>([]);
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({});
  const [loading, setLoading]         = useState(true);
  const [membersLoading, setMembersLoading] = useState(false);
  const [showCreate, setShowCreate]   = useState(false);
  const [newOrgName, setNewOrgName]   = useState('');
  const [saving, setSaving]           = useState(false);
  const [addUserId, setAddUserId]     = useState('');
  const [error, setError]             = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<KcGroup | null>(null);
  const [menuOpenId, setMenuOpenId]   = useState<string | null>(null);
  const [orgSearch, setOrgSearch]     = useState('');
  const [orgSort, setOrgSort]         = useState<'az' | 'za' | 'most' | 'least'>('az');
  const menuRef = useRef<HTMLDivElement>(null);

  const loadOrgs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<KcGroup[]>('/api/organisations');
      const orgsData = res.data;
      setOrgs(orgsData);
      const counts = await Promise.all(
        orgsData.map(async org => {
          try {
            const r = await apiClient.get<KcUser[]>(`/api/organisations/${org.id}/members`);
            return [org.id, r.data.length] as [string, number];
          } catch { return [org.id, 0] as [string, number]; }
        })
      );
      setMemberCounts(Object.fromEntries(counts));
      return orgsData;
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
      setMemberCounts(prev => ({ ...prev, [org.id]: membersRes.data.length }));
      setAllUsers(usersRes.data);
    } finally { setMembersLoading(false); }
  }, []);

  useEffect(() => {
    loadOrgs().then(orgsData => {
      if (orgsData && orgsData.length > 0) setSelected(orgsData[0]);
    });
  }, [loadOrgs]);

  useEffect(() => {
    setError(null);
    if (selected) loadMembers(selected);
    else { setMembers([]); setAllUsers([]); }
  }, [selected, loadMembers]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpenId(null);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function handleCreate() {
    if (!newOrgName.trim()) return;
    setSaving(true);
    try {
      await apiClient.post('/api/organisations', { name: newOrgName.trim() });
      setShowCreate(false);
      setNewOrgName('');
      const orgsData = await loadOrgs();
      if (orgsData && !selected) setSelected(orgsData[0]);
    } finally { setSaving(false); }
  }

  async function confirmDeleteOrg() {
    if (!confirmDelete) return;
    try {
      await apiClient.delete(`/api/organisations/${confirmDelete.id}`);
      const wasSelected = selected?.id === confirmDelete.id;
      setConfirmDelete(null);
      const orgsData = await loadOrgs();
      if (wasSelected) setSelected(orgsData && orgsData.length > 0 ? orgsData[0] : null);
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
    } catch { setError('Failed to add member. Please try again.'); }
  }

  async function handleRemoveMember(userId: string) {
    if (!selected) return;
    try {
      await apiClient.delete(`/api/organisations/${selected.id}/members/${userId}`);
      await loadMembers(selected);
    } catch { setError('Failed to remove member. Please try again.'); }
  }

  const nonMembers = allUsers.filter(u => !members.some(m => m.id === u.id));

  const visibleOrgs = orgs
    .filter(o => o.name.toLowerCase().includes(orgSearch.toLowerCase()))
    .sort((a, b) => {
      if (orgSort === 'az')   return a.name.localeCompare(b.name);
      if (orgSort === 'za')   return b.name.localeCompare(a.name);
      if (orgSort === 'most') return (memberCounts[b.id] ?? 0) - (memberCounts[a.id] ?? 0);
      return (memberCounts[a.id] ?? 0) - (memberCounts[b.id] ?? 0);
    });

  return (
    <Layout>
      <PageHeader
        title="Organisations"
        sub={`${orgs.length} top-level groups in the greyvetro realm`}
        action={isSuperAdmin ? (
          <Button variant="primary" onClick={() => setShowCreate(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} width={12} height={12}><path d="M12 5v14M5 12h14" strokeLinecap="round"/></svg>
            New Organisation
          </Button>
        ) : undefined}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16, alignItems: 'stretch', minHeight: 'calc(100vh - 120px)' }}>
        {/* Left: org list */}
        <div className="gv-card-open">
          <div style={{ padding: '12px 14px 8px', borderBottom: '1px solid var(--gv-line-soft)' }}>
            <div className="gv-row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
              <span className="gv-panel-title">All Organisations</span>
              <span className="gv-dim" style={{ fontSize: 11.5 }}>{orgs.length} total</span>
            </div>
            <SearchInput
              value={orgSearch}
              onChange={setOrgSearch}
              placeholder="Search organisations…"
              style={{ marginBottom: 6 }}
            />
            <div style={{ display: 'flex', gap: 4 }}>
              {(['az','za','most','least'] as const).map(val => (
                <button
                  key={val}
                  className={`gv-sort-chip${orgSort === val ? ' active' : ''}`}
                  onClick={() => setOrgSort(val)}
                >
                  {val === 'az' ? 'A–Z' : val === 'za' ? 'Z–A' : val === 'most' ? 'Most' : 'Fewest'}
                </button>
              ))}
            </div>
          </div>
          <div style={{ padding: '6px 0' }}>
            {loading && <div className="gv-td gv-dim" style={{ padding: '12px 16px' }}>Loading…</div>}
            {!loading && orgs.length === 0 && <div className="gv-dim" style={{ padding: '12px 16px', fontSize: 13 }}>No organisations yet.</div>}
            {!loading && orgs.length > 0 && visibleOrgs.length === 0 && <div className="gv-dim" style={{ padding: '12px 16px', fontSize: 13 }}>No matches for "{orgSearch}".</div>}
            {visibleOrgs.map(org => {
              const isActive   = selected?.id === org.id;
              const isMenuOpen = menuOpenId === org.id;
              const count = memberCounts[org.id] ?? 0;

              return (
                <div
                  key={org.id}
                  className={`gv-org-item${isActive ? ' active' : ''}`}
                  onClick={() => { setSelected(org); setMenuOpenId(null); }}
                >
                  <Avatar
                    name={org.name}
                    size="sm"
                    shape="rounded"
                    style={{ background: isActive ? 'var(--gv-brand)' : 'var(--gv-brand-grad)', fontWeight: 800 }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="gv-org-item-name">{org.name}</div>
                    <div className="gv-org-item-count">{count} {count === 1 ? 'member' : 'members'}</div>
                  </div>

                  {isSuperAdmin && (
                    <div ref={isMenuOpen ? menuRef : undefined} style={{ position: 'relative', flexShrink: 0 }}>
                      <button
                        className={`gv-btn-icon${isMenuOpen ? ' active' : ''}`}
                        style={{ fontSize: 14, letterSpacing: 1 }}
                        onClick={e => { e.stopPropagation(); setMenuOpenId(isMenuOpen ? null : org.id); }}
                      >
                        ···
                      </button>
                      {isMenuOpen && (
                        <div style={{ position: 'absolute', top: 30, right: 0, background: '#fff', border: '1px solid var(--gv-line)', borderRadius: 10, boxShadow: 'var(--gv-shadow-lg)', zIndex: 50, minWidth: 160, overflow: 'hidden' }}>
                          <button
                            className="gv-btn-ghost-danger"
                            style={{ width: '100%', padding: '9px 14px', borderRadius: 0, border: 'none', justifyContent: 'flex-start', gap: 8 }}
                            onClick={e => { e.stopPropagation(); setMenuOpenId(null); setConfirmDelete(org); }}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={13} height={13}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                            Delete organisation
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: members panel */}
        <div className="gv-card">
          {!selected ? (
            <EmptyState
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--gv-brand)" strokeWidth={1.8} width={22} height={22}>
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              }
              title="No organisation selected"
              message="Select an organisation on the left to view and manage its members."
            />
          ) : (
            <>
              <div className="gv-panel-header">
                <div>
                  <span className="gv-panel-title">{selected.name}</span>
                  <span className="gv-dim" style={{ fontSize: 11, marginLeft: 8 }}>
                    {members.length} {members.length === 1 ? 'member' : 'members'}
                  </span>
                </div>
                {isSuperAdmin && nonMembers.length > 0 && (
                  <div className="gv-row">
                    <UserCombobox users={nonMembers} value={addUserId} onChange={setAddUserId} />
                    <Button variant="primary" size="sm" onClick={handleAddMember} disabled={!addUserId}>Add</Button>
                  </div>
                )}
              </div>

              {error && <ErrorBanner message={error} onDismiss={() => setError(null)} style={{ margin: '10px 16px 0' }} />}

              <table className="gv-table">
                <thead>
                  <tr>
                    <th className="gv-th">Member</th>
                    <th className="gv-th">Email</th>
                    {isSuperAdmin && <th className="gv-th"></th>}
                  </tr>
                </thead>
                <tbody>
                  {membersLoading && <tr><td className="gv-td gv-dim" colSpan={3}>Loading…</td></tr>}
                  {!membersLoading && members.length === 0 && (
                    <tr><td className="gv-td gv-dim" colSpan={3}>No members yet. Add one above.</td></tr>
                  )}
                  {members.map(m => (
                    <tr key={m.id} className="gv-tr">
                      <td className="gv-td">
                        <div className="gv-row">
                          <Avatar name={m.firstName || m.username} size="sm" shape="circle" />
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 13 }}>{m.firstName} {m.lastName}</div>
                            <div className="gv-dim" style={{ fontSize: 11 }}>@{m.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="gv-td gv-muted">{m.email}</td>
                      {isSuperAdmin && (
                        <td className="gv-td">
                          <Button variant="ghost-danger" size="sm" onClick={() => handleRemoveMember(m.id)}>Remove</Button>
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
        <Modal size="sm" onClose={() => { setShowCreate(false); setNewOrgName(''); }}>
          <ModalHead title="New Organisation" onClose={() => { setShowCreate(false); setNewOrgName(''); }} />
          <ModalBody>
            <div className="gv-field">
              <label className="gv-label">Organisation Name</label>
              <input
                className="gv-input"
                value={newOrgName}
                onChange={e => setNewOrgName(e.target.value)}
                placeholder="e.g. Sizzle House Group"
                autoFocus
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
              />
            </div>
            <p className="gv-dim" style={{ fontSize: 11.5, marginTop: 0 }}>
              This creates a top-level Keycloak group. Sub-groups can be added later.
            </p>
          </ModalBody>
          <ModalFoot>
            <Button variant="secondary" onClick={() => { setShowCreate(false); setNewOrgName(''); }}>Cancel</Button>
            <Button variant="primary" onClick={handleCreate} disabled={saving || !newOrgName.trim()}>
              {saving ? 'Creating…' : 'Create'}
            </Button>
          </ModalFoot>
        </Modal>
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

  const selectedUser = users.find(u => u.id === value);
  const filtered = query.trim()
    ? users.filter(u => u.username.toLowerCase().includes(query.toLowerCase()) || u.email?.toLowerCase().includes(query.toLowerCase()))
    : users;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function pick(u: KcUser) { onChange(u.id); setQuery(''); setOpen(false); }
  function clear()         { onChange(''); setQuery(''); }

  return (
    <div ref={ref} className="gv-combobox">
      <div className="gv-combobox-trigger">
        <input
          className="gv-combobox-input"
          value={open || !selectedUser ? query : `@${selectedUser.username}`}
          onChange={e => { setQuery(e.target.value); onChange(''); setOpen(true); }}
          onFocus={() => { setQuery(''); setOpen(true); }}
          placeholder="Search user…"
        />
        {value && <button className="gv-combobox-clear" onClick={clear}>✕</button>}
      </div>

      {open && (
        <div className="gv-combobox-dropdown">
          {filtered.length === 0 && <div className="gv-combobox-empty">No users found.</div>}
          {filtered.map(u => (
            <div key={u.id} className="gv-combobox-item" onMouseDown={() => pick(u)}>
              <Avatar name={u.firstName || u.username} size="xs" shape="circle" />
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--gv-ink)' }}>
                  {u.firstName} {u.lastName}
                  <span className="gv-dim" style={{ fontWeight: 400, marginLeft: 5 }}>@{u.username}</span>
                </div>
                <div className="gv-dim" style={{ fontSize: 11 }}>{u.email}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
