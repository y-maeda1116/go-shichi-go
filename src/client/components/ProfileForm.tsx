import { useState } from 'react'

interface ProfileFormProps {
  mode: 'register' | 'edit'
  email?: string
  initialData?: {
    displayName: string
    bio: string
    iconUrl: string
  }
}

export function ProfileForm({ mode, initialData }: ProfileFormProps) {
  const [displayName, setDisplayName] = useState(initialData?.displayName ?? '')
  const [bio, setBio] = useState(initialData?.bio ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return

    setSubmitting(true)
    setError('')

    try {
      const url = mode === 'register' ? '/register' : '/api/users/me'
      const method = mode === 'register' ? 'POST' : 'PUT'
      const headers: Record<string, string> = {}
      let body: FormData | string

      if (mode === 'register') {
        const formData = new FormData()
        formData.append('displayName', displayName)
        formData.append('bio', bio)
        body = formData
      } else {
        headers['Content-Type'] = 'application/json'
        body = JSON.stringify({ displayName, bio })
      }

      const res = await fetch(url, { method, headers, body })

      if (res.ok) {
        window.location.href = '/'
      } else {
        const data = await res.json() as { error?: string }
        setError(data.error || 'エラーが発生しました')
      }
    } catch {
      setError('通信エラーが発生しました')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="profile-form">
      <h2>{mode === 'register' ? 'プロフィール登録' : 'プロフィール編集'}</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>表示名</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>自己紹介</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
        </div>
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? '保存中...' : '保存'}
        </button>
      </form>
    </div>
  )
}
