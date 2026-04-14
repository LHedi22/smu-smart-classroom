import { Component } from 'react'

export default class ErrorBoundary extends Component {
  state = { hasError: false, error: null }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="p-4 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-sm">
          Something went wrong loading this section.
        </div>
      )
    }
    return this.props.children
  }
}
