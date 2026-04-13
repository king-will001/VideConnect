import { NextResponse } from 'next/server';

import { getDatabase, getMongoDatabaseName, isMongoConfigured } from '@/lib/mongodb';

export const GET = async () => {
  if (!isMongoConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        configured: false,
        message: 'Set MONGODB_URI to enable MongoDB.',
      },
      { status: 503 },
    );
  }

  try {
    const database = await getDatabase();

    await database.command({ ping: 1 });

    return NextResponse.json({
      ok: true,
      configured: true,
      database: getMongoDatabaseName(),
    });
  } catch (error) {
    console.error('MongoDB ping failed', error);

    return NextResponse.json(
      {
        ok: false,
        configured: true,
        database: getMongoDatabaseName(),
        message: 'MongoDB connection failed.',
      },
      { status: 500 },
    );
  }
};
