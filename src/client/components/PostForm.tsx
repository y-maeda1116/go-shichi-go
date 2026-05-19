import { useState, useCallback } from 'react'

interface PostFormProps {
  onSubmit: (data: {
    line1: string
    line2: string
    line3: string
    line4?: string
    line5?: string
  }) => Promise<void>
}

interface LineField {
  label: string
  expected: number
  key: string
}

const UPPER_LINES: LineField[] = [
  { label: '上', expected: 5, key: 'line1' },
  { label: '中', expected: 7, key: 'line2' },
  { label: '下', expected: 5, key: 'line3' },
]

const LOWER_LINES: LineField[] = [
  { label: '下句上', expected: 7, key: 'line4' },
  { label: '下句下', expected: 7, key: 'line5' },
]

function countChars(text: string): number {
  return [...text].length
}

export function PostForm({ onSubmit }: PostFormProps) {
  const [values, setValues] = useState({
    line1: '', line2: '', line3: '', line4: '', line5: '',
  })
  const [expanded, setExpanded] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const hasLowerLines = values.line4.length > 0 || values.line5.length > 0

  const handleChange = useCallback((key: string, value: string) => {
    setValues(prev => ({ ...prev, [key]: value }))
  }, [])

  const isValid = () => {
    const hasContent = (key: string) => countChars(values[key as keyof typeof values]) > 0
    const upperValid = UPPER_LINES.every((f) => hasContent(f.key))
    if (!hasLowerLines) return upperValid
    return upperValid && LOWER_LINES.every((f) => hasContent(f.key))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid() || submitting) return

    setSubmitting(true)
    try {
      const data: Record<string, string> = {
        line1: values.line1,
        line2: values.line2,
        line3: values.line3,
      }
      if (hasLowerLines) {
        data.line4 = values.line4
        data.line5 = values.line5
      }
      await onSubmit(data as Parameters<typeof onSubmit>[0])
      setValues({ line1: '', line2: '', line3: '', line4: '', line5: '' })
      setExpanded(false)
    } finally {
      setSubmitting(false)
    }
  }

  const renderLineInput = (field: LineField) => {
    const value = values[field.key as keyof typeof values]
    const charCount = countChars(value)

    return (
      <div key={field.key} className="post-line-input">
        <input
          type="text"
          value={value}
          onChange={(e) => handleChange(field.key, e.target.value)}
          placeholder={field.label}
        />
        <span className="char-count">{charCount}</span>
      </div>
    )
  }

  return (
    <div className="post-form">
      <button
        className="post-form-toggle"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? '閉じる' : '投稿する'}
      </button>
      <form onSubmit={handleSubmit} className={`post-form-body ${expanded ? '' : 'hidden'}`}>
        <span className="post-type-badge">
          {hasLowerLines ? '短歌' : '俳句'}
        </span>
        {UPPER_LINES.map(renderLineInput)}
        {LOWER_LINES.map(renderLineInput)}
        <div className="post-form-actions">
          <button type="submit" className="btn-primary" disabled={!isValid() || submitting}>
            {submitting ? '投稿中...' : '投稿'}
          </button>
        </div>
      </form>
    </div>
  )
}
