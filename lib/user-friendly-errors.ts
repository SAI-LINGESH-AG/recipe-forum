/** Message shown when `profiles.username` unique constraint fails. */
export const USERNAME_ALREADY_TAKEN =
  'This username is already taken. Please choose a different one.'

type ErrorLike = {
  message: string
  code?: string
}

function isProfilesUsernameUniqueViolation(message: string, code?: string): boolean {
  const lower = message.toLowerCase()
  if (lower.includes('profiles_username_key')) return true
  if (code === '23505' && lower.includes('username')) return true
  if (lower.includes('duplicate key') && lower.includes('username')) return true
  return false
}

/** Maps PostgREST / Postgres errors from `profiles` writes to plain language. */
export function friendlyProfilesWriteError(error: ErrorLike): string {
  if (isProfilesUsernameUniqueViolation(error.message, error.code)) {
    return USERNAME_ALREADY_TAKEN
  }
  return error.message
}

/**
 * Auth sign-up can fail with a generic message when a DB trigger (e.g. insert profile)
 * hits a unique constraint; map those to the same friendly copy as profile saves.
 */
export function friendlySignupError(error: ErrorLike): string {
  if (isProfilesUsernameUniqueViolation(error.message, error.code)) {
    return USERNAME_ALREADY_TAKEN
  }
  const lower = error.message.toLowerCase()
  if (lower.includes('database error saving new user')) {
    return USERNAME_ALREADY_TAKEN
  }
  return error.message
}
