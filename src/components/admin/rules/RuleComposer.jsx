import { useState } from 'react'

const FIELDS = ['co2', 'temperature', 'humidity', 'session_status']
const OPERATORS = ['>', '>=', '=', '<=', '<']
const ACTIONS = ['toggle_device', 'notify', 'set_threshold']
const TARGETS = ['ventilation', 'ac', 'lights', 'ops-channel']

const EMPTY_RULE = {
  condition: { field: 'co2', operator: '>', value: 900 },
  action: { type: 'toggle_device', target: 'ventilation', value: 'on' },
}

export default function RuleComposer({ onCreate, onSimulate, creating, simulating, simulation }) {
  const [draft, setDraft] = useState(EMPTY_RULE)

  const inputCls = 'bg-surface-raised border border-surface-border rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-brand/50'

  const updateCondition = (patch) => setDraft(prev => ({ ...prev, condition: { ...prev.condition, ...patch } }))
  const updateAction = (patch) => setDraft(prev => ({ ...prev, action: { ...prev.action, ...patch } }))

  const submit = async (e) => {
    e.preventDefault()
    await onCreate?.(draft)
  }

  const simulate = async () => {
    await onSimulate?.(draft)
  }

  return (
    <form onSubmit={submit} className="card space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <select className={inputCls} value={draft.condition.field} onChange={e => updateCondition({ field: e.target.value })}>
          {FIELDS.map(field => <option key={field} value={field}>{field}</option>)}
        </select>
        <select className={inputCls} value={draft.condition.operator} onChange={e => updateCondition({ operator: e.target.value })}>
          {OPERATORS.map(operator => <option key={operator} value={operator}>{operator}</option>)}
        </select>
        <input
          className={inputCls}
          value={draft.condition.value}
          onChange={e => updateCondition({ value: e.target.value })}
          placeholder="value"
        />
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <select className={inputCls} value={draft.action.type} onChange={e => updateAction({ type: e.target.value })}>
          {ACTIONS.map(action => <option key={action} value={action}>{action}</option>)}
        </select>
        <select className={inputCls} value={draft.action.target} onChange={e => updateAction({ target: e.target.value })}>
          {TARGETS.map(target => <option key={target} value={target}>{target}</option>)}
        </select>
        <input
          className={inputCls}
          value={draft.action.value}
          onChange={e => updateAction({ value: e.target.value })}
          placeholder="action value"
        />
      </div>

      <div className="flex gap-2">
        <button type="submit" disabled={creating} className="btn-primary text-xs px-3 py-1.5">
          {creating ? 'Creating…' : 'Create Rule'}
        </button>
        <button type="button" onClick={simulate} disabled={simulating} className="btn-ghost text-xs">
          {simulating ? 'Simulating…' : 'Simulate Rule'}
        </button>
      </div>

      {simulation && (
        <div className="rounded-lg border border-surface-border bg-surface-raised p-3">
          <p className="text-xs text-slate-300">
            Result: <span className={simulation.matched ? 'text-emerald-300' : 'text-amber-300'}>{simulation.matched ? 'Matched' : 'Not matched'}</span>
          </p>
          <p className="text-xs text-slate-400 mt-1">{simulation.summary}</p>
          <p className="text-xs text-slate-500 mt-1">{simulation.actionPreview}</p>
        </div>
      )}
    </form>
  )
}

