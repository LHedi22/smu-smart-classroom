import { useState, useEffect } from 'react'
import { ref, get, set, remove, update } from 'firebase/database'
import { db } from '../../firebase'

const EMPTY = { name: '', email: '', department: '', phone: '', rooms: '', moodleUserId: '' }

export default function AdminProfessors() {
  const [professors, setProfessors] = useState([])
  const [pending,    setPending]    = useState([])
  const [form,       setForm]       = useState(EMPTY)
  const [saving,     setSaving]     = useState(false)
  const [editingUid, setEditingUid] = useState(null)
  const [editMoodleId, setEditMoodleId] = useState('')

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

    const moodleId = form.moodleUserId ? Number(form.moodleUserId) : null

    await set(ref(db, `pendingProfessors/${emailKey}`), {
      name:          form.name,
      email:         form.email,
      department:    form.department,
      phone:         form.phone,
      moodleUserId:  moodleId,
      assignedRooms: rooms,
    })
    setForm(EMPTY)
    setSaving(false)
    await load()
  }

  async function saveMoodleId(uid) {
    const parsed = editMoodleId ? Number(editMoodleId) : null
    await update(ref(db, `professors/${uid}`), { moodleUserId: parsed })
    setEditingUid(null)
    setEditMoodleId('')
    await load()
  }

  async function deleteProfessor(uid) {
    if (!window.confirm('Remove this professor? They will lose dashboard access.')) return

    const coursesSnap = await get(ref(db, 'courses'))
    const updates = {}
    if (coursesSnap.exists()) {
      Object.entries(coursesSnap.val()).forEach(([courseId, course]) => {
        if (course.professorUid === uid) {
          updates[`courses/${courseId}/professorUid`] = null
          updates[`courses/${courseId}/professorId`]  = null
          updates[`courses/${courseId}/room`]         = null
        }
      })
    }
    updates[`professors/${uid}`] = null

    await update(ref(db), updates)
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
          <input className={`${inputCls} col-span-2`} placeholder="Full name"               value={form.name}         onChange={e => setForm({ ...form, name: e.target.value })}         required />
          <input className={inputCls}                 placeholder="Email (@smu.tn)" type="email" value={form.email}   onChange={e => setForm({ ...form, email: e.target.value })}        required />
          <input className={inputCls}                 placeholder="Department"              value={form.department}   onChange={e => setForm({ ...form, department: e.target.value })}   required />
          <input className={inputCls}                 placeholder="Phone (optional)"        value={form.phone}        onChange={e => setForm({ ...form, phone: e.target.value })} />
          <input className={inputCls}                 placeholder="Rooms: B204, A101"       value={form.rooms}        onChange={e => setForm({ ...form, rooms: e.target.value })} />
          <input className={`${inputCls} col-span-2`} placeholder="Moodle User ID (e.g. 12)" type="number" min="1"
                 value={form.moodleUserId} onChange={e => setForm({ ...form, moodleUserId: e.target.value })} />
          <button type="submit" disabled={saving} className="btn-primary col-span-2">
            {saving ? 'Saving…' : 'Create Professor Account'}
          </button>
        </form>
        <p className="text-xs text-slate-600 mt-2">
          Moodle User ID links the professor to schedule &amp; course data from the Flask API.
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
                  <p className="text-xs text-slate-600 mt-0.5">Moodle ID: {p.moodleUserId ?? <span className="text-amber-400">not set</span>}</p>
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
            <div key={p.uid} className="card flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-200">{p.name}</p>
                <p className="text-xs text-slate-500">{p.email} · {p.department}</p>
                <p className="text-xs text-slate-600 mt-0.5">
                  Rooms: {p.assignedRooms ? Object.keys(p.assignedRooms).join(', ') : 'none'}
                </p>
                {editingUid === p.uid ? (
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="number" min="1"
                      className="w-28 bg-surface-deep border border-brand/40 rounded px-2 py-0.5 text-xs text-slate-200 outline-none"
                      placeholder="Moodle ID"
                      value={editMoodleId}
                      onChange={e => setEditMoodleId(e.target.value)}
                      autoFocus
                    />
                    <button onClick={() => saveMoodleId(p.uid)} className="text-xs text-brand hover:text-brand/80">Save</button>
                    <button onClick={() => setEditingUid(null)} className="text-xs text-slate-500 hover:text-slate-400">Cancel</button>
                  </div>
                ) : (
                  <p className="text-xs mt-0.5">
                    <span className={p.moodleUserId ? 'text-slate-600' : 'text-amber-500'}>
                      Moodle ID: {p.moodleUserId ?? 'not set'}
                    </span>
                    <button
                      onClick={() => { setEditingUid(p.uid); setEditMoodleId(p.moodleUserId ?? '') }}
                      className="ml-2 text-brand/70 hover:text-brand text-xs"
                    >
                      edit
                    </button>
                  </p>
                )}
              </div>
              <button onClick={() => deleteProfessor(p.uid)} className="flex-shrink-0 text-xs text-red-400 hover:text-red-300">
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
