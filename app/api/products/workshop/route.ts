import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import * as fs from 'fs';
import * as path from 'path';
import { z } from 'zod';

// Schema Definition for Workshop Product
export const WorkshopProductSchema = z.object({
  productId: z.number().int().positive(),
  title: z.string().min(1),
  description: z.string().min(1),
  productType: z.string().refine(val => val === 'workshop'),
  gmtdatetime: z.string().datetime(),
  timezone: z.string().min(1),
  duration_in_minutes: z.number().int().positive(),
  price: z.number().int().nonnegative(),
  currency: z.string().length(3),
  maxAttendees: z.number().int().positive(),
  currentAttendees: z.number().int().nonnegative(),
  instructor: z.string().min(1),
  instructorBio: z.string().min(1),
  rating: z.number().min(0).max(5),
  soldOut: z.boolean(),
  location: z.string().min(1),
  zoomInvite: z.string(),
});

export type WorkshopProduct = z.infer<typeof WorkshopProductSchema>;

const WorkshopProductsArraySchema = z.array(WorkshopProductSchema);

export type WorkshopProducts = z.infer<typeof WorkshopProductsArraySchema>;

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    // Construct the path to the JSON file
    const filePath = path.join(
      process.cwd(),
      'public',
      'products',
      'workshops.json'
    );

    // Read the file
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const rawData = JSON.parse(fileContent);

    // Validate against schema
    const validatedData = WorkshopProductsArraySchema.parse(rawData);

    // Return the validated data
    return NextResponse.json(validatedData, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    // Report all product API errors to Sentry
    Sentry.captureException(error, {
      tags: { source: 'api-products-workshop' },
    });

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
          message: 'workshops.json not found',
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
