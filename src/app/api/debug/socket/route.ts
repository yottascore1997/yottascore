import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Test socket server connectivity
    const socketUrl = 'http://localhost:3001';
    
    const response = await fetch(socketUrl, {
      method: 'GET',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      }
    });

    if (response.ok) {
      return NextResponse.json({
        status: 'success',
        message: 'Socket server is running',
        socketUrl
      });
    } else {
      return NextResponse.json({
        status: 'error',
        message: 'Socket server is not responding',
        statusCode: response.status
      });
    }
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'Failed to connect to socket server',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 