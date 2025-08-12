import { render, screen } from '@testing-library/react'
import UserBadge from '../UserBadge'
import * as hook from '../../hooks/useProfile'

vi.mock('../../hooks/useProfile')

it('shows username', () => {
  vi.spyOn(hook, 'useProfile').mockReturnValue({ profile: { id:'u', username:'alec', display_name:null, avatar_gradient:'grad-3' } as any })
  render(<UserBadge />)
  expect(screen.getByTestId('user-badge-name').textContent).toBe('alec')
})

it('falls back to display name', () => {
  vi.spyOn(hook, 'useProfile').mockReturnValue({ profile: { id:'u', username:null, display_name:'Alec', avatar_gradient:'grad-3' } as any })
  render(<UserBadge />)
  expect(screen.getByTestId('user-badge-name').textContent).toBe('Alec')
})


