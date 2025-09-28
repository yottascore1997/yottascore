import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Fetch single published blog (public)
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const blog = await prisma.blog.findFirst({
      where: { 
        id: params.id,
        published: true 
      }
    })

    if (!blog) {
      return new NextResponse('Blog not found', { status: 404 })
    }

    // Increment view count
    await prisma.blog.update({
      where: { id: params.id },
      data: { views: { increment: 1 } }
    })

    return NextResponse.json(blog)
  } catch (error) {
    console.error('[BLOG_PUBLIC_GET]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
