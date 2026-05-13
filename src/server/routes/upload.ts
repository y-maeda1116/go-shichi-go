import { Hono } from 'hono'
import { authMiddleware } from '@/server/middleware/auth'
import { uploadImage } from '@/server/utils/r2'
import type { R2Bucket } from '@cloudflare/workers-types'
import type { AuthUser } from '@/types'

const upload = new Hono<{
  Variables: { user: AuthUser }
  Bindings: { R2_BUCKET: R2Bucket }
}>()

upload.post('/', authMiddleware, async (c) => {
  const formData = await c.req.formData()
  const file = formData.get('file')

  if (!file || !(file instanceof File)) {
    return c.json({ success: false, error: 'ファイルを選択してください' }, 400)
  }

  try {
    const result = await uploadImage(c.env.R2_BUCKET, file)
    return c.json({ success: true, data: result }, 201)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'アップロードに失敗しました'
    return c.json({ success: false, error: message }, 400)
  }
})

export default upload
