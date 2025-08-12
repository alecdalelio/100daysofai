import React from 'react'

export function RouteProgressBar() {
  return (
    <div className="fixed left-0 right-0 top-0 z-[60] h-0.5 overflow-hidden">
      <div className="relative h-full bg-fuchsia-400/30">
        <div className="absolute top-0 h-full bg-fuchsia-400/80 animate-indeterminate" />
      </div>
    </div>
  )
}

export function LoadingOverlay({ text = 'Loading…' }: { text?: string }) {
  return (
    <div
      className="fixed inset-0 z-[50] pointer-events-none"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm opacity-100 transition-opacity" />
      <div className="absolute inset-0 grid place-items-center">
        <div className="flex items-center gap-3 rounded-full border border-white/15 bg-black/60 px-4 py-2 shadow-lg">
          <span className="relative inline-flex h-2 w-2">
            <span className="absolute inline-flex h-2 w-2 rounded-full bg-fuchsia-400 opacity-75 animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-fuchsia-300" />
          </span>
          <span className="text-sm text-white/90">{text}</span>
        </div>
      </div>
    </div>
  )
}


