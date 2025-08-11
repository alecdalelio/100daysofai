export const GRADIENTS = [
  { id: 'grad-1', className: 'bg-gradient-to-tr from-pink-500 to-yellow-500' },
  { id: 'grad-2', className: 'bg-gradient-to-tr from-blue-500 to-green-400' },
  { id: 'grad-3', className: 'bg-gradient-to-tr from-purple-500 to-pink-400' },
  { id: 'grad-4', className: 'bg-gradient-to-tr from-teal-400 to-cyan-500' },
  { id: 'grad-5', className: 'bg-gradient-to-tr from-orange-400 to-red-500' },
  { id: 'grad-6', className: 'bg-gradient-to-tr from-indigo-500 to-sky-400' },
]

export const isValidGradient = (token?: string | null): boolean =>
  !!token && GRADIENTS.some(g => g.id === token)

export const gradientClass = (token?: string | null): string =>
  GRADIENTS.find(g => g.id === token)?.className ?? ''


