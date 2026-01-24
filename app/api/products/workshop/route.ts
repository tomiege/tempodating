import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Placeholder for workshop products
    // Replace with actual data fetching logic
    return NextResponse.json([])
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch workshops' },
      { status: 500 }
    )
  }
}
