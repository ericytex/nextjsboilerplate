/**
 * Default values and constants for the application
 */

// Default user avatar path
export const DEFAULT_AVATAR = '/avatars/default-avatar.png'

// Default avatar fallback (shows initials if image fails to load)
export function getAvatarFallback(name: string): string {
  if (!name) return 'U'
  const parts = name.trim().split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return name[0].toUpperCase()
}


