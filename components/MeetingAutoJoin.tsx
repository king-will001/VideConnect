'use client';

import { useEffect, useRef } from 'react';
import {
  CallingState,
  useCall,
  useCallStateHooks,
} from '@stream-io/video-react-sdk';

import {
  isStreamTimeoutError,
  STREAM_REQUEST_TIMEOUT_MS,
} from '@/lib/stream';

import Loader from './Loader';
import { useToast } from './ui/use-toast';

const MeetingAutoJoin = ({
  onFallback,
  onJoined,
}: {
  onFallback: () => void;
  onJoined: () => void;
}) => {
  const call = useCall();
  const { toast } = useToast();
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();
  const hasStartedJoinRef = useRef(false);

  if (!call) {
    throw new Error(
      'useStreamCall must be used within a StreamCall component.',
    );
  }

  useEffect(() => {
    if (callingState === CallingState.JOINED) {
      onJoined();
    }
  }, [callingState, onJoined]);

  useEffect(() => {
    if (
      hasStartedJoinRef.current ||
      callingState === CallingState.JOINED ||
      callingState === CallingState.JOINING
    ) {
      return;
    }

    hasStartedJoinRef.current = true;

    let isMounted = true;

    const autoJoinMeeting = async () => {
      try {
        await call.join({
          create: false,
          video: false,
          joinResponseTimeout: STREAM_REQUEST_TIMEOUT_MS,
          rpcRequestTimeout: STREAM_REQUEST_TIMEOUT_MS,
        });

        if (isMounted) {
          onJoined();
        }
      } catch (error) {
        console.error('Failed to auto-join meeting:', error);

        if (!isMounted) {
          return;
        }

        if (isStreamTimeoutError(error)) {
          toast({
            title: 'Meeting join timed out',
            description: `Stream did not respond within ${Math.round(
              STREAM_REQUEST_TIMEOUT_MS / 1000,
            )} seconds. You can still join manually after the setup screen loads.`,
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Fast join did not complete',
            description:
              'Switching to the setup screen so you can join manually.',
            variant: 'destructive',
          });
        }

        onFallback();
      }
    };

    void autoJoinMeeting();

    return () => {
      isMounted = false;
    };
  }, [call, callingState, onFallback, onJoined, toast]);

  return <Loader />;
};

export default MeetingAutoJoin;
