import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is required')
  process.exit(1)
}

const sql = neon(process.env.DATABASE_URL)
const { dailyThemes } = await import('../src/server/db/themes-schema')
const db = drizzle(sql)

const SPRING = ['桜', '春風', '霞', 'つくし', '雛菊', '春の海', '若葉', '花見', '春の月', '鶯', '梅', '春雷', '春の雨', '菜の花', '春分', 'あした咲く', 'こもれび', '春泥', '新学期', '春の川']
const SUMMER = ['蝉', '入道雲', '向日葵', '夕立', '蛍', '花火', '海', '風鈴', 'かき氷', '浴衣', '夏の月', '朝顔', '金魚', '麦わら帽子', '夏の海', 'ひまわり', '夕凪', '夜風', '流れ星', '夏休み']
const AUTUMN = ['紅葉', '月', '秋風', '栗', '柿', '稲刈り', '秋の空', '菊', '虫の声', '十五夜', '秋の雨', '彼岸花', '秋の朝', 'もみじ', '秋晴れ', '夜長', '秋の川', '松茸', 'ススキ', '秋分']
const WINTER = ['雪', '椿', '冬の月', '氷', 'こたつ', '鍋', '初雪', '霜', '冬の海', '木枯らし', 'みかん', '暖簾', '冬の朝', '山茶花', '大晦日', '正月', '門松', '初夢', '寒椿', '冬の星']

const SEASONS = [
  { months: [3, 4, 5], themes: SPRING },
  { months: [6, 7, 8], themes: SUMMER },
  { months: [9, 10, 11], themes: AUTUMN },
  { months: [12, 1, 2], themes: WINTER },
]

function getSeasonThemes(month: number): string[] {
  return SEASONS.find(s => s.months.includes(month))?.themes ?? SPRING
}

const start = new Date('2026-01-01')
const end = new Date('2027-12-31')
const values: { date: string; themeText: string }[] = []

for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
  const month = d.getMonth() + 1
  const dayOfYear = Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86400000)
  const themes = getSeasonThemes(month)
  const themeText = themes[dayOfYear % themes.length]
  const dateStr = d.toISOString().split('T')[0]
  values.push({ date: dateStr, themeText })
}

console.log(`Seeding ${values.length} daily themes...`)

for (const val of values) {
  await db.insert(dailyThemes).values(val).onConflictDoNothing().execute()
}

console.log('Done!')
