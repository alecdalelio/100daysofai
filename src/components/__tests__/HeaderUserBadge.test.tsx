import { render, screen } from '@testing-library/react'
import UserBadge from '../UserBadge'
import * as hook from '../../hooks/useProfile'

vi.mock('../../hooks/useProfile')

it('shows username when available', () => {
  vi.spyOn(hook, 'useProfile').mockReturnValue({ profile: { id:'u', username:'alecd', display_name:null, avatar_gradient:'grad-3' } } as any)
  render(<UserBadge />)
  expect(screen.getByText('alecd')).toBeInTheDocument()
})

it('falls back to display name', () => {
  vi.spyOn(hook, 'useProfile').mockReturnValue({ profile: { id:'u', username:null, display_name:'Alec', avatar_gradient:'grad-3' } } as any)
  render(<UserBadge />)
  expect(screen.getByText('Alec')).toBeInTheDocument()
})


