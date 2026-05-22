import { useState } from 'react'

interface ShareImageModalProps {
  postId: string
  onClose: () => void
}

export function ShareImageModal({ postId, onClose }: ShareImageModalProps) {
  const [style, setStyle] = useState<'washi' | 'modern'>('washi')

  const handleDownload = async () => {
    const url = `/api/posts/${postId}/share-image?style=${style}`
    const link = document.createElement('a')
    link.href = url
    link.download = `575-${postId}-${style}.svg`
    link.click()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>画像でシェア</h2>

        <div className="share-style-options">
          <button
            className={`share-style-btn ${style === 'washi' ? 'active' : ''}`}
            onClick={() => setStyle('washi')}
          >
            <img src={`/api/posts/${postId}/share-image?style=washi`} alt="和紙風" className="share-preview" />
            <span>和紙風</span>
          </button>
          <button
            className={`share-style-btn ${style === 'modern' ? 'active' : ''}`}
            onClick={() => setStyle('modern')}
          >
            <img src={`/api/posts/${postId}/share-image?style=modern`} alt="モダン" className="share-preview" />
            <span>モダン</span>
          </button>
        </div>

        <div className="share-actions">
          <button className="btn-primary" onClick={handleDownload}>ダウンロード</button>
          <button className="btn-cancel" onClick={onClose}>閉じる</button>
        </div>
      </div>
    </div>
  )
}
