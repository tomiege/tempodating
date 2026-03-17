import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const placeId = request.nextUrl.searchParams.get("place_id")

  if (!placeId) {
    return NextResponse.json({ error: "place_id required" }, { status: 400 })
  }

  const apiKey = process.env.GOOGLEMAPS_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 })
  }

  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json")
  url.searchParams.set("place_id", placeId)
  url.searchParams.set("key", apiKey)

  const res = await fetch(url.toString())
  const data = await res.json()

  if (!data.results || data.results.length === 0) {
    return NextResponse.json({ error: "No results found" }, { status: 404 })
  }

  const location = data.results[0].geometry.location

  return NextResponse.json({
    lat: location.lat,
    lng: location.lng,
    formatted_address: data.results[0].formatted_address,
  })
}
