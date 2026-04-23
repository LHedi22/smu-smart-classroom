import LoadingSpinner from '../../shared/LoadingSpinner'

export function AsyncState({ loading, error, onRetry, children }) {
  if (loading) {
    return (
      <div className="card py-8">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="card border-red-500/30 bg-red-500/10">
        <p className="text-sm font-medium text-red-300">Failed to load data</p>
        <p className="text-xs text-red-400 mt-1">{error.message ?? String(error)}</p>
        {onRetry && (
          <button onClick={onRetry} className="btn-primary mt-3 text-xs">
            Retry
          </button>
        )}
      </div>
    )
  }

  return children
}

