/**
 * SSR で生成する HTML / インライン script に安全に文字列を埋め込むためのユーティリティ。
 */

/** HTML テキスト・属性値コンテキスト用のエスケープ。 */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * 値をインライン <script> 内に埋め込み可能な JSON 文字列にする。
 * JSON.stringify は `<` をエスケープしないため、`</script>` による
 * ブレイクアウトを `<` エスケープで防ぐ。
 */
export function toJsonForScript(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}
