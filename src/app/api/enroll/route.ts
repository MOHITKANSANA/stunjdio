
import { submitEnrollmentAction } from '@/app/actions/enrollment';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // We are not using the API route anymore, but keeping it for now.
    // Logic is now in the server action.
    return NextResponse.json({ success: false, error: 'This endpoint is deprecated.' }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
