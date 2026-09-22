import { describe, it, expect } from 'vitest'
import { uploadImage, deleteImage } from '@/server/utils/r2'

function createMockBucket() {
  const stored = new Map<string, { body: ArrayBuffer; contentType: string }>()
  return {
    stored,
    put: async (key: string, body: ArrayBuffer, opts: { httpMetadata: { contentType: string } }) => {
      stored.set(key, { body, contentType: opts.httpMetadata.contentType })
    },
    delete: async (key: string) => {
      stored.delete(key)
    },
  }
}

function createMockFile(overrides: Partial<{ size: number; type: string; name: string }> = {}) {
  return {
    size: overrides.size ?? 1024,
    type: overrides.type ?? 'image/jpeg',
    name: overrides.name ?? 'test.jpg',
    arrayBuffer: async () => new ArrayBuffer(overrides.size ?? 1024),
  } as unknown as File
}

describe('uploadImage', () => {
  it('uploads a valid JPEG image', async () => {
    const bucket = createMockBucket()
    const file = createMockFile({ type: 'image/jpeg' })

    const result = await uploadImage(bucket as unknown as R2Bucket, file)

    expect(result.key).toMatch(/^uploads\/[0-9a-f-]+\.jpeg$/)
    expect(result.url).toBe(`/${result.key}`)
    expect(bucket.stored.has(result.key)).toBe(true)
  })

  it('uploads a valid PNG image', async () => {
    const bucket = createMockBucket()
    const file = createMockFile({ type: 'image/png' })

    const result = await uploadImage(bucket as unknown as R2Bucket, file)

    expect(result.key).toMatch(/^uploads\/[0-9a-f-]+\.png$/)
  })

  it('uploads a valid WebP image', async () => {
    const bucket = createMockBucket()
    const file = createMockFile({ type: 'image/webp' })

    const result = await uploadImage(bucket as unknown as R2Bucket, file)

    expect(result.key).toMatch(/^uploads\/[0-9a-f-]+\.webp$/)
  })

  it('uploads a valid GIF image', async () => {
    const bucket = createMockBucket()
    const file = createMockFile({ type: 'image/gif' })

    const result = await uploadImage(bucket as unknown as R2Bucket, file)

    expect(result.key).toMatch(/^uploads\/[0-9a-f-]+\.gif$/)
  })

  it('rejects files larger than 5MB', async () => {
    const bucket = createMockBucket()
    const file = createMockFile({ size: 6 * 1024 * 1024 })

    await expect(uploadImage(bucket as unknown as R2Bucket, file)).rejects.toThrow(
      'ファイルサイズは5MB以下にしてください',
    )
  })

  it('rejects files exactly at 5MB boundary', async () => {
    const bucket = createMockBucket()
    const file = createMockFile({ size: 5 * 1024 * 1024 + 1 })

    await expect(uploadImage(bucket as unknown as R2Bucket, file)).rejects.toThrow(
      'ファイルサイズは5MB以下にしてください',
    )
  })

  it('rejects unsupported file types', async () => {
    const bucket = createMockBucket()
    const file = createMockFile({ type: 'image/svg+xml' })

    await expect(uploadImage(bucket as unknown as R2Bucket, file)).rejects.toThrow(
      'JPEG、PNG、WebP、GIFのみアップロード可能です',
    )
  })

  it('rejects PDF files', async () => {
    const bucket = createMockBucket()
    const file = createMockFile({ type: 'application/pdf' })

    await expect(uploadImage(bucket as unknown as R2Bucket, file)).rejects.toThrow(
      'JPEG、PNG、WebP、GIFのみアップロード可能です',
    )
  })

  it('stores with correct content type', async () => {
    const bucket = createMockBucket()
    const file = createMockFile({ type: 'image/png' })

    const result = await uploadImage(bucket as unknown as R2Bucket, file)
    const stored = bucket.stored.get(result.key)

    expect(stored?.contentType).toBe('image/png')
  })
})

describe('deleteImage', () => {
  it('deletes an image by key', async () => {
    const bucket = createMockBucket()
    bucket.stored.set('uploads/test.jpeg', { body: new ArrayBuffer(10), contentType: 'image/jpeg' })

    await deleteImage(bucket as unknown as R2Bucket, 'uploads/test.jpeg')

    expect(bucket.stored.has('uploads/test.jpeg')).toBe(false)
  })

  it('does not throw when deleting non-existent key', async () => {
    const bucket = createMockBucket()

    await expect(deleteImage(bucket as unknown as R2Bucket, 'uploads/nonexistent.jpeg')).resolves.toBeUndefined()
  })
})
