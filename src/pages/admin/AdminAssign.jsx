import { useState, useEffect, useCallback } from 'react'
import { ref, get, onValue } from 'firebase/database'
import { db } from '../../firebase'
import { assignCourseToProf, unassignCourseFromProf } from '../../utils/transactionHelpers'

export default function AdminAssign() {
  const [professors, setProfessors] = useState([])
  const [courses,    setCourses]    = useState([])
  const [selected,   setSelected]   = useState({ profUid: '', profMoodleId: '', courseId: '', room: '' })
  const [saving,     setSaving]     = useState(false)
  const [message,    setMessage]    = useState('')
  const [error,      setError]      = useState('')

  const loadData = useCallback(async () => {
    const [ps, cs] = await Promise.all([get(ref(db, 'professors')), get(ref(db, 'courses'))])
    setProfessors(ps.val() ? Object.entries(ps.val()).map(([uid, v]) => ({ uid, ...v })) : [])
    setCourses(cs.val() ? Object.entries(cs.val()).map(([id, v]) => ({ id, ...v })) : [])
  }, [])

  useEffect(() => {
    const unsubProfs = onValue(ref(db, 'professors'), snap => {
      setProfessors(snap.val() ? Object.entries(snap.val()).map(([uid, v]) => ({ uid, ...v })) : [])
    })
    const unsubCourses = onValue(ref(db, 'courses'), snap => {
      setCourses(snap.val() ? Object.entries(snap.val()).map(([id, v]) => ({ id, ...v })) : [])
    })
    return () => {
      unsubProfs()
      unsubCourses()
    }
  }, [])

  async function assign(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')

    try {
      const { profUid, profMoodleId, courseId, room } = selected
      
      // Use transaction for atomic assignment
      await assignCourseToProf(courseId, profUid, profMoodleId, room)
      setMessage('✅ Course assigned successfully.')
      setSelected({ profUid: '', profMoodleId: '', courseId: '', room: '' })
      await loadData()
    } catch (err) {
      setError(`❌ Assignment failed: ${err.message}`)
      console.error('Assignment error:', err)
    } finally {
      setSaving(false)
      setTimeout(() => {
        setMessage('')
        setError('')
      }, 4000)
    }
  }

  async function unassign(courseId, profUid) {
    if (!window.confirm('Unassign this course?')) return

    try {
      await unassignCourseFromProf(courseId, profUid)
      setMessage('✅ Course unassigned successfully.')
      await loadData()
    } catch (err) {
      setError(`❌ Unassignment failed: ${err.message}`)
    } finally {
      setTimeout(() => {
        setMessage('')
        setError('')
      }, 4000)
    }
  }

  const inputCls = 'w-full bg-surface-raised border border-surface-border rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/30'

  return (
    <div className="max-w-xl space-y-6">
      <h2 className="text-base font-semibold text-slate-100">Assign Course to Professor</h2>
      <form onSubmit={assign} className="space-y-3">
        <select className={inputCls} value={selected.profUid} onChange={e => {
          const prof = professors.find(p => p.uid === e.target.value)
          setSelected({ ...selected, profUid: e.target.value, profMoodleId: prof?.moodleUserId || '' })
        }} required>
          <option value="">Select professor</option>
          {professors.map(p => (
            <option key={p.uid} value={p.uid}>{p.name} — {p.email}</option>
          ))}
        </select>
        <select className={inputCls} value={selected.courseId} onChange={e => setSelected({ ...selected, courseId: e.target.value })} required>
          <option value="">Select course</option>
          {courses.map(c => (
            <option key={c.id} value={c.id}>
              {c.code} — {c.name} ({c.semester})
              {c.professorUid ? ` [Assigned to ${professors.find(p => p.uid === c.professorUid)?.name || 'Unknown'}]` : ' [Unassigned]'}
            </option>
          ))}
        </select>
        <input className={inputCls} placeholder="Room (e.g. B204)" value={selected.room} onChange={e => setSelected({ ...selected, room: e.target.value })} required />
        <button type="submit" disabled={saving} className="btn-primary w-full">
          {saving ? 'Assigning…' : 'Assign Course'}
        </button>
        {message && <p className="text-emerald-400 text-sm">{message}</p>}
        {error && <p className="text-red-400 text-sm">{error}</p>}
      </form>

      <div className="mt-8 pt-6 border-t border-surface-border">
        <h3 className="text-sm font-semibold text-slate-100 mb-3">Assigned Courses</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {courses.filter(c => c.professorUid).map(c => (
            <div key={c.id} className="bg-surface-raised p-3 rounded-lg flex justify-between items-start">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-100 truncate">{c.code} — {c.name}</p>
                <p className="text-xs text-slate-400">
                  {professors.find(p => p.uid === c.professorUid)?.name} • Room {c.room}
                </p>
              </div>
              <button
                onClick={() => unassign(c.id, c.professorUid)}
                className="ml-2 text-xs px-2 py-1 bg-red-900/30 text-red-400 rounded hover:bg-red-900/50"
              >
                Unassign
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
