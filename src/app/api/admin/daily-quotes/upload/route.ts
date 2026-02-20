import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import * as XLSX from 'xlsx'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET) as { role: string }
    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File
    if (!file) {
      return NextResponse.json({ message: 'No file provided.' }, { status: 400 })
    }

    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as (string | number)[][]

    if (!rows.length) {
      return NextResponse.json({ message: 'Excel file is empty.' }, { status: 400 })
    }

    const header = (rows[0] || []).map((h) => String(h || '').toLowerCase())
    const quoteCol = header.findIndex((h) => h === 'quote' || h === 'text' || h === 'quote text')
    const authorCol = header.findIndex((h) => h === 'author' || h === 'source')
    const dataRows = rows.slice(1)

    if (quoteCol === -1) {
      return NextResponse.json({
        message: 'Excel must have a column named "Quote" or "Text". First row = headers.'
      }, { status: 400 })
    }

    let added = 0
    for (const row of dataRows) {
      const text = row[quoteCol] != null ? String(row[quoteCol]).trim() : ''
      if (!text) continue
      const author = authorCol >= 0 && row[authorCol] != null ? String(row[authorCol]).trim() || null : null
      await prisma.dailyQuote.create({
        data: { text, author }
      })
      added++
    }

    return NextResponse.json({ message: `${added} quote(s) added.`, added })
  } catch (e) {
    console.error('[DAILY_QUOTES_UPLOAD]', e)
    return NextResponse.json({ message: 'Upload failed.' }, { status: 500 })
  }
}
