import { FormEvent, useEffect, useState, useRef } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { ensureProfile } from '../lib/supabase'
import { useProfile, updateProfile } from '@/hooks/useProfile'
import { writeLastProfile } from '@/lib/profileCache'
import { GRADIENTS, isValidGradient } from '@/constants/gradients'
import { IANATimeZones } from '@/constants/timezones'
import { uploadAvatar, uploadAvatarSimple, validateAvatarFile, isStorageAvatarUrl, deleteAvatar } from '@/lib/avatarUpload'

export default function Account() {
  const { userId, session, loading } = useAuth()
  const { profile, refresh } = useProfile()
  
  console.log('[Account] Component rendered. Auth state:', { userId, hasSession: !!session, loading })
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [avatarGradient, setAvatarGradient] = useState('')
  const [avatarImageUrl, setAvatarImageUrl] = useState<string | null>(null)
  const [avatarType, setAvatarType] = useState<'gradient' | 'image'>('gradient')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [okMsg, setOkMsg] = useState<string | null>(null)
  useEffect(() => { console.log('[Account] saving=', saving) }, [saving])
  const [usernameError, setUsernameError] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')
  const browserTZ = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  const [timeZone, setTimeZone] = useState<string>(browserTZ)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const gradients = GRADIENTS

  useEffect(() => {
    let mounted = true
    async function load() {
      if (!userId) return
      await ensureProfile(session?.access_token)
      await refresh()
      if (!mounted) return
      if (profile) {
        setUsername(profile.username ?? '')
        setDisplayName(profile.display_name ?? '')
        
        // Determine avatar type and set appropriate state
        const avatarValue = profile.avatar_gradient ?? ''
        if (isStorageAvatarUrl(avatarValue)) {
          setAvatarType('image')
          setAvatarImageUrl(avatarValue)
          setAvatarGradient('') // Clear gradient when using image
        } else {
          setAvatarType('gradient')
          setAvatarGradient(avatarValue)
          setAvatarImageUrl(null) // Clear image when using gradient
        }
        
        setTimeZone(profile.time_zone ?? browserTZ)
      }
    }
    load()
    return () => { mounted = false }
  }, [userId, profile?.id])

  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file || !userId) return

    // Validate file
    const validation = validateAvatarFile(file)
    if (!validation.valid) {
      setErrorMsg(validation.error || 'Invalid file')
      return
    }

    setUploading(true)
    setErrorMsg(null)

    try {
      // Use simplified upload for testing (no cleanup)
      const result = await uploadAvatarSimple(file, userId)
      if (result.success && result.url) {
        setAvatarType('image')
        setAvatarImageUrl(result.url)
        setAvatarGradient('') // Clear gradient selection
        setOkMsg('Image uploaded successfully')
      } else {
        setErrorMsg(result.error || 'Upload failed')
      }
    } catch (error) {
      console.error('[Account] Image upload error:', error)
      setErrorMsg('Failed to upload image')
    } finally {
      setUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  function handleGradientSelect(gradientId: string) {
    setAvatarType('gradient')
    setAvatarGradient(gradientId)
    setAvatarImageUrl(null) // Clear image selection
    setOkMsg(null)
    setErrorMsg(null)
  }

  async function handleRemoveImage() {
    if (!avatarImageUrl) return

    try {
      if (userId && isStorageAvatarUrl(avatarImageUrl)) {
        await deleteAvatar(avatarImageUrl, userId)
      }
      setAvatarType('gradient')
      setAvatarImageUrl(null)
      setAvatarGradient('grad-1') // Default to first gradient
      setOkMsg('Image removed')
    } catch (error) {
      console.error('[Account] Failed to remove image:', error)
      setErrorMsg('Failed to remove image')
    }
  }

  async function onSave() {
    setSaving(true)
    setErrorMsg(null)
    setOkMsg(null)
    try {
      // Determine the avatar value to save
      const avatarValue = avatarType === 'image' ? avatarImageUrl : avatarGradient
      
      console.log('[Account] save ->', { username, displayName, avatarType, avatarValue, timeZone })
      const safeTZ = IANATimeZones.includes(timeZone) ? timeZone : browserTZ
      const row = await updateProfile({
        username: username?.trim() || undefined,
        display_name: displayName?.trim() || undefined,
        avatar_gradient: avatarValue || undefined,
        time_zone: safeTZ,
      }, { token: session?.access_token, userId: userId ?? undefined })
      console.log('[Account] saved row', row)
      
      // Update local state with fresh data
      setUsername(row.username ?? '')
      setDisplayName(row.display_name ?? '')
      
      // Update avatar state based on returned data
      const returnedAvatarValue = row.avatar_gradient ?? ''
      if (isStorageAvatarUrl(returnedAvatarValue)) {
        setAvatarType('image')
        setAvatarImageUrl(returnedAvatarValue)
        setAvatarGradient('')
      } else {
        setAvatarType('gradient')
        setAvatarGradient(returnedAvatarValue || 'grad-1')
        setAvatarImageUrl(null)
      }
      
      setTimeZone(row.time_zone ?? browserTZ)
      
      // Update cache with fresh data - this ensures localStorage has the latest
      console.log('[Account] Writing fresh data to cache:', row)
      writeLastProfile({
        id: row.id,
        username: row.username ?? null,
        display_name: row.display_name ?? null,
        avatar_gradient: row.avatar_gradient ?? null,
        time_zone: row.time_zone ?? null,
      })
      
      // Notify useProfile hook that data was saved (this will trigger a fresh fetch)
      console.log('[Account] Dispatching profile:saved event')
      window.dispatchEvent(new CustomEvent('profile:saved', { detail: row }))
      
      setOkMsg('Saved')
      
      // Wait for useProfile to process the update
      await new Promise(resolve => setTimeout(resolve, 100))
      await refresh()
    } catch (err: unknown) {
      console.error('[Account] save error', err)
      const message = err instanceof Error ? err.message : 'Save failed'
      setErrorMsg(message)
    } finally {
      setSaving(false)
    }
  }

  async function onSubmit(e: FormEvent) { e.preventDefault(); await onSave(); }

  return (
    <div className="mx-auto max-w-xl p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Account</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="block text-sm mb-1">Username (unique)</label>
          <input
            className={`w-full border rounded p-2 bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100 ${usernameError ? 'border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500' : ''}`}
            value={username}
            onChange={e=>setUsername(e.target.value)}
          />
          {usernameError && <p className="text-sm text-red-600 mt-1">{usernameError}</p>}
        </div>
        <div>
          <label className="block text-sm mb-1">Time zone</label>
          <select
            value={timeZone}
            onChange={e=>setTimeZone(e.target.value)}
            className="w-full border rounded p-2 bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100"
          >
            {IANATimeZones.map(tz => (
              <option key={tz} value={tz}>{tz}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">Display name</label>
          <input
            className="w-full border rounded p-2 bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100"
            value={displayName}
            onChange={e=>setDisplayName(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm mb-2">Choose Avatar</label>
          
          {/* Avatar Type Tabs */}
          <div className="flex border-b mb-4">
            <button
              type="button"
              onClick={() => setAvatarType('gradient')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
                avatarType === 'gradient' 
                  ? 'border-indigo-500 text-indigo-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Gradient
            </button>
            <button
              type="button"
              onClick={() => setAvatarType('image')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
                avatarType === 'image' 
                  ? 'border-indigo-500 text-indigo-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Upload Image
            </button>
          </div>

          {/* Gradient Options */}
          {avatarType === 'gradient' && (
            <div className="grid grid-cols-6 gap-3">
              {gradients.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => handleGradientSelect(g.id)}
                  className={`h-12 w-12 rounded-full ${g.className} border-2 transition ${
                    avatarGradient === g.id ? 'border-indigo-500' : 'border-transparent'
                  }`}
                  aria-label={`Select ${g.id}`}
                />
              ))}
            </div>
          )}

          {/* Image Upload Options */}
          {avatarType === 'image' && (
            <div className="space-y-4">
              {/* Current Image Preview */}
              {avatarImageUrl && (
                <div className="flex items-center gap-4">
                  <img
                    src={avatarImageUrl}
                    alt="Current avatar"
                    className="h-16 w-16 rounded-full object-cover border-2 border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="px-3 py-1 text-sm text-red-600 border border-red-300 rounded hover:bg-red-50 transition"
                  >
                    Remove Image
                  </button>
                </div>
              )}

              {/* File Upload */}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {uploading ? 'Uploading...' : avatarImageUrl ? 'Change Image' : 'Upload Image'}
                </button>
                <p className="mt-1 text-xs text-gray-500">
                  JPEG, PNG, or WebP. Max 5MB. Image will be resized to 200x200.
                </p>
              </div>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onSave}
          disabled={saving || uploading}
          className="px-4 py-2 rounded border disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving…' : uploading ? 'Uploading...' : 'Save'}
        </button>

        {errorMsg && <p className="text-red-500 mt-2">{errorMsg}</p>}
        {okMsg && <p className="text-green-500 mt-2">{okMsg}</p>}
      </form>
    </div>
  )
}


