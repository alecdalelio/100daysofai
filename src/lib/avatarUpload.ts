import { supabase } from './supabase'

// Avatar upload configuration
const AVATAR_BUCKET = 'avatars'
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const IMAGE_SIZE = 150 // Target size for avatar images (reduced for faster upload)

export interface AvatarUploadResult {
  success: boolean
  url?: string
  error?: string
}

/**
 * Validates an image file for avatar upload
 */
export function validateAvatarFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'No file selected' }
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Only JPEG, PNG, and WebP images are allowed' }
  }

  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File size must be less than 5MB' }
  }

  return { valid: true }
}

/**
 * Resizes and compresses an image file
 */
export function resizeImage(file: File, maxSize: number = IMAGE_SIZE): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      // Calculate dimensions maintaining aspect ratio
      let { width, height } = img
      if (width > height) {
        if (width > maxSize) {
          height = (height * maxSize) / width
          width = maxSize
        }
      } else {
        if (height > maxSize) {
          width = (width * maxSize) / height
          height = maxSize
        }
      }

      canvas.width = width
      canvas.height = height

      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height)
      canvas.toBlob((blob) => {
        if (blob) {
          console.log('[resizeImage] Resized from', file.size, 'to', blob.size, 'bytes')
          resolve(blob)
        } else {
          reject(new Error('Failed to resize image'))
        }
      }, 'image/jpeg', 0.5) // 50% quality for smaller files
    }

    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Generates a unique filename for avatar upload
 */
export function generateAvatarFilename(userId: string, file: File): string {
  const extension = file.name.split('.').pop() || 'jpg'
  const timestamp = Date.now()
  return `${userId}-${timestamp}.${extension}`
}

/**
 * Uploads an avatar image to Supabase storage
 */
export async function uploadAvatar(file: File, userId: string): Promise<AvatarUploadResult> {
  try {
    console.log('[avatarUpload] Starting upload for user:', userId)
    
    // Validate file
    const validation = validateAvatarFile(file)
    if (!validation.valid) {
      return { success: false, error: validation.error }
    }

    // Resize image
    console.log('[avatarUpload] Resizing image...')
    const resizedBlob = await resizeImage(file)
    
    // Generate unique filename
    const filename = generateAvatarFilename(userId, file)
    console.log('[avatarUpload] Generated filename:', filename)

    // Delete existing avatar if any (with timeout protection)
    console.log('[avatarUpload] Starting cleanup of existing avatars...')
    try {
      console.log('[avatarUpload] Listing existing files for user:', userId)
      
      // Add timeout protection to the list operation
      const listPromise = supabase.storage
        .from(AVATAR_BUCKET)
        .list('', { search: userId })
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('List operation timeout')), 5000)
      )
      
      const { data: existingFiles, error: listError } = await Promise.race([
        listPromise,
        timeoutPromise
      ]) as any
      
      console.log('[avatarUpload] List operation completed:', { existingFiles, listError })
      
      if (listError) {
        console.warn('[avatarUpload] List error (continuing):', listError)
      } else if (existingFiles && existingFiles.length > 0) {
        const filesToDelete = existingFiles.map((f: any) => f.name)
        console.log('[avatarUpload] Found existing avatars to delete:', filesToDelete)
        
        // Add timeout to delete operation too
        const deletePromise = supabase.storage
          .from(AVATAR_BUCKET)
          .remove(filesToDelete)
        
        const deleteTimeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Delete operation timeout')), 5000)
        )
        
        const deleteResult = await Promise.race([
          deletePromise,
          deleteTimeoutPromise
        ])
        
        console.log('[avatarUpload] Delete operation completed:', deleteResult)
      } else {
        console.log('[avatarUpload] No existing files to delete')
      }
    } catch (cleanupError) {
      console.warn('[avatarUpload] Cleanup failed (continuing with upload):', cleanupError)
      // Continue with upload even if cleanup fails
    }
    
    console.log('[avatarUpload] Cleanup completed, proceeding with upload...')

    // Upload new file with timeout protection
    console.log('[avatarUpload] Uploading to storage...')
    
    const uploadPromise = supabase.storage
      .from(AVATAR_BUCKET)
      .upload(filename, resizedBlob, {
        cacheControl: '3600',
        upsert: false
      })
    
    const uploadTimeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Upload operation timeout (15s)')), 15000)
    )
    
    const { data: uploadData, error: uploadError } = await Promise.race([
      uploadPromise,
      uploadTimeoutPromise
    ]) as any
    
    console.log('[avatarUpload] Upload operation completed:', { uploadData, uploadError })

    if (uploadError) {
      console.error('[avatarUpload] Upload error:', uploadError)
      console.error('[avatarUpload] Upload error details:', JSON.stringify(uploadError, null, 2))
      return { 
        success: false, 
        error: uploadError.message || `Upload failed: ${uploadError.error || uploadError.code || 'Unknown error'}` 
      }
    }

    // Get public URL
    console.log('[avatarUpload] Getting public URL for uploaded file...')
    const { data: urlData } = supabase.storage
      .from(AVATAR_BUCKET)
      .getPublicUrl(filename)

    const publicUrl = urlData.publicUrl
    console.log('[avatarUpload] Public URL generated:', publicUrl)
    console.log('[avatarUpload] Upload successful! Final URL:', publicUrl)

    return { success: true, url: publicUrl }

  } catch (error) {
    console.error('[avatarUpload] Unexpected error:', error)
    console.error('[avatarUpload] Error details:', JSON.stringify(error, null, 2))
    
    let errorMessage = 'Upload failed'
    if (error instanceof Error) {
      errorMessage = error.message
    } else if (typeof error === 'object' && error !== null) {
      errorMessage = (error as any).message || (error as any).error || 'Unknown error occurred'
    }
    
    return { 
      success: false, 
      error: errorMessage
    }
  }
}

/**
 * Simplified upload without cleanup (for testing)
 */
export async function uploadAvatarSimple(file: File, userId: string): Promise<AvatarUploadResult> {
  try {
    console.log('[avatarUploadSimple] Starting SIMPLE upload for user:', userId)
    
    // Debug: Check auth state
    const { data: { user } } = await supabase.auth.getUser()
    console.log('[avatarUploadSimple] Current auth user:', user?.id)
    console.log('[avatarUploadSimple] User ID match:', user?.id === userId)
    
    // Validate file
    const validation = validateAvatarFile(file)
    if (!validation.valid) {
      return { success: false, error: validation.error }
    }

    // Resize image
    console.log('[avatarUploadSimple] Resizing image...')
    const resizedBlob = await resizeImage(file)
    
    // Generate unique filename
    const filename = generateAvatarFilename(userId, file)
    console.log('[avatarUploadSimple] Generated filename:', filename)
    
    // Debug: Test filename parsing
    const extractedUserId = filename.split('-')[0]
    console.log('[avatarUploadSimple] Extracted user ID from filename:', extractedUserId)
    console.log('[avatarUploadSimple] Policy check: auth.uid() should equal', extractedUserId)

    // Upload directly without cleanup (with timeout protection)
    console.log('[avatarUploadSimple] Uploading to storage (no cleanup)...')
    console.log('[avatarUploadSimple] Blob size:', resizedBlob.size, 'bytes')
    
    const uploadPromise = supabase.storage
      .from(AVATAR_BUCKET)
      .upload(filename, resizedBlob, {
        cacheControl: '3600',
        upsert: true // Allow overwrite
      })
    
    const uploadTimeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Upload timeout (10s)')), 10000)
    )
    
    const { data: uploadData, error: uploadError } = await Promise.race([
      uploadPromise,
      uploadTimeoutPromise
    ]) as any

    console.log('[avatarUploadSimple] Upload result:', { uploadData, uploadError })

    if (uploadError) {
      console.error('[avatarUploadSimple] Upload error:', uploadError)
      return { 
        success: false, 
        error: uploadError.message || 'Upload failed' 
      }
    }

    // Get public URL
    console.log('[avatarUploadSimple] Getting public URL...')
    const { data: urlData } = supabase.storage
      .from(AVATAR_BUCKET)
      .getPublicUrl(filename)

    const publicUrl = urlData.publicUrl
    console.log('[avatarUploadSimple] Success! URL:', publicUrl)

    return { success: true, url: publicUrl }

  } catch (error) {
    console.error('[avatarUploadSimple] Error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Upload failed' 
    }
  }
}

/**
 * Deletes an avatar from storage
 */
export async function deleteAvatar(avatarUrl: string, userId: string): Promise<boolean> {
  try {
    // Extract filename from URL
    const url = new URL(avatarUrl)
    const pathParts = url.pathname.split('/')
    const filename = pathParts[pathParts.length - 1]

    // Verify the file belongs to this user (security check)
    if (!filename.startsWith(userId)) {
      console.warn('[avatarUpload] Security check failed: filename does not match user ID')
      return false
    }

    const { error } = await supabase.storage
      .from(AVATAR_BUCKET)
      .remove([filename])

    if (error) {
      console.error('[avatarUpload] Delete error:', error)
      return false
    }

    console.log('[avatarUpload] Avatar deleted successfully:', filename)
    return true

  } catch (error) {
    console.error('[avatarUpload] Delete failed:', error)
    return false
  }
}

/**
 * Checks if a URL is a Supabase storage avatar URL
 */
export function isStorageAvatarUrl(url: string): boolean {
  if (!url) return false
  
  try {
    const urlObj = new URL(url)
    return urlObj.pathname.includes(`/storage/v1/object/public/${AVATAR_BUCKET}/`)
  } catch {
    return false
  }
}