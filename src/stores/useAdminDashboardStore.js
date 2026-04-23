import { useSyncExternalStore } from 'react'

const listeners = new Set()

let store = {
  commandCenterSnapshot: null,
  openAlertsCount: 0,
  socketStatus: 'idle',
  selectedPath: {
    campusId: '',
    buildingId: '',
    roomId: '',
    sessionId: '',
    studentId: '',
  },
  darkMode: true,
}

function setStore(updater) {
  store = typeof updater === 'function' ? updater(store) : { ...store, ...updater }
  listeners.forEach(listener => listener())
}

function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

const api = {
  setCommandCenterSnapshot: (snapshot) => setStore(prev => ({
    ...prev,
    commandCenterSnapshot: snapshot,
    openAlertsCount: snapshot?.kpis?.alerts ?? prev.openAlertsCount,
  })),
  setSocketStatus: (socketStatus) => setStore(prev => ({ ...prev, socketStatus })),
  setOpenAlertsCount: (alerts) => setStore(prev => ({
    ...prev,
    openAlertsCount: alerts,
    commandCenterSnapshot: prev.commandCenterSnapshot
      ? {
          ...prev.commandCenterSnapshot,
          generatedAt: new Date().toISOString(),
          kpis: {
            ...(prev.commandCenterSnapshot.kpis ?? {}),
            alerts,
          },
        }
      : prev.commandCenterSnapshot,
  })),
  setSelectedPath: (patch) => setStore(prev => ({ ...prev, selectedPath: { ...prev.selectedPath, ...patch } })),
  toggleDarkMode: () => setStore(prev => ({ ...prev, darkMode: !prev.darkMode })),
}

const getSnapshot = () => ({ ...store, ...api })

export function useAdminDashboardStore(selector = (state) => state) {
  return useSyncExternalStore(subscribe, () => selector(getSnapshot()), () => selector(getSnapshot()))
}

