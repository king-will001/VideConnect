'use client';

import { useEffect, useState } from 'react';
import { Call, CallRecording } from '@stream-io/video-react-sdk';
import { useRouter } from 'next/navigation';

import {
  formatMeetingAccessLabel,
  getEnabledMeetingFeatures,
  getMeetingLink,
  getMeetingMetadata,
} from '@/lib/meeting';

import Loader from './Loader';
import { useGetCalls } from '@/hooks/useGetCalls';
import MeetingCard from './MeetingCard';

const CallList = ({ type }: { type: 'ended' | 'upcoming' | 'recordings' }) => {
  const router = useRouter();
  const { endedCalls, upcomingCalls, callRecordings, isLoading } =
    useGetCalls();
  const [recordings, setRecordings] = useState<CallRecording[]>([]);

  const getCalls = () => {
    switch (type) {
      case 'ended':
        return endedCalls;
      case 'recordings':
        return recordings;
      case 'upcoming':
        return upcomingCalls;
      default:
        return [];
    }
  };

  const getNoCallsMessage = () => {
    switch (type) {
      case 'ended':
        return 'No Previous Calls';
      case 'upcoming':
        return 'No Upcoming Calls';
      case 'recordings':
        return 'No Recordings';
      default:
        return '';
    }
  };

  useEffect(() => {
    let isMounted = true;

    const fetchRecordings = async () => {
      const callData = await Promise.all(
        callRecordings.map((meeting) => meeting.queryRecordings()),
      );

      const nextRecordings = callData
        .filter((call) => call.recordings.length > 0)
        .flatMap((call) => call.recordings);

      if (isMounted) {
        setRecordings(nextRecordings);
      }
    };

    if (type === 'recordings') {
      void fetchRecordings();
    }

    return () => {
      isMounted = false;
    };
  }, [callRecordings, type]);

  if (isLoading) return <Loader />;

  const calls = getCalls();
  const noCallsMessage = getNoCallsMessage();

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      {calls && calls.length > 0 ? (
        calls.map((meeting: Call | CallRecording) => {
          const isRecording = type === 'recordings';
          const call = meeting as Call;
          const meetingMetadata = !isRecording ? getMeetingMetadata(call) : null;

          return (
            <MeetingCard
              key={isRecording ? (meeting as CallRecording).url : call.id}
              icon={
                type === 'ended'
                  ? '/icons/previous.svg'
                  : type === 'upcoming'
                    ? '/icons/upcoming.svg'
                    : '/icons/recordings.svg'
              }
              title={
                meetingMetadata?.title ||
                (meeting as CallRecording).filename?.substring(0, 20) ||
                'No Description'
              }
              date={
                call.state?.startsAt?.toLocaleString() ||
                (meeting as CallRecording).start_time?.toLocaleString()
              }
              isPreviousMeeting={type === 'ended'}
              link={
                isRecording
                  ? (meeting as CallRecording).url
                  : getMeetingLink(call.id)
              }
              buttonIcon1={isRecording ? '/icons/play.svg' : undefined}
              buttonText={isRecording ? 'Play' : 'Start'}
              meetingCode={meetingMetadata?.meetingCode}
              accessLabel={
                meetingMetadata
                  ? formatMeetingAccessLabel(meetingMetadata.accessType)
                  : undefined
              }
              featureLabels={
                meetingMetadata
                  ? getEnabledMeetingFeatures(meetingMetadata)
                  : undefined
              }
              handleClick={
                isRecording
                  ? () =>
                      window.open(
                        (meeting as CallRecording).url,
                        '_blank',
                        'noopener,noreferrer',
                      )
                  : () => router.push(`/meeting/${call.id}`)
              }
            />
          );
        })
      ) : (
        <h1 className="text-2xl font-bold text-white">{noCallsMessage}</h1>
      )}
    </div>
  );
};

export default CallList;
