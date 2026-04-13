'use client';

import { forwardRef, useState } from 'react';
import Image from 'next/image';
import type { VideoPlaceholderProps } from '@stream-io/video-react-sdk';
import { UserRound } from 'lucide-react';

import { cn } from '@/lib/utils';

const MeetingVideoPlaceholder = forwardRef<HTMLDivElement, VideoPlaceholderProps>(
  function MeetingVideoPlaceholder(
    { participant, style, className, ...props },
    ref,
  ) {
    const [hasImageError, setHasImageError] = useState(false);
    const participantName = participant.name || participant.userId || 'Participant';
    const showProfileImage = !!participant.image && !hasImageError;

    return (
      <div
        {...props}
        ref={ref}
        style={style}
        className={cn(
          'str-video__video-placeholder flex size-full items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.12),_transparent_42%),linear-gradient(180deg,_#34363a_0%,_#27292d_100%)] p-6',
          className,
        )}
      >
        <div className="flex flex-col items-center gap-4 text-center text-white">
          <div className="relative flex size-20 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-[#3c4043] shadow-[0_12px_30px_rgba(0,0,0,0.22)]">
            {showProfileImage ? (
              <Image
                src={participant.image}
                alt={participantName}
                fill
                sizes="96px"
                unoptimized
                className="object-cover"
                onError={() => setHasImageError(true)}
              />
            ) : (
              <UserRound className="size-8 text-white/70" aria-hidden="true" />
            )}
          </div>

          <div>
            <p className="text-base font-semibold">{participantName}</p>
            <p className="text-sm text-white/65">Camera off</p>
          </div>
        </div>
      </div>
    );
  },
);

MeetingVideoPlaceholder.displayName = 'MeetingVideoPlaceholder';

export default MeetingVideoPlaceholder;
