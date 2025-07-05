import { NextRequest, NextResponse } from 'next/server';
import { getSocketServer } from '@/lib/socket-server';



export async function GET() {
  return NextResponse.json({ 
    message: 'Socket.IO endpoint',
    status: 'ready'
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true'
    }
  });
} 