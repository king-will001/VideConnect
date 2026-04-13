import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { StreamClient } from '@stream-io/node-sdk';

const STREAM_API_KEY = process.env.NEXT_PUBLIC_STREAM_API_KEY;
const STREAM_API_SECRET = process.env.STREAM_SECRET_KEY;

export async function POST() {
  let userId: string | null = null;

  try {
    ({ userId } = await auth());
  } catch (error) {
    console.error('Failed to authenticate Clerk user for stream token', error);

    return NextResponse.json(
      { error: 'Authentication service is unavailable' },
      { status: 503 },
    );
  }

  if (!userId) {
    return NextResponse.json(
      { error: 'User is not authenticated' },
      { status: 401 },
    );
  }

  if (!STREAM_API_KEY || !STREAM_API_SECRET) {
    return NextResponse.json(
      { error: 'Stream API credentials are missing' },
      { status: 500 },
    );
  }

  const streamClient = new StreamClient(STREAM_API_KEY, STREAM_API_SECRET);
  const expirationTime = Math.floor(Date.now() / 1000) + 3600;
  const issuedAt = Math.floor(Date.now() / 1000) - 60;
  const token = streamClient.createToken(userId, expirationTime, issuedAt);

  return NextResponse.json({
    token,
    expiresAt: expirationTime * 1000,
  });
}
