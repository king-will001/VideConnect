'use client';

import { useEffect, useMemo, useState } from 'react';

import { getMeetingLink, toAbsoluteUrl } from '@/lib/meeting';

export const useMeetingLink = (meetingId: string, query = '') => {
  const [hasMounted, setHasMounted] = useState(false);
  const relativeLink = useMemo(
    () => getMeetingLink(meetingId, query, { absolute: false }),
    [meetingId, query],
  );

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return getMeetingLink(meetingId, query);
  }

  return toAbsoluteUrl(relativeLink);
};

export const useResolvedUrl = (url: string) => {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  return hasMounted ? toAbsoluteUrl(url) : url;
};
