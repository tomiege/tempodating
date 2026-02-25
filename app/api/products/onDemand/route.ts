import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import * as fs from 'fs';
import * as path from 'path';
import { z } from 'zod';

// Schema Definition for OnDemand Product
export const OnDemandProductSchema = z.object({
  productId: z.number().int().positive(),
  title: z.string().min(1),
  description: z.string().min(1),
  productType: z.string().refine(val => val === 'onDemand'),
  category: z.string().min(1),
  price: z.number().int().nonnegative(),
  currency: z.string().length(3),
  imageUrl: z.string(),
  available: z.boolean(),
  featured: z.boolean(),
  downloadUrl: z.string(),
});

export type OnDemandProduct = z.infer<typeof OnDemandProductSchema>;

const OnDemandProductsArraySchema = z.array(OnDemandProductSchema);

export type OnDemandProducts = z.infer<typeof OnDemandProductsArraySchema>;

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    // Construct the path to the JSON file
    const filePath = path.join(
      process.cwd(),
      'public',
      'products',
      'onDemand.json'
    );

    // Read the file
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const rawData = JSON.parse(fileContent);

    // Validate against schema
    const validatedData = OnDemandProductsArraySchema.parse(rawData);

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
      tags: { source: 'api-products-onDemand' },
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
          message: 'onDemand.json not found',
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
