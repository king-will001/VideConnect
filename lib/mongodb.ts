import { Db, MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'yoom';

type MongoCache = {
  client: MongoClient | null;
  promise: Promise<MongoClient> | null;
};

declare global {
  var _mongoCache: MongoCache | undefined;
}

const globalCache = globalThis._mongoCache ?? {
  client: null,
  promise: null,
};

if (!globalThis._mongoCache) {
  globalThis._mongoCache = globalCache;
}

export const isMongoConfigured = () => Boolean(MONGODB_URI);

export const getMongoClient = async () => {
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is not configured');
  }

  if (globalCache.client) {
    return globalCache.client;
  }

  if (!globalCache.promise) {
    globalCache.promise = new MongoClient(MONGODB_URI).connect();
  }

  globalCache.client = await globalCache.promise;

  return globalCache.client;
};

export const getDatabase = async (): Promise<Db> => {
  const client = await getMongoClient();

  return client.db(MONGODB_DB);
};

export const getMongoDatabaseName = () => MONGODB_DB;
