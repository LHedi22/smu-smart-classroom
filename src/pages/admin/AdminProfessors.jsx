import { useState, useEffect } from 'react'
import { ref, get, set, remove, update } from 'firebase/database'
import { db } from '../../firebase'

const EMPTY = { name: '', email: '', department: '', phone: '', rooms: '', moodleUserId: '' }

export default function AdminProfessors() {
  const [professors, setProfessors] = useState([])
  const [pending,    setPending]    = useState([])
  const [form,       setForm]       = useState(EMPTY)
  const [saving,     setSaving]     = useState(false)
  const [editingMoodleId, setEditingMoodleId] = useState({}) // uid → string value being edited

  async function load() {
    const [profSnap, pendSnap] = await Promise.all([
      get(ref(db, 'professors')),
      get(ref(db, 'pendingProfessors')),
    ])
    setProfessors(profSnap.val() ? Object.entries(profSnap.val()).map(([uid, v]) => ({ uid, ...v })) : [])
    setPending(pendSnap.val()    ? Object.entries(pendSnap.val()).map(([key, v]) => ({ key, ...v })) : [])
  }

  useEffect(() => { load() }, [])

  async function createProfessor(e) {
    e.preventDefault()
    setSaving(true)
    const emailKey = form.email.replace(/\./g, '_').replace(/@/g, '_at_')
    const rooms = {}
    form.rooms.split(',').map(r => r.trim()).filter(Boolean).forEach(r => { rooms[r] = true })

    await set(ref(db, `pendingProfessors/${emailKey}`), {
      name:          form.name,
      email:         form.email,
      department:    form.department,
      phone:         form.phone,
      assignedRooms: rooms,
      moodleUserId:  form.moodleUserId ? Number(form.moodleUserId) : null,
    })
    setForm(EMPTY)
    setSaving(false)
    await load()
  }

  async function saveMoodleId(uid, value) {
    const parsed = value ? Number(value) : null
    await update(ref(db, `professors/${uid}`), { moodleUserId: parsed })
    setEditingMoodleId(prev => { const n = { ...prev }; delete n[uid]; return n })
    await load()
  }

  async function deleteProfessor(uid) {
    if (!window.confirm('Remove this professor? They will lose dashboard access.')) return
    await remove(ref(db, `professors/${uid}`))
    await load()
  }

  async function deletePending(key) {
    if (!window.confirm('Cancel this invitation?')) return
    await remove(ref(db, `pendingProfessors/${key}`))
    await load()
  }

  const inputCls = 'bg-surface-raised border border-surface-border rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/30'

  return (
    <div className="max-w-3xl space-y-8">
      {/* Add professor */}
      <div>
        <h2 className="text-base font-semibold text-slate-100 mb-4">Add Professor</h2>
        <form onSubmit={createProfessor} className="grid grid-cols-2 gap-3">
          <input className={`${inputCls} col-span-2`} placeholder="Full name"                        value={form.name}       onChange={e => setForm({ ...form, name: e.target.value })}       required />
          <input className={inputCls}                 placeholder="Email (@smu.tn)"  type="email"    value={form.email}      onChange={e => setForm({ ...form, email: e.target.value })}      required />
          <input className={inputCls}                 placeholder="Department"                       value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} required />
          <input className={inputCls}                 placeholder="Phone (optional)"                 value={form.phone}      onChange={e => setForm({ ...form, phone: e.target.value })} />
          <input className={inputCls}                 placeholder="Rooms: B204, A101"                value={form.rooms}      onChange={e => setForm({ ...form, rooms: e.target.value })} />
          <input className={`${inputCls} col-span-2`} placeholder="Moodle User ID (number, required for history)" type="number" value={form.moodleUserId} onChange={e => setForm({ ...form, moodleUserId: e.target.value })} />
          <button type="submit" disabled={saving} className="btn-primary col-span-2">
            {saving ? 'Saving…' : 'Create Professor Account'}
          </button>
        </form>
        <p className="text-xs text-slate-600 mt-2">
          The professor can log in once they use the magic link with the email above.
        </p>
      </div>

      {/* Pending */}
      {pending.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-slate-100 mb-3">
            Pending <span className="text-sm font-normal text-slate-500">(not yet logged in)</span>
          </h2>
          <div className="space-y-2">
            {pending.map(p => (
              <div key={p.key} className="card flex items-center justify-between border-amber-500/20 bg-amber-500/5">
                <div>
                  <p className="text-sm font-medium text-slate-200">{p.name}</p>
                  <p className="text-xs text-slate-500">{p.email} · {p.department}</p>
                </div>
                <button onClick={() => deletePending(p.key)} className="text-xs text-red-400 hover:text-red-300">
                  Cancel
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active */}
      <div>
        <h2 className="text-base font-semibold text-slate-100 mb-3">Active Professors</h2>
        {professors.length === 0 && <p className="text-sm text-slate-500">No active professors yet.</p>}
        <div className="space-y-2">
          {professors.map(p => (
            <div key={p.uid} className="card flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-200">{p.name}</p>
                <p className="text-xs text-slate-500">{p.email} · {p.department}</p>
                <p className="text-xs text-slate-600 mt-0.5">
                  Rooms: {p.assignedRooms ? Object.keys(p.assignedRooms).join(', ') : 'none'}
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  {editingMoodleId[p.uid] !== undefined ? (
                    <>
                      <input
                        type="number"
                        className="bg-surface-deep border border-brand/40 rounded px-2 py-0.5 text-xs text-slate-200 w-28 outline-none focus:border-brand/70"
                        value={editingMoodleId[p.uid]}
                        onChange={e => setEditingMoodleId(prev => ({ ...prev, [p.uid]: e.target.value }))}
                        placeholder="Moodle ID"
                        autoFocus
                      />
                      <button onClick={() => saveMoodleId(p.uid, editingMoodleId[p.uid])} className="text-xs text-emerald-400 hover:text-emerald-300">Save</button>
                      <button onClick={() => setEditingMoodleId(prev => { const n = { ...prev }; delete n[p.uid]; return n })} className="text-xs text-slate-500 hover:text-slate-400">Cancel</button>
                    </>
                  ) : (
                    <button
                      onClick={() => setEditingMoodleId(prev => ({ ...prev, [p.uid]: p.moodleUserId ?? '' }))}
                      className={`text-xs ${p.moodleUserId ? 'text-slate-500 hover:text-slate-400' : 'text-amber-400 hover:text-amber-300'}`}
                    >
                      {p.moodleUserId ? `Moodle ID: ${p.moodleUserId}` : '⚠ Set Moodle ID (required for history)'}
                    </button>
                  )}
                </div>
              </div>
              <button onClick={() => deleteProfessor(p.uid)} className="text-xs text-red-400 hover:text-red-300 ml-3 flex-shrink-0">
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
