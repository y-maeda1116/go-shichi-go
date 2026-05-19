interface ValidationResult {
  valid: boolean
  errors: string[]
}

interface HaikuInput {
  line1: string
  line2: string
  line3: string
}

interface PostInput extends HaikuInput {
  line4?: string
  line5?: string
}

interface PostValidationResult extends ValidationResult {
  type: 'haiku' | 'tanka'
}

function countChars(text: string): number {
  return [...text].length
}

export function validatePost(input: PostInput): PostValidationResult {
  const errors: string[] = []
  const hasLine4 = input.line4 !== undefined && input.line4 !== ''
  const hasLine5 = input.line5 !== undefined && input.line5 !== ''

  if (hasLine4 && !hasLine5) {
    return { valid: false, type: 'tanka', errors: ['下句の下も入力してください'] }
  }
  if (hasLine5 && !hasLine4) {
    return { valid: false, type: 'tanka', errors: ['下句の上も入力してください'] }
  }

  if (countChars(input.line1) === 0) errors.push('上を入力してください')
  if (countChars(input.line2) === 0) errors.push('中を入力してください')
  if (countChars(input.line3) === 0) errors.push('下を入力してください')

  if (hasLine4 && hasLine5) {
    if (countChars(input.line4!) === 0) errors.push('下句上を入力してください')
    if (countChars(input.line5!) === 0) errors.push('下句下を入力してください')
    return { valid: errors.length === 0, type: 'tanka', errors }
  }

  return { valid: errors.length === 0, type: 'haiku', errors }
}
