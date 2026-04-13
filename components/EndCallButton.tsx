'use client';

import { type ButtonHTMLAttributes } from 'react';
import { useCall, useCallStateHooks } from '@stream-io/video-react-sdk';

import { cn } from '@/lib/utils';

import { Button } from './ui/button';
import { useRouter } from 'next/navigation';

const EndCallButton = ({
  className,
  label = 'End call for everyone',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  label?: string;
}) => {
  const call = useCall();
  const router = useRouter();

  if (!call)
    throw new Error(
      'useStreamCall must be used within a StreamCall component.',
    );

  // https://getstream.io/video/docs/react/guides/call-and-participant-state/#participant-state-3
  const { useLocalParticipant } = useCallStateHooks();
  const localParticipant = useLocalParticipant();

  const isMeetingOwner =
    localParticipant &&
    call.state.createdBy &&
    localParticipant.userId === call.state.createdBy.id;

  if (!isMeetingOwner) return null;

  const endCall = async () => {
    await call.endCall();
    router.push('/');
  };

  return (
    <Button
      onClick={endCall}
      className={cn(
        'h-10 rounded-full bg-red-500 px-6 text-white hover:bg-red-500/90',
        className,
      )}
      {...props}
    >
      {label}
    </Button>
  );
};

export default EndCallButton;
