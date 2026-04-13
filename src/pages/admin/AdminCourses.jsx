import { useState, useEffect } from 'react'
import { ref, get, set, remove } from 'firebase/database'
import { db } from '../../firebase'
import { expandSlots, normalizeSchedule, validateSchedule } from '../../utils/scheduleHelpers'

const EMPTY = { code: '', name: '', semester: 'S26', room: '', days: '', startTime: '', endTime: '', enrolled: '' }

export default function AdminCourses() {
  const [courses, setCourses] = useState([])
  const [form,    setForm]    = useState(EMPTY)
  const [saving,  setSaving]  = useState(false)
  const [message, setMessage] = useState('')

  async function load() {
    const snap = await get(ref(db, 'courses'))
    setCourses(snap.val() ? Object.entries(snap.val()).map(([id, v]) => ({ id, ...v })) : [])
  }

  useEffect(() => { load() }, [])

  async function saveCourse(e) {
    e.preventDefault()
    setSaving(true)
    const key = form.code.toUpperCase().replace(/\s/g, '')
    
    // Convert form input to normalized schedule slots
    const slots = expandSlots(form.days, form.startTime, form.endTime, form.room, 'Lecture')
    
    // Validate schedule
    const { valid, errors } = validateSchedule(slots)
    if (errors.length > 0) {
      console.error('Schedule validation errors:', errors)
      setMessage(`Error: ${errors[0]}`)
      setSaving(false)
      setTimeout(() => setMessage(''), 3000)
      return
    }
    
    await set(ref(db, `courses/${key}`), {
      code: key,
      name: form.name,
      semester: form.semester,
      room: form.room,
      // Save in canonical format: array of slots with {day, starttime, endtime, room, type}
      schedule: slots,
      enrolled: parseInt(form.enrolled) || 0,
      moodleCourseId: null,
    })
    setForm(EMPTY)
    setSaving(false)
    await load()
    setMessage('Course saved successfully.')
    setTimeout(() => setMessage(''), 3000)
  }

  async function deleteCourse(id) {
    if (!window.confirm(`Delete course ${id}?`)) return
    await remove(ref(db, `courses/${id}`))
    await load()
  }

  const inputCls = 'bg-surface-raised border border-surface-border rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/30'

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h2 className="text-base font-semibold text-slate-100 mb-4">Add / Edit Course</h2>
        <form onSubmit={saveCourse} className="grid grid-cols-2 gap-3">
          <input  className={inputCls} placeholder="Course code (e.g. CS102)"      value={form.code}      onChange={e => setForm({ ...form, code: e.target.value })}      required />
          <input  className={inputCls} placeholder="Course name"                   value={form.name}      onChange={e => setForm({ ...form, name: e.target.value })}      required />
          <select className={inputCls} value={form.semester} onChange={e => setForm({ ...form, semester: e.target.value })}>
            <option value="F25">Fall 2025</option>
            <option value="S26">Spring 2026</option>
          </select>
          <input  className={inputCls} placeholder="Room (e.g. B204)"              value={form.room}      onChange={e => setForm({ ...form, room: e.target.value })}      required />
          <input  className={`${inputCls} col-span-2`} placeholder="Days (Monday, Wednesday)" value={form.days} onChange={e => setForm({ ...form, days: e.target.value })} />
          <input  className={inputCls} placeholder="Start time (09:00)"            value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} />
          <input  className={inputCls} placeholder="End time (10:30)"              value={form.endTime}   onChange={e => setForm({ ...form, endTime: e.target.value })} />
          <input  className={inputCls} placeholder="Enrolled students" type="number" value={form.enrolled} onChange={e => setForm({ ...form, enrolled: e.target.value })} />
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Saving…' : 'Save Course'}
          </button>
        </form>
      </div>

      <div>
        <h2 className="text-base font-semibold text-slate-100 mb-3">All Courses</h2>
        <div className="space-y-2">
          {courses.map(c => {
            // Normalize schedule for display
            const schedule = normalizeSchedule(c.schedule)
            const scheduleStr = schedule.length > 0
              ? `${schedule.map(s => s.day).join(', ')} · ${schedule[0]?.starttime}–${schedule[0]?.endtime}`
              : 'No schedule'
            
            return (
              <div key={c.id} className="card flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-200">{c.code} — {c.name}</p>
                  <p className="text-xs text-slate-500">{c.semester} · Room {c.room} · {c.enrolled} students</p>
                  <p className="text-xs text-slate-600">{scheduleStr}</p>
                </div>
                <button onClick={() => deleteCourse(c.id)} className="text-xs text-red-400 hover:text-red-300">
                  Delete
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
