import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Fetch published blogs (public)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search')
    const tag = searchParams.get('tag')

    const whereClause: any = {
      published: true
    }

    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (tag) {
      whereClause.tags = { contains: tag }
    }

    const [blogs, total] = await Promise.all([
      prisma.blog.findMany({
        where: whereClause,
        orderBy: { publishedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          title: true,
          excerpt: true,
          imageUrl: true,
          author: true,
          publishedAt: true,
          tags: true,
          views: true,
          likes: true
        }
      }),
      prisma.blog.count({ where: whereClause })
    ])

    return NextResponse.json({
      blogs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('[BLOGS_PUBLIC_GET]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
