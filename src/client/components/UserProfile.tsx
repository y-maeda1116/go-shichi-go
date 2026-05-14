import { useState } from 'react'

interface UserProfileProps {
  user: {
    id: string
    displayName: string
    bio: string | null
    iconUrl: string | null
  }
  isOwn: boolean
  initialFollowing?: boolean
  followerCount?: number
  followingCount?: number
}

export function UserProfile({ user, isOwn, initialFollowing, followerCount, followingCount }: UserProfileProps) {
  const [following, setFollowing] = useState(initialFollowing ?? false)
  const [followers, setFollowers] = useState(followerCount ?? 0)

  const handleFollow = async () => {
    if (following) {
      await fetch(`/api/follow/${user.id}`, { method: 'DELETE' })
      setFollowing(false)
      setFollowers((c) => Math.max(0, c - 1))
    } else {
      await fetch(`/api/follow/${user.id}`, { method: 'POST' })
      setFollowing(true)
      setFollowers((c) => c + 1)
    }
  }

  return (
    <div className="user-profile">
      <div className="profile-header">
        {user.iconUrl && (
          <img src={user.iconUrl} alt="" className="profile-icon" />
        )}
        <div className="profile-info">
          <h1 className="profile-display-name">{user.displayName}</h1>
          {user.bio && <p className="profile-bio">{user.bio}</p>}
          <div className="profile-stats">
            <span className="stat"><strong>{followers}</strong> フォロワー</span>
            {followingCount !== undefined && (
              <span className="stat"><strong>{followingCount}</strong> フォロー中</span>
            )}
          </div>
        </div>
        {isOwn ? (
          <a href="/profile/edit" className="btn-edit">編集</a>
        ) : (
          <button
            className={`btn-follow ${following ? 'following' : ''}`}
            onClick={handleFollow}
          >
            {following ? 'フォロー中' : 'フォロー'}
          </button>
        )}
      </div>
    </div>
  )
}
