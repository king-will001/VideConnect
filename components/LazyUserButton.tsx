'use client';

import {
  type ComponentType,
  startTransition,
  useEffect,
  useState,
} from 'react';

const LazyUserButton = () => {
  const [UserButton, setUserButton] = useState<ComponentType | null>(null);

  useEffect(() => {
    let isMounted = true;

    void import('@clerk/nextjs')
      .then((module) => {
        if (!isMounted) return;

        startTransition(() => {
          setUserButton(() => module.UserButton as ComponentType);
        });
      })
      .catch((error) => {
        console.error('Failed to load Clerk user button', error);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (!UserButton) {
    return (
      <div
        aria-label="Loading account menu"
        className="size-8 rounded-full bg-dark-3"
      />
    );
  }

  return <UserButton />;
};

export default LazyUserButton;
