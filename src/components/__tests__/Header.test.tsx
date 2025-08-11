import { render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import Header from '../Header'
import { AuthProvider } from '@/auth/AuthProvider'

// Mock supabase client pieces used by Header
vi.mock('@/lib/supabase', async () => {
  const actual = await vi.importActual<any>('@/lib/supabase')
  return {
    ...actual,
    // Provide a stable queryDirectly that returns a profile row
    queryDirectly: vi.fn(async () => [{
      id: 'user-1', username: 'al3ccc', display_name: 'AL3C', avatar_url: 'grad-3'
    }]),
    supabase: {
      channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn(() => ({ subscription: {} })) })),
      removeChannel: vi.fn(),
      from: vi.fn(),
      auth: { getSession: vi.fn(async () => ({ data: { session: { user: { id: 'user-1' } } } })) },
    }
  }
})

// Provide a minimal Auth context wrapper with a fixed user
function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  )
}

describe('Header', () => {
  it('renders username or display name and gradient avatar', async () => {
    render(<Header />, { wrapper: Wrapper })

    await waitFor(() => {
      // The Account button text should contain the profile name
      expect(screen.getByText(/AL3C|al3ccc/i)).toBeInTheDocument()
    })
  })
})


