import { prisma } from '@/lib/prisma'

type ConversationPartner = {
  latestMessage: {
    id: string
    content: string
    messageType: string
    fileUrl: string | null
    isRead: boolean
    createdAt: Date
    senderId: string
    receiverId: string
  } | null
  unreadCount: number
}

/** Build conversation list from recent messages (same semantics as before). */
export function buildConversationsFromMessages(
  messages: Array<{
    id: string
    content: string
    messageType: string
    fileUrl: string | null
    isRead: boolean
    createdAt: Date
    senderId: string
    receiverId: string
  }>,
  currentUserId: string
): Map<string, ConversationPartner> {
  const conversationPartners = new Map<string, ConversationPartner>()

  for (const message of messages) {
    const otherUserId =
      message.senderId === currentUserId ? message.receiverId : message.senderId

    if (!conversationPartners.has(otherUserId)) {
      conversationPartners.set(otherUserId, {
        latestMessage: message,
        unreadCount: 0,
      })
    }

    if (message.receiverId === currentUserId && !message.isRead) {
      const conversation = conversationPartners.get(otherUserId)!
      conversation.unreadCount += 1
    }
  }

  return conversationPartners
}

/** Initial load: latest message per partner + unread counts (replaces scanning 1000 rows). */
export async function loadConversationPartnersInitial(
  currentUserId: string
): Promise<Map<string, ConversationPartner>> {
  const latestMessages = await prisma.$queryRaw<
    Array<{
      id: string
      content: string
      messageType: string
      fileUrl: string | null
      isRead: boolean
      createdAt: Date
      senderId: string
      receiverId: string
    }>
  >`
    SELECT dm.id, dm.content, dm.messageType, dm.fileUrl, dm.isRead, dm.createdAt, dm.senderId, dm.receiverId
    FROM DirectMessage dm
    INNER JOIN (
      SELECT
        CASE WHEN senderId = ${currentUserId} THEN receiverId ELSE senderId END AS partnerId,
        MAX(createdAt) AS maxCreatedAt
      FROM DirectMessage
      WHERE senderId = ${currentUserId} OR receiverId = ${currentUserId}
      GROUP BY partnerId
    ) latest ON (
      (dm.senderId = ${currentUserId} AND dm.receiverId = latest.partnerId)
      OR (dm.receiverId = ${currentUserId} AND dm.senderId = latest.partnerId)
    ) AND dm.createdAt = latest.maxCreatedAt
  `

  const conversationPartners = new Map<string, ConversationPartner>()
  for (const message of latestMessages) {
    const otherUserId =
      message.senderId === currentUserId ? message.receiverId : message.senderId
    if (!conversationPartners.has(otherUserId)) {
      conversationPartners.set(otherUserId, {
        latestMessage: message,
        unreadCount: 0,
      })
    }
  }

  const unreadRows = await prisma.$queryRaw<Array<{ partnerId: string; unreadCount: bigint }>>`
    SELECT senderId AS partnerId, COUNT(*) AS unreadCount
    FROM DirectMessage
    WHERE receiverId = ${currentUserId} AND isRead = false
    GROUP BY senderId
  `

  for (const row of unreadRows) {
    const existing = conversationPartners.get(row.partnerId)
    const unreadCount = Number(row.unreadCount)
    if (existing) {
      existing.unreadCount = unreadCount
    } else {
      conversationPartners.set(row.partnerId, {
        latestMessage: null,
        unreadCount,
      })
    }
  }

  return conversationPartners
}

export async function mergeStudyPartnerMatches(
  conversationPartners: Map<string, ConversationPartner>,
  currentUserId: string
) {
  const matches = await prisma.studyPartnerMatch.findMany({
    where: {
      OR: [{ user1Id: currentUserId }, { user2Id: currentUserId }],
      unmatchedAt: null,
    },
    select: { user1Id: true, user2Id: true },
  })

  for (const m of matches) {
    const otherUserId = m.user1Id === currentUserId ? m.user2Id : m.user1Id
    if (!conversationPartners.has(otherUserId)) {
      conversationPartners.set(otherUserId, { latestMessage: null, unreadCount: 0 })
    }
  }
}

export function sortConversations(
  partners: Array<{ id: string; name: string; profilePhoto: string | null }>,
  conversationPartners: Map<string, ConversationPartner>
) {
  return partners
    .map((partner) => {
      const convoData = conversationPartners.get(partner.id)!
      return {
        user: partner,
        latestMessage: convoData.latestMessage,
        unreadCount: convoData.unreadCount,
      }
    })
    .sort((a, b) => {
      const aNoChat = !a.latestMessage
      const bNoChat = !b.latestMessage
      if (aNoChat && !bNoChat) return -1
      if (!aNoChat && bNoChat) return 1
      if (aNoChat && bNoChat) return 0
      return (
        new Date(b.latestMessage.createdAt).getTime() -
        new Date(a.latestMessage.createdAt).getTime()
      )
    })
}
