'use client';

import {
  ReactNode,
  startTransition,
  useEffect,
  useState,
} from 'react';
import { StreamVideoClient, StreamVideo } from '@stream-io/video-react-sdk';
import { useUser } from '@clerk/nextjs';

import StreamConfigAlert from '@/components/StreamConfigAlert';
import {
  resetStreamTokenCache,
  STREAM_CLIENT_OPTIONS,
  tokenProvider,
} from '@/lib/stream';

const STREAM_CLIENT_DISCONNECT_DELAY_MS = 250;
const pendingStreamDisconnects = new Map<
  string,
  { client: StreamVideoClient; timeoutId: number }
>();

type ClientState = {
  client: StreamVideoClient;
  key: string;
};

const StreamVideoProvider = ({
  children,
  missingEnvVars = [],
}: {
  children: ReactNode;
  missingEnvVars?: string[];
}) => {
  const { user, isLoaded } = useUser();
  const userId = user?.id;
  const userName = user?.username || user?.firstName || userId;
  const userImage = user?.imageUrl;
  const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
  const clientKey = apiKey && userId ? `${apiKey}/${userId}` : undefined;
  const [clientState, setClientState] = useState<ClientState | null>(null);

  useEffect(() => {
    resetStreamTokenCache();
  }, [clientKey]);

  useEffect(() => {
    if (
      missingEnvVars.length > 0 ||
      !isLoaded ||
      !userId ||
      !apiKey ||
      !clientKey
    ) {
      return;
    }

    const pendingDisconnect = pendingStreamDisconnects.get(clientKey);
    if (pendingDisconnect) {
      window.clearTimeout(pendingDisconnect.timeoutId);
      pendingStreamDisconnects.delete(clientKey);
    }

    let isActive = true;
    const client = StreamVideoClient.getOrCreateInstance({
      apiKey,
      user: {
        id: userId,
        name: userName,
        image: userImage,
      },
      tokenProvider,
      options: STREAM_CLIENT_OPTIONS,
    });

    queueMicrotask(() => {
      if (!isActive) return;

      startTransition(() => {
        setClientState({ client, key: clientKey });
      });
    });

    return () => {
      isActive = false;

      const timeoutId = window.setTimeout(() => {
        const activeDisconnect = pendingStreamDisconnects.get(clientKey);
        if (
          !activeDisconnect ||
          activeDisconnect.client !== client ||
          activeDisconnect.timeoutId !== timeoutId
        ) {
          return;
        }

        pendingStreamDisconnects.delete(clientKey);
        void client.disconnectUser();
      }, STREAM_CLIENT_DISCONNECT_DELAY_MS);

      pendingStreamDisconnects.set(clientKey, {
        client,
        timeoutId,
      });
    };
  }, [apiKey, clientKey, isLoaded, missingEnvVars.length, userId, userImage, userName]);

  const videoClient =
    clientState && clientState.key === clientKey
      ? clientState.client
      : undefined;

  if (missingEnvVars.length > 0) {
    return <StreamConfigAlert missingEnvVars={missingEnvVars} />;
  }

  if (!videoClient) return <>{children}</>;

  return <StreamVideo client={videoClient}>{children}</StreamVideo>;
};

export default StreamVideoProvider;
