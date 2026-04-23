export function isIncidentOpen(status) {
  const normalized = String(status ?? '').toLowerCase()
  return normalized !== 'resolved' && normalized !== 'closed'
}

export function countOpenIncidents(incidents = []) {
  return incidents.filter(incident => isIncidentOpen(incident?.status)).length
}
