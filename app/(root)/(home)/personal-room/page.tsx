'use client';

import { useUser } from '@clerk/nextjs';
import { useStreamVideoClient } from '@stream-io/video-react-sdk';
import { useRouter } from 'next/navigation';

import { useGetCallById } from '@/hooks/useGetCallById';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import Loader from '@/components/Loader';
import {
  formatMeetingAccessLabel,
  getMeetingPath,
  normalizeMeetingJoinValue,
} from '@/lib/meeting';
import { useMeetingLink } from '@/hooks/useMeetingLink';

const Table = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => {
  return (
    <div className="flex flex-col items-start gap-2 xl:flex-row">
      <h1 className="text-base font-medium text-sky-1 lg:text-xl xl:min-w-32">
        {title}:
      </h1>
      <h1 className="truncate text-sm font-bold max-sm:max-w-[320px] lg:text-xl">
        {description}
      </h1>
    </div>
  );
};

const PersonalRoom = () => {
  const router = useRouter();
  const { user } = useUser();
  const client = useStreamVideoClient();
  const { toast } = useToast();

  const meetingId = user?.id;
  const username = user?.username || user?.firstName || user?.id;
  const meetingCode = meetingId ? normalizeMeetingJoinValue(meetingId) : '';

  const { call } = useGetCallById(meetingId ?? '');

  if (!user || !client || !meetingId) {
    return <Loader />;
  }

  const startRoom = async () => {
    const newCall = client.call('default', meetingId);

    if (!call) {
      await newCall.getOrCreate({
        data: {
          starts_at: new Date().toISOString(),
        },
      });
    }

    router.push(getMeetingPath(meetingId, '?personal=true'));
  };

  const meetingLink = useMeetingLink(meetingId, '?personal=true');

  return (
    <section className="flex size-full flex-col gap-10 text-white">
      <h1 className="text-xl font-bold lg:text-3xl">Personal Meeting Room</h1>
      <div className="flex w-full flex-col gap-8 xl:max-w-[900px]">
        <Table title="Topic" description={`${username}'s Meeting Room`} />
        <Table title="Meeting ID" description={meetingId} />
        <Table title="Meeting Code" description={meetingCode} />
        <Table title="Access" description={formatMeetingAccessLabel('link')} />
        <Table title="Invite Link" description={meetingLink} />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:gap-5">
        <Button className="w-full bg-blue-1 sm:w-auto" onClick={startRoom}>
          Start Meeting
        </Button>
        <Button
          className="w-full bg-dark-3 sm:w-auto"
          onClick={() => {
            navigator.clipboard.writeText(meetingLink);
            toast({
              title: 'Link Copied',
            });
          }}
        >
          Copy Invitation
        </Button>
      </div>
    </section>
  );
};

export default PersonalRoom;
