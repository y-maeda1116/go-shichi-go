import type { R2Bucket } from '@cloudflare/workers-types'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export async function uploadImage(
  bucket: R2Bucket,
  file: File,
): Promise<{ key: string; url: string }> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('ファイルサイズは5MB以下にしてください')
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('JPEG、PNG、WebP、GIFのみアップロード可能です')
  }

  const ext = file.type.split('/')[1]
  const key = `uploads/${crypto.randomUUID()}.${ext}`
  const arrayBuffer = await file.arrayBuffer()
  await bucket.put(key, arrayBuffer, {
    httpMetadata: { contentType: file.type },
  })

  return { key, url: `/${key}` }
}

export async function deleteImage(bucket: R2Bucket, key: string): Promise<void> {
  await bucket.delete(key)
}
