'use client';

import { useCallback, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { StreamCall, StreamTheme } from '@stream-io/video-react-sdk';
import { useParams, useSearchParams } from 'next/navigation';

import Loader from '@/components/Loader';
import { useGetCallById } from '@/hooks/useGetCallById';
import Alert from '@/components/Alert';
import MeetingAutoJoin from '@/components/MeetingAutoJoin';
import MeetingSetup from '@/components/MeetingSetup';
import MeetingRoom from '@/components/MeetingRoom';

type JoinPhase = 'autojoin' | 'room' | 'setup';

const MeetingPageInner = ({
  id,
  shouldAutoJoin,
}: {
  id: string;
  shouldAutoJoin: boolean;
}) => {
  const { isLoaded, user } = useUser();
  const { call, isCallLoading } = useGetCallById(id);
  const [joinPhase, setJoinPhase] = useState<JoinPhase>(
    shouldAutoJoin ? 'autojoin' : 'setup',
  );

  const showMeetingRoom = joinPhase === 'room';

  const handleAutoJoinFallback = useCallback(() => {
    setJoinPhase('setup');
  }, []);

  const handleJoinReady = useCallback(() => {
    setJoinPhase('room');
  }, []);

  if (!isLoaded || isCallLoading) return <Loader />;

  if (!call) {
    return (
      <p className="text-center text-3xl font-bold text-white">
        Call Not Found
      </p>
    );
  }

  // get more info about custom call type:  https://getstream.io/video/docs/react/guides/configuring-call-types/
  const notAllowed =
    call.type === 'invited' &&
    (!user ||
      !call.state.members.some((member) => member.user?.id === user.id));

  if (notAllowed)
    return <Alert title="You are not allowed to join this meeting" />;

  return (
    <main
      className={
        showMeetingRoom
          ? 'h-dvh w-full overflow-hidden'
          : 'min-h-dvh w-full overflow-y-auto'
      }
    >
      <StreamCall call={call}>
        <StreamTheme>
          {joinPhase === 'autojoin' ? (
            <MeetingAutoJoin
              onFallback={handleAutoJoinFallback}
              onJoined={handleJoinReady}
            />
          ) : !showMeetingRoom ? (
            <MeetingSetup setIsSetupComplete={handleJoinReady} />
          ) : (
            <MeetingRoom />
          )}
        </StreamTheme>
      </StreamCall>
    </main>
  );
};

const MeetingPage = () => {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const shouldAutoJoin = searchParams.get('autojoin') === '1';

  return (
    <MeetingPageInner
      key={`${id}:${shouldAutoJoin ? 'autojoin' : 'setup'}`}
      id={id}
      shouldAutoJoin={shouldAutoJoin}
    />
  );
};

export default MeetingPage;
