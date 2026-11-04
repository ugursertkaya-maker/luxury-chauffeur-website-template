'use client'
import { useEffect, useState } from 'react'

type User = { id: string; username: string; role: string; created_at: string }

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'admin' | 'dispatcher'>('dispatcher')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    const r = await fetch('/api/admin/users')
    setUsers(await r.json())
  }

  useEffect(() => { load() }, [])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const r = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, role }),
    })
    if (r.ok) {
      setUsername(''); setPassword(''); setRole('dispatcher')
      load()
    } else {
      const d = await r.json()
      setError(d.error || 'Error')
    }
    setLoading(false)
  }

  async function handleDelete(id: string, uname: string) {
    if (!confirm(`Remove "${uname}"?`)) return
    await fetch('/api/admin/users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    load()
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold text-slate-900 mb-6">Team Members</h1>

      {/* User list */}
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden mb-8">
        {users.length === 0 ? (
          <p className="text-sm text-slate-400 p-6">No users yet.</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3">Username</th>
                <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3">Role</th>
                <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3">Added</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-5 py-3 text-sm font-medium text-slate-800">{u.username}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      u.role === 'admin'
                        ? 'bg-[#2b353d] text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {u.role === 'admin' ? 'Admin' : 'Dispatcher'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-500">
                    {new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => handleDelete(u.id, u.username)}
                      className="text-xs text-red-400 hover:text-red-600 transition-colors"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add user form */}
      <div className="bg-white rounded-xl border border-slate-100 p-6">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Add Team Member</h2>
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2b353d]"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2b353d]"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Role</label>
            <div className="flex gap-3">
              {(['dispatcher', 'admin'] as const).map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    role === r
                      ? 'bg-[#2b353d] text-white border-[#2b353d]'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {r === 'admin' ? 'Admin' : 'Dispatcher'}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-slate-500">
              {role === 'dispatcher' ? 'Dispatcher can only view and manage bookings.' : 'Admin has full access to all panels.'}
            </p>
          </div>

          {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="bg-[#2b353d] text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-[#1e262c] transition-colors disabled:opacity-50"
          >
            {loading ? 'Adding...' : 'Add Member'}
          </button>
        </form>
      </div>
    </div>
  )
}
