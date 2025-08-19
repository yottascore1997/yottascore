export interface User {
  id: string
  name: string
  profilePhoto: string | null
  course: string | null
  year: number | null
}

export interface Message {
  id: string
  content: string
  messageType: MessageType
  fileUrl: string | null
  fileName?: string
  fileSize?: number
  fileType?: string
  
  // Advanced Features
  isRead: boolean
  readAt?: string
  isEdited: boolean
  editedAt?: string
  isDeleted: boolean
  deletedAt?: string
  isPinned: boolean
  pinnedAt?: string
  
  // Message Threading & Replies
  replyToId?: string
  replyTo?: Message
  replies?: Message[]
  
  // Message Reactions
  reactions: MessageReaction[]
  
  // Message Forwarding
  isForwarded: boolean
  originalSenderId?: string
  originalSender?: User
  
  createdAt: string
  updatedAt: string
  
  // Relations
  sender: User
  receiver: User
}

export interface MessageReaction {
  id: string
  reactionType: ReactionType
  createdAt: string
  user: User
}

export interface MessageRequest {
  id: string
  content: string
  messageType: MessageType
  fileUrl: string | null
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED'
  createdAt: string
  sender: User
  receiver: User
}

export interface Conversation {
  user: User
  latestMessage: Message | null
  unreadCount: number
  isTyping?: boolean
  lastSeen?: string
}

export interface TypingIndicator {
  userId: string
  userName: string
  isTyping: boolean
}

export interface ChatSearchResult {
  messages: Message[]
  totalCount: number
  hasMore: boolean
}

export interface ChatFilters {
  messageType?: MessageType[]
  dateRange?: {
    start: string
    end: string
  }
  hasReactions?: boolean
  isPinned?: boolean
  isForwarded?: boolean
}

export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  FILE = 'FILE',
  DOCUMENT = 'DOCUMENT',
  LOCATION = 'LOCATION',
  VOICE_NOTE = 'VOICE_NOTE',
  STICKER = 'STICKER',
  SYSTEM = 'SYSTEM'
}

export enum ReactionType {
  LIKE = 'LIKE',
  LOVE = 'LOVE',
  LAUGH = 'LAUGH',
  WOW = 'WOW',
  SAD = 'SAD',
  ANGRY = 'ANGRY',
  THUMBS_UP = 'THUMBS_UP',
  THUMBS_DOWN = 'THUMBS_DOWN',
  HEART = 'HEART',
  CLAP = 'CLAP',
  CELEBRATE = 'CELEBRATE'
}

export const REACTION_EMOJIS: Record<ReactionType, string> = {
  [ReactionType.LIKE]: '👍',
  [ReactionType.LOVE]: '❤️',
  [ReactionType.LAUGH]: '😂',
  [ReactionType.WOW]: '😮',
  [ReactionType.SAD]: '😢',
  [ReactionType.ANGRY]: '😠',
  [ReactionType.THUMBS_UP]: '👍',
  [ReactionType.THUMBS_DOWN]: '👎',
  [ReactionType.HEART]: '💖',
  [ReactionType.CLAP]: '👏',
  [ReactionType.CELEBRATE]: '🎉'
}

export const REACTION_COLORS: Record<ReactionType, string> = {
  [ReactionType.LIKE]: 'bg-blue-500',
  [ReactionType.LOVE]: 'bg-red-500',
  [ReactionType.LAUGH]: 'bg-yellow-500',
  [ReactionType.WOW]: 'bg-purple-500',
  [ReactionType.SAD]: 'bg-gray-500',
  [ReactionType.ANGRY]: 'bg-orange-500',
  [ReactionType.THUMBS_UP]: 'bg-green-500',
  [ReactionType.THUMBS_DOWN]: 'bg-red-600',
  [ReactionType.HEART]: 'bg-pink-500',
  [ReactionType.CLAP]: 'bg-indigo-500',
  [ReactionType.CELEBRATE]: 'bg-yellow-400'
}
