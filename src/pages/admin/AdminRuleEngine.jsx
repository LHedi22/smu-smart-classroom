import { useState } from 'react'
import { adminApi } from '../../services/adminApi'
import { useAdminResource } from '../../hooks/useAdminResource'
import { AsyncState } from '../../components/admin/common/AsyncState'
import StatusPill from '../../components/admin/common/StatusPill'
import RuleComposer from '../../components/admin/rules/RuleComposer'

export default function AdminRuleEngine() {
  const [creating, setCreating] = useState(false)
  const [simulating, setSimulating] = useState(false)
  const [simulation, setSimulation] = useState(null)
  const { data, setData, loading, error } = useAdminResource(
    () => adminApi.getRules(),
    []
  )

  const createRule = async (rule) => {
    setCreating(true)
    try {
      const created = await adminApi.createRule(rule)
      setData(prev => ({ ...prev, rules: [created.rule, ...(prev?.rules ?? [])] }))
    } finally {
      setCreating(false)
    }
  }

  const toggleRule = async (rule) => {
    await adminApi.updateRule(rule.id, { enabled: !rule.enabled })
    setData(prev => ({
      ...prev,
      rules: (prev?.rules ?? []).map(item => item.id === rule.id ? { ...item, enabled: !item.enabled } : item),
    }))
  }

  const deleteRule = async (ruleId) => {
    await adminApi.deleteRule(ruleId)
    setData(prev => ({ ...prev, rules: (prev?.rules ?? []).filter(rule => rule.id !== ruleId) }))
  }

  const simulate = async (rule) => {
    setSimulating(true)
    try {
      setSimulation(await adminApi.simulateRule(rule))
    } finally {
      setSimulating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-100">Rule Engine</h1>
        <p className="text-sm text-slate-500">Define IF [condition] THEN [action] automation policies for classrooms.</p>
      </div>

      <RuleComposer
        onCreate={createRule}
        onSimulate={simulate}
        creating={creating}
        simulating={simulating}
        simulation={simulation}
      />

      <AsyncState loading={loading} error={error}>
        <div className="space-y-3">
          {(data?.rules ?? []).map(rule => (
            <div key={rule.id} className="card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-200">
                    IF {rule.condition?.field} {rule.condition?.operator} {String(rule.condition?.value)}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    THEN {rule.action?.type} {rule.action?.target} = {String(rule.action?.value)}
                  </p>
                </div>
                <StatusPill status={rule.enabled ? 'ok' : 'idle'} label={rule.enabled ? 'enabled' : 'disabled'} />
              </div>
              <div className="mt-3 flex gap-2">
                <button onClick={() => toggleRule(rule)} className="btn-primary text-xs px-3 py-1.5">
                  {rule.enabled ? 'Disable' : 'Enable'}
                </button>
                <button onClick={() => deleteRule(rule.id)} className="btn-ghost text-xs">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </AsyncState>
    </div>
  )
}

