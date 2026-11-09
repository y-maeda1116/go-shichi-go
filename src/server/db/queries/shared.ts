import type { NeonHttpDatabase } from 'drizzle-orm/neon-http'
import * as schema from '../schema'

export type Db = NeonHttpDatabase<typeof schema>
