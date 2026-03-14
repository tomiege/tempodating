import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import * as fs from 'fs';
import * as path from 'path';
import { z } from 'zod';

// Shared event schema — reads from events.json and filters by productType
const EventSchema = z.object({
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
  productType: z.string(),
  zoomInvite: z.string(),
  region_id: z.string().min(1),
});

const EventsArraySchema = z.array(EventSchema);

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const filePath = path.join(
      process.cwd(),
      'public',
      'products',
      'events.json'
    );

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const rawData = JSON.parse(fileContent);

    const allEvents = EventsArraySchema.parse(rawData);
    const filtered = allEvents.filter(e => e.productType === 'workshop');

    return NextResponse.json(filtered, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    Sentry.captureException(error, {
      tags: { source: 'api-products-workshop' },
    });

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid data schema',
          details: error.errors,
        },
        { status: 400 }
      );
    }

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
          message: 'events.json not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
