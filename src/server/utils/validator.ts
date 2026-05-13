interface ValidationResult {
  valid: boolean
  errors: string[]
}

interface HaikuInput {
  line1: string
  line2: string
  line3: string
}

interface TankaInput extends HaikuInput {
  line4: string
  line5: string
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

export function validateHaiku(input: HaikuInput): ValidationResult {
  const errors: string[] = []

  if (countChars(input.line1) !== 5) {
    errors.push('上句の上（5文字）が5文字ではありません')
  }
  if (countChars(input.line2) !== 7) {
    errors.push('上句の中（7文字）が7文字ではありません')
  }
  if (countChars(input.line3) !== 5) {
    errors.push('上句の下（5文字）が5文字ではありません')
  }

  return { valid: errors.length === 0, errors }
}

export function validateTanka(input: TankaInput): ValidationResult {
  const haikuResult = validateHaiku(input)
  const errors = [...haikuResult.errors]

  if (countChars(input.line4) !== 7) {
    errors.push('下句の上（7文字）が7文字ではありません')
  }
  if (countChars(input.line5) !== 7) {
    errors.push('下句の下（7文字）が7文字ではありません')
  }

  return { valid: errors.length === 0, errors }
}

export function validatePost(input: PostInput): PostValidationResult {
  const hasLine4 = input.line4 !== undefined && input.line4 !== ''
  const hasLine5 = input.line5 !== undefined && input.line5 !== ''

  if (hasLine4 && !hasLine5) {
    return {
      valid: false,
      type: 'tanka',
      errors: ['短歌の場合は下句の下（7文字）も入力してください'],
    }
  }

  if (hasLine5 && !hasLine4) {
    return {
      valid: false,
      type: 'tanka',
      errors: ['短歌の場合は下句の上（7文字）も入力してください'],
    }
  }

  if (hasLine4 && hasLine5) {
    const result = validateTanka({
      ...input,
      line4: input.line4!,
      line5: input.line5!,
    })
    return { ...result, type: 'tanka' }
  }

  const result = validateHaiku(input)
  return { ...result, type: 'haiku' }
}
