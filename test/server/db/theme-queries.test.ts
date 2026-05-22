import { describe, it, expect } from 'vitest'
import { getThemeByDate, getTodayTheme } from '@/server/db/queries'

function createMockDb(theme: any) {
  return {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: () => Promise.resolve(theme ? [theme] : []),
        }),
      }),
    }),
  } as any
}

describe('theme queries', () => {
  it('getThemeByDate returns theme for given date', async () => {
    const mockTheme = {
      id: '1',
      date: '2026-05-22',
      themeText: '五月晴れ',
      description: '初夏の美しい天気',
      createdAt: new Date(),
    }
    const db = createMockDb(mockTheme)
    const result = await getThemeByDate(db, '2026-05-22')
    expect(result).toEqual(mockTheme)
  })

  it('getThemeByDate returns null when not found', async () => {
    const db = createMockDb(null)
    const result = await getThemeByDate(db, '2099-01-01')
    expect(result).toBeNull()
  })

  it('getTodayTheme returns theme for today', async () => {
    const today = new Date().toISOString().split('T')[0]
    const mockTheme = {
      id: '2',
      date: today,
      themeText: '蝉',
      description: null,
      createdAt: new Date(),
    }
    const db = createMockDb(mockTheme)
    const result = await getTodayTheme(db)
    expect(result).toEqual(mockTheme)
  })

  it('getTodayTheme returns null when no theme', async () => {
    const db = createMockDb(null)
    const result = await getTodayTheme(db)
    expect(result).toBeNull()
  })
})
