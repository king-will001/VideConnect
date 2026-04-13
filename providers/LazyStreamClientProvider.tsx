'use client';

import {
  type ComponentType,
  type ReactNode,
  startTransition,
  useEffect,
  useState,
} from 'react';

import StreamConfigAlert from '@/components/StreamConfigAlert';

type StreamProviderProps = {
  children: ReactNode;
  missingEnvVars?: string[];
};

const LazyStreamClientProvider = ({
  children,
  missingEnvVars = [],
}: StreamProviderProps) => {
  const [StreamProvider, setStreamProvider] =
    useState<ComponentType<StreamProviderProps> | null>(null);

  useEffect(() => {
    if (missingEnvVars.length > 0) return;

    let isMounted = true;

    void import('@/providers/StreamClientProvider')
      .then((module) => {
        if (!isMounted) return;

        startTransition(() => {
          setStreamProvider(() => module.default);
        });
      })
      .catch((error) => {
        console.error('Failed to load Stream video provider', error);
      });

    return () => {
      isMounted = false;
    };
  }, [missingEnvVars.length]);

  if (missingEnvVars.length > 0) {
    return <StreamConfigAlert missingEnvVars={missingEnvVars} />;
  }

  if (!StreamProvider) return <>{children}</>;

  return (
    <StreamProvider missingEnvVars={missingEnvVars}>
      {children}
    </StreamProvider>
  );
};

export default LazyStreamClientProvider;
