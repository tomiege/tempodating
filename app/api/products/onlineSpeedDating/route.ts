import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import { z } from 'zod';

// Schema for price entries in the JSON
const PriceEntrySchema = z.object({
  price: z.number().int().nonnegative(),
  gender: z.string().min(1),
  daysBeforeEvent: z.number().int().nonnegative(),
});

// Schema matching the raw JSON structure (uses eventId and prices array)
const RawOnlineSpeedDatingEventSchema = z.object({
  eventId: z.number().int().positive(),
  gmtdatetime: z.string().datetime(),
  title: z.string().min(1),
  country: z.string().min(1),
  city: z.string().min(1),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  timezone: z.string().min(1),
  prices: z.array(PriceEntrySchema),
  currency: z.string().length(3), // e.g., "USD"
  duration_in_minutes: z.number().int().positive(),
  soldOut: z.boolean(),
  productType: z.string().refine(val => val === 'onlineSpeedDating'),
  zoomInvite: z.string(),
  region_id: z.string().min(1),
});

const RawOnlineSpeedDatingEventsArraySchema = z.array(RawOnlineSpeedDatingEventSchema);

// Output schema exposed to consumers (transforms eventId -> productId, extracts prices)
export const OnlineSpeedDatingEventSchema = z.object({
  productId: z.number().int().positive(),
  gmtdatetime: z.string().datetime(),
  title: z.string().min(1),
  country: z.string().min(1),
  city: z.string().min(1),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  timezone: z.string().min(1),
  male_price: z.number().int().nonnegative(),
  female_price: z.number().int().nonnegative(),
  currency: z.string().length(3),
  duration_in_minutes: z.number().int().positive(),
  soldOut: z.boolean(),
  productType: z.string().refine(val => val === 'onlineSpeedDating'),
  zoomInvite: z.string(),
  region_id: z.string().min(1),
});

export type OnlineSpeedDatingEvent = z.infer<typeof OnlineSpeedDatingEventSchema>;

const OnlineSpeedDatingEventsArraySchema = z.array(OnlineSpeedDatingEventSchema);

export type OnlineSpeedDatingEvents = z.infer<typeof OnlineSpeedDatingEventsArraySchema>;

// Transform raw JSON event into the API output format
function transformEvent(raw: z.infer<typeof RawOnlineSpeedDatingEventSchema>) {
  const maleEntry = raw.prices.find(p => p.gender === 'Male');
  const femaleEntry = raw.prices.find(p => p.gender === 'Female');
  return {
    productId: raw.eventId,
    gmtdatetime: raw.gmtdatetime,
    title: raw.title,
    country: raw.country,
    city: raw.city,
    latitude: raw.latitude,
    longitude: raw.longitude,
    timezone: raw.timezone,
    male_price: maleEntry?.price ?? 0,
    female_price: femaleEntry?.price ?? 0,
    currency: raw.currency,
    duration_in_minutes: raw.duration_in_minutes,
    soldOut: raw.soldOut,
    productType: raw.productType,
    zoomInvite: raw.zoomInvite,
    region_id: raw.region_id,
  };
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    // Construct the path to the JSON file
    const filePath = path.join(
      process.cwd(),
      'public',
      'products',
      'onlineSpeedDating.json'
    );

    // Read the file
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const rawData = JSON.parse(fileContent);

    // Validate raw data against the JSON schema
    const validatedRaw = RawOnlineSpeedDatingEventsArraySchema.parse(rawData);

    // Transform to API output format (eventId -> productId, prices array -> flat fields)
    const transformedData = validatedRaw.map(transformEvent);

    // Return the transformed data
    return NextResponse.json(transformedData, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid data schema',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    // Handle file not found or parsing errors
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          error: 'Invalid JSON format',
          message: error.message,
        },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message.includes('ENOENT')) {
      return NextResponse.json(
        {
          error: 'File not found',
          message: 'onlineSpeedDating.json not found',
        },
        { status: 404 }
      );
    }

    // Generic error handling
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
