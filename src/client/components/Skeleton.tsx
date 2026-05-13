export function Skeleton({ width, height }: { width?: string; height?: string }) {
  return (
    <div
      className="skeleton"
      style={{ width: width ?? '100%', height: height ?? '20px' }}
    />
  )
}

export function PostCardSkeleton() {
  return (
    <article className="post-card skeleton-card">
      <div className="skeleton-lines">
        <div className="skeleton skeleton-line" style={{ width: '24px', height: '120px' }} />
        <div className="skeleton skeleton-line" style={{ width: '24px', height: '168px' }} />
        <div className="skeleton skeleton-line" style={{ width: '24px', height: '120px' }} />
      </div>
      <div className="post-meta">
        <Skeleton width="80px" height="14px" />
        <Skeleton width="40px" height="24px" />
      </div>
    </article>
  )
}

export function TimelineSkeleton() {
  return (
    <div className="timeline-posts">
      {Array.from({ length: 4 }, (_, i) => (
        <PostCardSkeleton key={i} />
      ))}
    </div>
  )
}
