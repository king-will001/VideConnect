'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStreamVideoClient, type Call } from '@stream-io/video-react-sdk';
import { useUser } from '@clerk/nextjs';

import {
  createMeetingCode,
  defaultMeetingFeatures,
  formatMeetingAccessLabel,
  getEnabledMeetingFeatures,
  getMeetingJoinDestination,
  getMeetingLink,
  getMeetingMetadata,
  getMeetingPath,
  meetingFeatureOptions,
  parseInvitees,
  type MeetingAccessType,
  type MeetingFeatureKey,
  type MeetingFeatures,
} from '@/lib/meeting';
import { isStreamTimeoutError } from '@/lib/stream';
import { cn } from '@/lib/utils';

import HomeCard from './HomeCard';
import MeetingModal from './MeetingModal';
import { Textarea } from './ui/textarea';
import { useToast } from './ui/use-toast';
import { Input } from './ui/input';
import { Button } from './ui/button';

type MeetingState =
  | 'isScheduleMeeting'
  | 'isJoiningMeeting'
  | 'isInstantMeeting'
  | undefined;

const accessOptions: Array<{
  value: MeetingAccessType;
  title: string;
  description: string;
}> = [
  {
    value: 'link',
    title: 'Anyone with the link',
    description: 'Share a meeting link or code and let people jump in fast.',
  },
  {
    value: 'invite-only',
    title: 'Invited people only',
    description: 'Track the invite list and keep host controls on.',
  },
];

const toDateTimeLocalValue = (date: Date) => {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);

  return localDate.toISOString().slice(0, 16);
};

const parseDateTimeLocalValue = (value: string) => {
  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
};

const getMeetingCreationErrorDescription = (error: unknown) => {
  if (isStreamTimeoutError(error)) {
    return 'The Stream request timed out. Check your Stream credentials and network connection.';
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'The meeting could not be created. Try again.';
};

const getInitialValues = () => ({
  dateTime: new Date(),
  title: '',
  description: '',
  invitees: '',
  link: '',
  accessType: 'link' as MeetingAccessType,
  features: {
    ...defaultMeetingFeatures,
  } satisfies MeetingFeatures,
});

const MeetingTypeList = () => {
  const router = useRouter();
  const [meetingState, setMeetingState] = useState<MeetingState>(undefined);
  const [values, setValues] = useState(getInitialValues);
  const [callDetail, setCallDetail] = useState<Call>();
  const client = useStreamVideoClient();
  const { user, isLoaded } = useUser();
  const { toast } = useToast();

  const resetMeetingState = () => {
    setMeetingState(undefined);
    setCallDetail(undefined);
    setValues(getInitialValues());
  };

  const resetJoinState = () => {
    setMeetingState(undefined);
    setValues((currentValues) => ({
      ...currentValues,
      link: '',
    }));
  };

  const toggleFeature = (feature: MeetingFeatureKey) => {
    setValues((currentValues) => ({
      ...currentValues,
      features: {
        ...currentValues.features,
        [feature]: !currentValues.features[feature],
      },
    }));
  };

  const createMeeting = async () => {
    if (!isLoaded || !user) {
      toast({
        title: 'Still loading your account',
        description: 'Try again in a moment.',
      });

      return;
    }

    if (!client) {
      toast({
        title: 'Connecting to Stream',
        description: 'Meeting services are still starting up. Try again shortly.',
      });

      return;
    }

    try {
      if (!values.dateTime) {
        toast({ title: 'Please select a date and time' });

        return;
      }

      const invitees = parseInvitees(values.invitees);

      if (values.accessType === 'invite-only' && invitees.length === 0) {
        toast({
          title: 'Add at least one invitee',
          description:
            'Invite-only meetings should include at least one guest email.',
          variant: 'destructive',
        });

        return;
      }

      const meetingId = createMeetingCode();
      const meetingTitle =
        values.title.trim() ||
        (meetingState === 'isInstantMeeting'
          ? 'Instant meeting'
          : 'Scheduled meeting');
      const description = values.description.trim() || meetingTitle;
      const startsAt =
        meetingState === 'isInstantMeeting'
          ? new Date().toISOString()
          : values.dateTime.toISOString();
      const call = client.call('default', meetingId);

      await call.getOrCreate({
        data: {
          starts_at: startsAt,
          custom: {
            description,
            meetingTitle,
            accessType: values.accessType,
            invitees,
            meetingCode: meetingId,
            features: values.features,
            source: 'meet-inspired',
          },
        },
      });

      setCallDetail(call);

      if (meetingState === 'isInstantMeeting') {
        router.push(getMeetingPath(call.id));

        return;
      }

      toast({
        title: 'Meeting created',
        description: 'Your meeting link and code are ready to share.',
      });
    } catch (error) {
      console.error(error);
      toast({
        title: 'Failed to create meeting',
        description: getMeetingCreationErrorDescription(error),
        variant: 'destructive',
      });
    }
  };

  const createdMeeting = callDetail ? getMeetingMetadata(callDetail) : null;
  const meetingLink = callDetail ? getMeetingLink(callDetail.id) : '';

  const joinMeeting = () => {
    const destination = getMeetingJoinDestination(values.link);

    if (!destination) {
      toast({ title: 'Please enter a meeting link, ID, or code' });

      return;
    }

    if ('externalUrl' in destination && destination.externalUrl) {
      window.location.assign(destination.externalUrl);

      return;
    }

    if (!('internalPath' in destination) || !destination.internalPath) {
      toast({
        title: 'Invalid meeting destination',
        description: 'The meeting link or code could not be resolved.',
        variant: 'destructive',
      });

      return;
    }

    router.push(destination.internalPath);
  };

  return (
    <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
      <HomeCard
        img="/icons/add-meeting.svg"
        title="New Meeting"
        description="Start an instant Meet-style room"
        handleClick={() => {
          setCallDetail(undefined);
          setValues(getInitialValues());
          setMeetingState('isInstantMeeting');
        }}
      />
      <HomeCard
        img="/icons/join-meeting.svg"
        title="Join Meeting"
        description="By invitation link or meeting code"
        className="bg-blue-1"
        handleClick={() => setMeetingState('isJoiningMeeting')}
      />
      <HomeCard
        img="/icons/schedule.svg"
        title="Schedule Meeting"
        description="Plan a Meet-style session"
        className="bg-purple-1"
        handleClick={() => {
          setCallDetail(undefined);
          setValues(getInitialValues());
          setMeetingState('isScheduleMeeting');
        }}
      />
      <HomeCard
        img="/icons/recordings.svg"
        title="View Recordings"
        description="Watch past meeting replays"
        className="bg-yellow-1"
        handleClick={() => router.push('/recordings')}
      />

      {!callDetail ? (
        <MeetingModal
          isOpen={meetingState === 'isScheduleMeeting'}
          onClose={resetMeetingState}
          title="Create a Google Meet style session"
          handleClick={createMeeting}
          buttonText="Create Meeting"
          contentClassName="max-w-3xl"
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="flex flex-col gap-2.5">
              <label className="text-base font-normal leading-[22.4px] text-sky-2">
                Meeting title
              </label>
              <Input
                value={values.title}
                placeholder="Meeting title"
                onChange={(event) =>
                  setValues({ ...values, title: event.target.value })
                }
                className="border-none bg-dark-3 text-white placeholder:text-sky-1 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
            <div className="flex w-full flex-col gap-2.5">
              <label className="text-base font-normal leading-[22.4px] text-sky-2">
                Select date and time
              </label>
              <Input
                type="datetime-local"
                value={toDateTimeLocalValue(values.dateTime)}
                onChange={(event) => {
                  const date = parseDateTimeLocalValue(event.target.value);

                  setValues({
                    ...values,
                    dateTime: date ?? values.dateTime,
                  });
                }}
                className="border-none bg-dark-3 text-white focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <label className="text-base font-normal leading-[22.4px] text-sky-2">
              Description
            </label>
            <Textarea
              value={values.description}
              className="min-h-[100px] border-none bg-dark-3 text-white placeholder:text-sky-1 focus-visible:ring-0 focus-visible:ring-offset-0"
              placeholder="Agenda, context, or meeting goals."
              onChange={(event) =>
                setValues({ ...values, description: event.target.value })
              }
            />
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <label className="text-base font-normal leading-[22.4px] text-sky-2">
                Access
              </label>
              <span className="text-sm text-sky-1">
                {formatMeetingAccessLabel(values.accessType)}
              </span>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {accessOptions.map((option) => (
                <button
                  type="button"
                  key={option.value}
                  onClick={() =>
                    setValues({ ...values, accessType: option.value })
                  }
                  className={cn(
                    'rounded-2xl border px-4 py-4 text-left transition-colors',
                    values.accessType === option.value
                      ? 'border-blue-1 bg-blue-1/10'
                      : 'border-dark-3 bg-dark-2 hover:border-sky-1/40',
                  )}
                >
                  <p className="text-base font-semibold">{option.title}</p>
                  <p className="mt-1 text-sm text-sky-1">
                    {option.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <label className="text-base font-normal leading-[22.4px] text-sky-2">
              Invitees
            </label>
            <Textarea
              value={values.invitees}
              className="min-h-[90px] border-none bg-dark-3 text-white placeholder:text-sky-1 focus-visible:ring-0 focus-visible:ring-offset-0"
              placeholder="Paste email addresses separated by commas or new lines."
              onChange={(event) =>
                setValues({ ...values, invitees: event.target.value })
              }
            />
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <label className="text-base font-normal leading-[22.4px] text-sky-2">
                Google Meet style features
              </label>
              <span className="text-sm text-sky-1">
                Toggle what should be available in-room
              </span>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {meetingFeatureOptions.map((feature) => (
                <button
                  type="button"
                  key={feature.key}
                  onClick={() => toggleFeature(feature.key)}
                  className={cn(
                    'rounded-2xl border px-4 py-4 text-left transition-colors',
                    values.features[feature.key]
                      ? 'border-blue-1 bg-blue-1/10'
                      : 'border-dark-3 bg-dark-2 hover:border-sky-1/40',
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-base font-semibold">{feature.label}</p>
                    <span className="text-sm text-sky-1">
                      {values.features[feature.key] ? 'On' : 'Off'}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-sky-1">
                    {feature.description}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </MeetingModal>
      ) : (
        <MeetingModal
          isOpen={meetingState === 'isScheduleMeeting'}
          onClose={resetMeetingState}
          title="Meeting ready to share"
          handleClick={() => {
            navigator.clipboard.writeText(meetingLink);
            toast({ title: 'Meeting link copied' });
          }}
          image="/icons/checked.svg"
          buttonIcon="/icons/copy.svg"
          className="text-center"
          buttonText="Copy Meeting Link"
          contentClassName="max-w-2xl"
        >
          {createdMeeting && (
            <>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl bg-dark-3 p-4">
                  <p className="text-sm text-sky-1">Title</p>
                  <p className="mt-1 text-base font-semibold">
                    {createdMeeting.title}
                  </p>
                </div>
                <div className="rounded-2xl bg-dark-3 p-4">
                  <p className="text-sm text-sky-1">Meeting code</p>
                  <p className="mt-1 text-base font-semibold">
                    {createdMeeting.meetingCode}
                  </p>
                </div>
                <div className="rounded-2xl bg-dark-3 p-4">
                  <p className="text-sm text-sky-1">Access</p>
                  <p className="mt-1 text-base font-semibold">
                    {formatMeetingAccessLabel(createdMeeting.accessType)}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl bg-dark-3 p-4">
                <p className="text-sm text-sky-1">Description</p>
                <p className="mt-1 text-base font-medium text-white">
                  {createdMeeting.description}
                </p>
              </div>

              <div className="flex flex-col gap-3 rounded-2xl bg-dark-3 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-sky-1">Enabled features</p>
                  <span className="text-sm text-sky-1">{meetingLink}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {getEnabledMeetingFeatures(createdMeeting).map((feature) => (
                    <span
                      key={feature}
                      className="rounded-full bg-dark-4 px-3 py-1 text-sm text-sky-2"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>

              {createdMeeting.invitees.length > 0 && (
                <div className="rounded-2xl bg-dark-3 p-4">
                  <p className="text-sm text-sky-1">Invitees</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {createdMeeting.invitees.map((invitee) => (
                      <span
                        key={invitee}
                        className="rounded-full bg-dark-4 px-3 py-1 text-sm text-sky-2"
                      >
                        {invitee}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </MeetingModal>
      )}

      <MeetingModal
        isOpen={meetingState === 'isJoiningMeeting'}
        onClose={resetJoinState}
        title="Join with a link or meeting code"
        className="text-center"
        buttonText="Join Meeting"
        handleClick={joinMeeting}
      >
        <div className="flex flex-col gap-3">
          <Input
            value={values.link}
            placeholder="Paste a link, meeting ID, or code"
            onChange={(event) =>
              setValues({ ...values, link: event.target.value })
            }
            className="border-none bg-dark-3 text-white placeholder:text-sky-1 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          <p className="text-sm text-sky-1">
            You can join with a full invitation link, a personal room ID, or a
            Google Meet style code.
          </p>
        </div>
      </MeetingModal>

      <MeetingModal
        isOpen={meetingState === 'isInstantMeeting'}
        onClose={resetMeetingState}
        title="Start an instant meeting"
        className="text-center"
        buttonText="Start Meeting"
        handleClick={createMeeting}
      >
        <div className="flex flex-col gap-4 text-left">
          <div className="rounded-2xl bg-dark-3 p-4">
            <p className="text-sm text-sky-1">Instant meeting code</p>
            <p className="mt-1 text-lg font-semibold text-white">
              A fresh code will be generated when you start.
            </p>
          </div>
          <div className="flex flex-col gap-2.5">
            <label className="text-base font-normal leading-[22.4px] text-sky-2">
              Meeting title
            </label>
            <Input
              value={values.title}
              placeholder="Meeting title"
              onChange={(event) =>
                setValues({ ...values, title: event.target.value })
              }
              className="border-none bg-dark-3 text-white placeholder:text-sky-1 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {meetingFeatureOptions.map((feature) => (
              <Button
                key={feature.key}
                type="button"
                variant="ghost"
                className={cn(
                  'rounded-full border border-dark-4 bg-dark-3 px-4 py-2 text-sm text-white hover:bg-dark-4 hover:text-white',
                  values.features[feature.key] && 'border-blue-1 bg-blue-1/10',
                )}
                onClick={() => toggleFeature(feature.key)}
              >
                {feature.label}: {values.features[feature.key] ? 'On' : 'Off'}
              </Button>
            ))}
          </div>
        </div>
      </MeetingModal>
    </section>
  );
};

export default MeetingTypeList;
