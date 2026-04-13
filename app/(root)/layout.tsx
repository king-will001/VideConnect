import { ReactNode } from 'react';

import LazyStreamClientProvider from '@/providers/LazyStreamClientProvider';

const RootLayout = async ({
  children,
}: Readonly<{ children: ReactNode }>) => {
  const missingStreamEnvVars = [
    !process.env.NEXT_PUBLIC_STREAM_API_KEY && 'NEXT_PUBLIC_STREAM_API_KEY',
    !process.env.STREAM_SECRET_KEY && 'STREAM_SECRET_KEY',
  ].filter(Boolean) as string[];

  return (
    <main>
      <LazyStreamClientProvider missingEnvVars={missingStreamEnvVars}>
        {children}
      </LazyStreamClientProvider>
    </main>
  );
};

export default RootLayout;
