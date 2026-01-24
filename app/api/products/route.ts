import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ 
    message: 'Products API',
    endpoints: [
      '/api/products/onlineSpeedDating',
      '/api/products/workshop'
    ]
  })
}
