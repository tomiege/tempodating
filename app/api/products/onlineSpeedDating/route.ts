import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import { z } from 'zod';

// Schema Definition for OnlineSpeedDatingEvent
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
  currency: z.string().length(3), // e.g., "USD"
  duration_in_minutes: z.number().int().positive(),
  soldOut: z.boolean(),
  eventType: z.string().refine(val => val === 'onlineSpeedDating'),
  zoomInvite: z.string(),
  region_id: z.string().min(1),
});

export type OnlineSpeedDatingEvent = z.infer<typeof OnlineSpeedDatingEventSchema>;

const OnlineSpeedDatingEventsArraySchema = z.array(OnlineSpeedDatingEventSchema);

export type OnlineSpeedDatingEvents = z.infer<typeof OnlineSpeedDatingEventsArraySchema>;

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

    // Validate against schema
    const validatedData = OnlineSpeedDatingEventsArraySchema.parse(rawData);

    // Return the validated data
    return NextResponse.json(validatedData, {
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
