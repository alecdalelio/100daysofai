import { FormEvent, useState } from 'react'
import { signInWithEmail, signUpWithEmail, signInWithProvider } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'signin'|'signup'>('signin')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const fn = mode === 'signin' ? signInWithEmail : signUpWithEmail
    const { error } = await fn(email, password)
    setLoading(false)
    if (error) setError(error.message)
    else window.location.href = '/'
  }

  return (
    <div className="mx-auto max-w-md p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Log in</h1>

      <div className="space-y-2">
        <button className="w-full border rounded p-2" onClick={() => signInWithProvider('google')}>
          Continue with Google
        </button>
        <button className="w-full border rounded p-2" onClick={() => signInWithProvider('github')}>
          Continue with GitHub
        </button>
      </div>

      <div className="text-center text-sm text-gray-500">or</div>

      <form onSubmit={onSubmit} className="space-y-2">
        <input
          className="w-full border rounded p-2"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="w-full border rounded p-2"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button className="w-full border rounded p-2" disabled={loading}>
          {loading ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
        </button>
      </form>

      <button
        className="text-sm underline"
        onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
      >
        {mode === 'signin' ? "Need an account? Sign up" : "Have an account? Sign in"}
      </button>
    </div>
  )
}
