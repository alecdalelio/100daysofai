import { signInWithProvider } from '../lib/supabase'

export default function Login() {
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
    </div>
  )
}
