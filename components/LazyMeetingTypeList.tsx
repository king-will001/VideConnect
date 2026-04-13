'use client';

import {
  type ComponentType,
  startTransition,
  useEffect,
  useState,
} from 'react';

import HomeCard from './HomeCard';

const fallbackCards = [
  {
    img: '/icons/add-meeting.svg',
    title: 'New Meeting',
    description: 'Start an instant Meet-style room',
  },
  {
    img: '/icons/join-meeting.svg',
    title: 'Join Meeting',
    description: 'By invitation link or meeting code',
    className: 'bg-blue-1',
  },
  {
    img: '/icons/schedule.svg',
    title: 'Schedule Meeting',
    description: 'Plan a Meet-style session',
    className: 'bg-purple-1',
  },
  {
    img: '/icons/recordings.svg',
    title: 'View Recordings',
    description: 'Watch past meeting replays',
    className: 'bg-yellow-1',
  },
];

const MeetingTypeListFallback = () => (
  <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
    {fallbackCards.map((card) => (
      <HomeCard
        key={card.title}
        img={card.img}
        title={card.title}
        description={card.description}
        className={card.className}
      />
    ))}
  </section>
);

const LazyMeetingTypeList = () => {
  const [MeetingTypeList, setMeetingTypeList] =
    useState<ComponentType | null>(null);

  useEffect(() => {
    let isMounted = true;

    const frameId = window.requestAnimationFrame(() => {
      void import('./MeetingTypeList')
        .then((module) => {
          if (!isMounted) return;

          startTransition(() => {
            setMeetingTypeList(() => module.default as ComponentType);
          });
        })
        .catch((error) => {
          console.error('Failed to load meeting actions', error);
        });
    });

    return () => {
      isMounted = false;
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  if (!MeetingTypeList) return <MeetingTypeListFallback />;

  return <MeetingTypeList />;
};

export default LazyMeetingTypeList;
