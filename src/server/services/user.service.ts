import type { ApiResponse, User, CreateProfileInput } from '@/types'

interface UserQueries {
  findUserByEmail: (email: string) => Promise<User | null>
  findUserById: (id: string) => Promise<User | null>
  createUser: (data: {
    accessEmail: string
    displayName: string
    bio?: string
    iconUrl?: string
  }) => Promise<User>
  updateUser: (userId: string, data: {
    displayName?: string
    bio?: string
    iconUrl?: string
  }) => Promise<User>
}

export async function registerUser(
  queries: UserQueries,
  email: string,
  input: CreateProfileInput,
): Promise<ApiResponse<User>> {
  if (!input.displayName || input.displayName.trim().length === 0) {
    return { success: false, error: '表示名は必須です' }
  }

  const existing = await queries.findUserByEmail(email)
  if (existing) {
    return { success: false, error: 'すでに登録されています' }
  }

  const user = await queries.createUser({
    accessEmail: email,
    displayName: input.displayName.trim(),
    bio: input.bio?.trim() || undefined,
    iconUrl: input.iconUrl || undefined,
  })

  return { success: true, data: user }
}

export async function updateProfile(
  queries: UserQueries,
  userId: string,
  input: Partial<CreateProfileInput>,
): Promise<ApiResponse<User>> {
  if (input.displayName !== undefined && input.displayName.trim().length === 0) {
    return { success: false, error: '表示名は必須です' }
  }

  const user = await queries.updateUser(userId, {
    displayName: input.displayName?.trim(),
    bio: input.bio?.trim(),
    iconUrl: input.iconUrl,
  })

  return { success: true, data: user }
}
