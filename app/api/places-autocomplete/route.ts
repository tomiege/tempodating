import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const input = request.nextUrl.searchParams.get("input")
  
  if (!input || input.length < 2) {
    return NextResponse.json({ predictions: [] })
  }

  const apiKey = process.env.GOOGLEMAPS_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 })
  }

  const url = new URL("https://maps.googleapis.com/maps/api/place/autocomplete/json")
  url.searchParams.set("input", input)
  url.searchParams.set("types", "address")
  url.searchParams.set("key", apiKey)

  const res = await fetch(url.toString())
  const data = await res.json()

  return NextResponse.json({
    predictions: (data.predictions || []).map((p: { description: string; place_id: string }) => ({
      description: p.description,
      place_id: p.place_id,
    })),
  })
}
