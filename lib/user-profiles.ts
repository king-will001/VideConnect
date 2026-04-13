import { Collection } from 'mongodb';

import { getDatabase, isMongoConfigured } from '@/lib/mongodb';

export interface UserProfileDocument {
  clerkUserId: string;
  email: string | null;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

type UserProfileInput = Omit<UserProfileDocument, 'createdAt' | 'updatedAt'>;

let userProfilesCollectionPromise: Promise<Collection<UserProfileDocument>> | null =
  null;

const getUserProfilesCollection = async () => {
  if (!userProfilesCollectionPromise) {
    userProfilesCollectionPromise = (async () => {
      const database = await getDatabase();
      const collection =
        database.collection<UserProfileDocument>('users');

      await collection.createIndex({ clerkUserId: 1 }, { unique: true });

      return collection;
    })();
  }

  return userProfilesCollectionPromise;
};

export const syncUserProfile = async (user: UserProfileInput) => {
  if (!isMongoConfigured()) {
    return { skipped: true as const };
  }

  const collection = await getUserProfilesCollection();
  const now = new Date();

  await collection.updateOne(
    { clerkUserId: user.clerkUserId },
    {
      $set: {
        ...user,
        updatedAt: now,
      },
      $setOnInsert: {
        createdAt: now,
      },
    },
    { upsert: true },
  );

  return { skipped: false as const };
};
