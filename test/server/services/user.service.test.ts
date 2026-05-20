import { describe, it, expect } from 'vitest'
import { registerUser, updateProfile } from '@/server/services/user.service'
import type { User } from '@/types'

const mockUser: User = {
  id: 'u1',
  accessEmail: 'test@example.com',
  displayName: 'テストユーザー',
  bio: null,
  iconUrl: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

function createMockQueries(overrides?: {
  findUserByEmail?: () => Promise<User | null>
  findUserById?: () => Promise<User | null>
  createUser?: () => Promise<User>
  updateUser?: () => Promise<User>
}) {
  return {
    findUserByEmail: overrides?.findUserByEmail ?? (() => Promise.resolve(null)),
    findUserById: overrides?.findUserById ?? (() => Promise.resolve(mockUser)),
    createUser: overrides?.createUser ?? (() => Promise.resolve(mockUser)),
    updateUser: overrides?.updateUser ?? (() => Promise.resolve({ ...mockUser, displayName: '更新後' })),
  }
}

describe('registerUser', () => {
  it('registers a new user with valid input', async () => {
    const queries = createMockQueries()
    const result = await registerUser(queries, 'test@example.com', {
      displayName: 'テストユーザー',
      bio: '自己紹介',
    })
    expect(result.success).toBe(true)
    expect(result.data).toBeDefined()
  })

  it('rejects empty displayName', async () => {
    const queries = createMockQueries()
    const result = await registerUser(queries, 'test@example.com', {
      displayName: '',
    })
    expect(result.success).toBe(false)
    expect(result.error).toBe('表示名は必須です')
  })

  it('rejects whitespace-only displayName', async () => {
    const queries = createMockQueries()
    const result = await registerUser(queries, 'test@example.com', {
      displayName: '   ',
    })
    expect(result.success).toBe(false)
    expect(result.error).toBe('表示名は必須です')
  })

  it('rejects if user already exists', async () => {
    const queries = createMockQueries({
      findUserByEmail: () => Promise.resolve(mockUser),
    })
    const result = await registerUser(queries, 'test@example.com', {
      displayName: 'テストユーザー',
    })
    expect(result.success).toBe(false)
    expect(result.error).toBe('すでに登録されています')
  })

  it('trims displayName and bio', async () => {
    let createdData: { displayName: string; bio?: string } | null = null
    const queries = createMockQueries({
      createUser: (data) => {
        createdData = data as typeof createdData
        return Promise.resolve(mockUser)
      },
    })
    await registerUser(queries, 'test@example.com', {
      displayName: '  名前  ',
      bio: '  自己紹介  ',
    })
    expect(createdData?.displayName).toBe('名前')
    expect(createdData?.bio).toBe('自己紹介')
  })
})

describe('updateProfile', () => {
  it('updates profile with valid input', async () => {
    const queries = createMockQueries()
    const result = await updateProfile(queries, 'u1', {
      displayName: '新しい名前',
      bio: '新しい自己紹介',
    })
    expect(result.success).toBe(true)
    expect(result.data).toBeDefined()
  })

  it('rejects empty displayName', async () => {
    const queries = createMockQueries()
    const result = await updateProfile(queries, 'u1', {
      displayName: '',
    })
    expect(result.success).toBe(false)
    expect(result.error).toBe('表示名は必須です')
  })

  it('allows update without displayName (partial update)', async () => {
    const queries = createMockQueries()
    const result = await updateProfile(queries, 'u1', {
      bio: '自己紹介のみ更新',
    })
    expect(result.success).toBe(true)
  })

  it('trims displayName and bio', async () => {
    let updatedData: { displayName?: string; bio?: string } | null = null
    const queries = createMockQueries({
      updateUser: (_id, data) => {
        updatedData = data as typeof updatedData
        return Promise.resolve({ ...mockUser, ...data })
      },
    })
    await updateProfile(queries, 'u1', {
      displayName: '  名前  ',
      bio: '  自己紹介  ',
    })
    expect(updatedData?.displayName).toBe('名前')
    expect(updatedData?.bio).toBe('自己紹介')
  })
})
