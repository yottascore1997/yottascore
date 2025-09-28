import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// GET - Fetch single blog
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const blog = await prisma.blog.findUnique({
      where: { id: params.id }
    })

    if (!blog) {
      return new NextResponse('Blog not found', { status: 404 })
    }

    return NextResponse.json(blog)
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return new NextResponse('Invalid token', { status: 401 })
    }
    console.error('[BLOG_GET]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

// PUT - Update blog
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const existingBlog = await prisma.blog.findUnique({
      where: { id: params.id }
    })

    if (!existingBlog) {
      return new NextResponse('Blog not found', { status: 404 })
    }

    const blog = await prisma.blog.update({
      where: { id: params.id },
      data: {
        title,
        content,
        excerpt,
        imageUrl,
        author,
        published,
        publishedAt: published && !existingBlog.published ? new Date() : existingBlog.publishedAt,
        tags: tags || ''
      }
    })

    console.log('✅ Blog updated successfully:', blog.id)
    return NextResponse.json(blog)
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return new NextResponse('Invalid token', { status: 401 })
    }
    console.error('[BLOG_PUT]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

// DELETE - Delete blog
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const existingBlog = await prisma.blog.findUnique({
      where: { id: params.id }
    })

    if (!existingBlog) {
      return new NextResponse('Blog not found', { status: 404 })
    }

    await prisma.blog.delete({
      where: { id: params.id }
    })

    console.log('✅ Blog deleted successfully:', params.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return new NextResponse('Invalid token', { status: 401 })
    }
    console.error('[BLOG_DELETE]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
