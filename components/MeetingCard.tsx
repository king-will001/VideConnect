'use client';

import { useResolvedUrl } from '@/hooks/useMeetingLink';
import Image from 'next/image';

import { cn } from '@/lib/utils';

import { Button } from './ui/button';
import { useToast } from './ui/use-toast';

interface MeetingCardProps {
  title: string;
  date: string;
  icon: string;
  isPreviousMeeting?: boolean;
  buttonIcon1?: string;
  buttonText?: string;
  handleClick: () => void;
  link: string;
  meetingCode?: string;
  accessLabel?: string;
  featureLabels?: string[];
}

const MeetingCard = ({
  icon,
  title,
  date,
  isPreviousMeeting,
  buttonIcon1,
  handleClick,
  link,
  buttonText,
  meetingCode,
  accessLabel,
  featureLabels = [],
}: MeetingCardProps) => {
  const { toast } = useToast();
  const shareLink = useResolvedUrl(link);

  return (
    <section className="flex min-h-[220px] w-full flex-col justify-between rounded-[14px] bg-dark-1 px-4 py-6 sm:min-h-[258px] sm:px-5 sm:py-8 xl:max-w-[568px]">
      <article className="flex flex-col gap-5">
        <Image
          src={icon}
          alt="upcoming"
          width={28}
          height={28}
          className="size-auto"
        />
        <div className="flex justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="text-xl font-bold sm:text-2xl">{title}</h1>
            <p className="text-sm font-normal sm:text-base">{date}</p>
          </div>
        </div>

        {(meetingCode || accessLabel || featureLabels.length > 0) && (
          <div className="flex flex-wrap gap-2">
            {meetingCode && (
              <span className="rounded-full bg-dark-3 px-3 py-1 text-sm text-sky-2">
                Code: {meetingCode}
              </span>
            )}
            {accessLabel && (
              <span className="rounded-full bg-dark-3 px-3 py-1 text-sm text-sky-2">
                {accessLabel}
              </span>
            )}
            {featureLabels.slice(0, 3).map((feature) => (
              <span
                key={feature}
                className="rounded-full bg-dark-4 px-3 py-1 text-sm text-sky-2"
              >
                {feature}
              </span>
            ))}
          </div>
        )}
      </article>

      <article className={cn('relative flex justify-end')}>
        {!isPreviousMeeting && (
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              onClick={handleClick}
              className="w-full rounded bg-blue-1 px-6 sm:w-auto"
            >
              {buttonIcon1 && (
                <Image
                  src={buttonIcon1}
                  alt="feature"
                  width={20}
                  height={20}
                  className="size-auto"
                />
              )}
              &nbsp; {buttonText}
            </Button>
            <Button
              onClick={() => {
                navigator.clipboard.writeText(shareLink);
                toast({
                  title: 'Link Copied',
                });
              }}
              className="w-full bg-dark-4 px-6 sm:w-auto"
            >
              <Image
                src="/icons/copy.svg"
                alt="feature"
                width={20}
                height={20}
                className="size-auto"
              />
              &nbsp; Copy Link
            </Button>
          </div>
        )}
      </article>
    </section>
  );
};

export default MeetingCard;
