export interface User {
  id: string
  accessEmail: string
  displayName: string
  bio: string | null
  iconUrl: string | null
  createdAt: Date
  updatedAt: Date
}

export type PostType = 'haiku' | 'tanka'

export interface Post {
  id: string
  userId: string
  type: PostType
  line1: string
  line2: string
  line3: string
  line4: string | null
  line5: string | null
  authorNote: string | null
  imageUrl: string | null
  seasonWord: string | null
  createdAt: Date
}

export interface PostWithAuthor extends Post {
  author: Pick<User, 'id' | 'displayName' | 'iconUrl'>
  likeCount: number
  likedByMe: boolean
}

export interface Like {
  id: string
  userId: string
  postId: string
  createdAt: Date
}

export interface AuthUser {
  id: string
  accessEmail: string
  displayName: string
  bio: string | null
  iconUrl: string | null
}

export interface CreatePostInput {
  line1: string
  line2: string
  line3: string
  line4?: string
  line5?: string
  authorNote?: string
  imageUrl?: string
  seasonWord?: string
}

export interface CreateProfileInput {
  displayName: string
  bio?: string
  iconUrl?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  nextCursor: string | null
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export interface FollowStatus {
  following: boolean
  followers: number
  followingCount: number
}

export interface Notification {
  id: string
  type: 'like' | 'follow'
  fromUser: Pick<User, 'id' | 'displayName' | 'iconUrl'>
  postId?: string
  createdAt: Date
  read: boolean
}
