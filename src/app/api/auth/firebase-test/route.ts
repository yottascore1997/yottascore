import { NextResponse } from 'next/server';
import { withCORS } from '@/lib/cors';

const handler = async (req: Request) => {
  try {
    console.log('🔥 Firebase test API called');
    
    const body = await req.json();
    console.log('📝 Request body:', body);
    
    // Simple response for testing
    return NextResponse.json({
      success: true,
      message: 'Firebase test API working',
      receivedData: body,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('❌ Firebase test error:', error);
    return NextResponse.json(
      { 
        error: `Test failed: ${error.message}`,
        stack: error.stack 
      },
      { status: 500 }
    );
  }
};

export const POST = withCORS(handler);
