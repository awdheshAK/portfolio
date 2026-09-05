'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Search } from 'lucide-react';
import Button from '@/components/ui/Button';
import { formatRelativeDate, cx } from '@/lib/utils';

interface AdminUser {
  id: string;
  name: string;
  username: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  _count: { videos: number };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [q, setQ] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const limit = 25;

  function load() {
    setLoading(true);
    const sp = new URLSearchParams();
    if (q) sp.set('q', q);
    sp.set('page', String(page));
    fetch(`/api/admin/users?${sp.toString()}`)
      .then((r) => r.json())
      .then((d) => {
        setUsers(d.users);
        setTotal(d.total);
      })
      .finally(() => setLoading(false));
  }

  useEffect(load, [page]);

  async function updateStatus(id: string, status: string) {
    const reason = status !== 'ACTIVE' ? prompt('Reason (shown to the user):') ?? undefined : undefined;
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, reason }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? 'Could not update user.');
      return;
    }
    toast.success('User updated');
    load();
  }

  async function updateRole(id: string, role: string) {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    if (res.ok) {
      toast.success('Role updated');
      load();
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Users</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          load();
        }}
        className="mb-4 flex items-center gap-2"
      >
        <div className="flex items-center rounded-lg border border-surface-200 dark:border-surface-800 px-3 py-1.5">
          <Search size={14} className="text-surface-400 mr-2" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, email, username…"
            className="bg-transparent text-sm outline-none w-64"
          />
        </div>
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-surface-200 dark:border-surface-800">
        <table className="w-full text-sm">
          <thead className="bg-surface-50 dark:bg-surface-900 text-left text-xs uppercase text-surface-400">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Videos</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
            {!loading &&
              users.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium">{u.name}</p>
                    <p className="text-xs text-surface-400">{u.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={u.role}
                      onChange={(e) => updateRole(u.id, e.target.value)}
                      className="rounded border border-surface-200 dark:border-surface-800 bg-transparent px-2 py-1 text-xs"
                    >
                      <option value="USER">USER</option>
                      <option value="CREATOR">CREATOR</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cx(
                        'rounded-full px-2 py-1 text-xs font-medium',
                        u.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
                      )}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">{u._count.videos}</td>
                  <td className="px-4 py-3 text-surface-500">{formatRelativeDate(u.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      {u.status === 'ACTIVE' ? (
                        <>
                          <Button variant="secondary" onClick={() => updateStatus(u.id, 'SUSPENDED')}>
                            Suspend
                          </Button>
                          <Button variant="danger" onClick={() => updateStatus(u.id, 'BANNED')}>
                            Ban
                          </Button>
                        </>
                      ) : (
                        <Button variant="secondary" onClick={() => updateStatus(u.id, 'ACTIVE')}>
                          Reinstate
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
        {loading && <p className="p-4 text-sm text-surface-400">Loading…</p>}
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-surface-500">
        <span>
          Page {page} of {Math.max(1, Math.ceil(total / limit))} ({total} users)
        </span>
        <div className="flex gap-2">
          <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            Previous
          </Button>
          <Button variant="secondary" disabled={page * limit >= total} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
