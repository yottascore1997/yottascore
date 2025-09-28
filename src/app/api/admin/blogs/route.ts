import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// GET - Fetch all blogs (admin)
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string }

    if (decoded.role !== 'ADMIN') {
      return new NextResponse('Forbidden', { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status') // 'published', 'draft', 'all'

    const whereClause: any = {}
    if (status && status !== 'all') {
      if (status === 'published') {
        whereClause.published = true
      } else if (status === 'draft') {
        whereClause.published = false
      }
    }

    const [blogs, total] = await Promise.all([
      prisma.blog.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
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
    if (error instanceof jwt.JsonWebTokenError) {
      return new NextResponse('Invalid token', { status: 401 })
    }
    console.error('[BLOGS_GET]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

// POST - Create new blog
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string }

    if (decoded.role !== 'ADMIN') {
      return new NextResponse('Forbidden', { status: 403 })
    }

    const body = await req.json()
    const { title, content, excerpt, imageUrl, author, published, tags } = body

    if (!title || !content || !author) {
      return new NextResponse('Title, content, and author are required', { status: 400 })
    }

    const blog = await prisma.blog.create({
      data: {
        title,
        content,
        excerpt,
        imageUrl,
        author,
        published: published || false,
        publishedAt: published ? new Date() : null,
        tags: tags || ''
      }
    })

    console.log('✅ Blog created successfully:', blog.id)
    return NextResponse.json(blog)
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return new NextResponse('Invalid token', { status: 401 })
    }
    console.error('[BLOG_POST]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
