import { Component } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

const FLASK_URL = import.meta.env.VITE_FLASK_URL

// Fire-and-forget shipment; never awaits and never throws.
// We swallow failures so a broken reporter can't cascade.
function reportToBackend({ label, error, componentStack }) {
  if (!FLASK_URL) return
  try {
    fetch(`${FLASK_URL}/api/errors`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        label,
        message:        error?.message ?? String(error),
        stack:          error?.stack ?? '',
        componentStack: componentStack ?? '',
        url:            typeof window !== 'undefined' ? window.location.href : '',
      }),
      keepalive: true,  // allows send during page unload
    }).catch(() => {})
  } catch { /* swallow */ }
}

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info.componentStack)
    reportToBackend({
      label:          this.props.label ?? 'Unknown',
      error,
      componentStack: info.componentStack,
    })
  }

  handleRetry = () => this.setState({ error: null })

  render() {
    if (!this.state.error) return this.props.children

    const { label = 'This section', compact = false } = this.props

    if (compact) {
      return (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600">
          <AlertTriangle size={12} className="shrink-0" />
          <span>{label} failed to load.</span>
          <button
            onClick={this.handleRetry}
            className="ml-auto flex items-center gap-1 text-red-500 hover:text-red-700 font-medium"
          >
            <RefreshCw size={11} /> Retry
          </button>
        </div>
      )
    }

    return (
      <div className="card flex flex-col items-center gap-3 py-8 text-center border-red-200 bg-red-50">
        <AlertTriangle size={28} className="text-red-400" />
        <p className="text-red-700 font-medium text-sm">{label} encountered an error</p>
        <p className="text-xs text-red-400 max-w-xs font-mono break-all">
          {this.state.error.message}
        </p>
        <button
          onClick={this.handleRetry}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-red-200 text-xs text-red-600 hover:border-red-400 transition-colors"
        >
          <RefreshCw size={12} /> Try again
        </button>
      </div>
    )
  }
}
