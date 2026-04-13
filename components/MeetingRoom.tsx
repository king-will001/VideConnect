'use client';

import { useEffect, useState } from 'react';
import {
  CallParticipantsList,
  CallingState,
  PaginatedGridLayout,
  ReactionsButton,
  ScreenShareButton,
  SpeakerLayout,
  ToggleAudioPublishingButton,
  ToggleVideoPublishingButton,
  useCall,
  useCallStateHooks,
} from '@stream-io/video-react-sdk';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Activity,
  ArrowLeft,
  Captions,
  Copy,
  Info,
  LayoutGrid,
  PhoneOff,
  Users,
  Volume2,
  X,
  type LucideIcon,
} from 'lucide-react';

import {
  formatMeetingAccessLabel,
  getEnabledMeetingFeatures,
  getMeetingLink,
  getMeetingMetadata,
} from '@/lib/meeting';
import { cn } from '@/lib/utils';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Button } from './ui/button';
import { useToast } from './ui/use-toast';
import Loader from './Loader';
import EndCallButton from './EndCallButton';
import MeetingVideoPlaceholder from './MeetingVideoPlaceholder';

type CallLayoutType = 'grid' | 'speaker-left' | 'speaker-right';
type SidePanelType = 'participants' | 'details' | null;

const headerButtonClass =
  'h-10 rounded-full border border-white/10 bg-[#2d2f31]/92 px-3 text-sm font-medium text-white shadow-[0_12px_40px_rgba(0,0,0,0.28)] backdrop-blur-xl hover:bg-[#383b3f] hover:text-white sm:px-4';

const footerToggleClass =
  'h-10 rounded-full border border-white/10 bg-[#2d2f31]/92 px-3 text-sm font-medium text-white shadow-[0_12px_40px_rgba(0,0,0,0.22)] backdrop-blur-xl hover:bg-[#383b3f] hover:text-white lg:px-4';

const formatMeetingNow = () => {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date());
};

const getInitials = (value: string) => {
  const initials = value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  return initials || 'Y';
};

const HeaderActionButton = ({
  label,
  icon: Icon,
  onClick,
  active = false,
}: {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  active?: boolean;
}) => {
  return (
    <Button
      type="button"
      variant="ghost"
      className={cn(
        headerButtonClass,
        active &&
          'border-[#8ab4f8]/45 bg-[#8ab4f8] text-[#0f1115] hover:bg-[#9ec1ff] hover:text-[#0f1115]',
      )}
      onClick={onClick}
    >
      <Icon size={16} className="sm:mr-2" />
      <span className="hidden sm:inline">{label}</span>
    </Button>
  );
};

const FooterToggleButton = ({
  label,
  icon: Icon,
  onClick,
  active = false,
}: {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  active?: boolean;
}) => {
  return (
    <Button
      type="button"
      variant="ghost"
      className={cn(
        footerToggleClass,
        active && 'border-[#8ab4f8]/35 bg-[#26344a] text-[#dbe8ff]',
      )}
      onClick={onClick}
    >
      <Icon size={16} className="lg:mr-2" />
      <span className="hidden lg:inline">{label}</span>
    </Button>
  );
};

const StatusChip = ({
  label,
  icon: Icon,
}: {
  label: string;
  icon: LucideIcon;
}) => {
  return (
    <div className="bg-[#2d2f31]/92 flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-white shadow-[0_12px_30px_rgba(0,0,0,0.22)] backdrop-blur-xl">
      <Icon size={14} />
      <span>{label}</span>
    </div>
  );
};

const ParticipantPreviewStrip = ({
  participantNames,
  attendeeLabel,
  meetingCode,
}: {
  participantNames: string[];
  attendeeLabel: string;
  meetingCode: string;
}) => {
  return (
    <div className="hidden min-w-[220px] items-center gap-3 rounded-full border border-white/10 bg-[#202124]/90 px-3 py-2 text-white shadow-[0_18px_40px_rgba(0,0,0,0.24)] backdrop-blur-xl md:flex">
      <div className="flex -space-x-2">
        {participantNames.slice(0, 4).map((name, index) => (
          <div
            key={`${name}-${index}`}
            className="flex size-10 items-center justify-center rounded-full border border-[#202124] bg-[#5f6368] text-xs font-semibold"
          >
            {getInitials(name)}
          </div>
        ))}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium leading-none">{attendeeLabel}</p>
        <p className="mt-1 truncate text-xs text-white/55">Code {meetingCode}</p>
      </div>
    </div>
  );
};

const MeetingDetailsPanel = ({
  title,
  description,
  attendeeLabel,
  meetingCode,
  accessLabel,
  meetingLink,
  invitees,
  enabledFeatures,
  liveSignals,
  isPersonalRoom,
  onCopyLink,
  onClose,
}: {
  title: string;
  description: string;
  attendeeLabel: string;
  meetingCode: string;
  accessLabel: string;
  meetingLink: string;
  invitees: string[];
  enabledFeatures: string[];
  liveSignals: string[];
  isPersonalRoom: boolean;
  onCopyLink: () => void;
  onClose: () => void;
}) => {
  return (
    <aside className="flex h-full flex-col overflow-y-auto rounded-[24px] border border-white/10 bg-[#202124] p-4 text-white shadow-[0_18px_60px_rgba(0,0,0,0.32)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-white/45">
            Meeting details
          </p>
          <h2 className="mt-2 text-xl font-semibold">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-white/65">
            {description || 'This call is configured and ready for collaboration.'}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          className="bg-[#2d2f31]/92 size-10 rounded-full border border-white/10 p-0 text-white hover:bg-[#383b3f] hover:text-white"
          onClick={onClose}
        >
          <X size={16} />
        </Button>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-[18px] border border-white/10 bg-white/[0.04] p-4">
          <p className="text-[11px] uppercase tracking-[0.2em] text-white/45">
            Meeting code
          </p>
          <p className="mt-2 text-sm font-semibold text-white">{meetingCode}</p>
        </div>
        <div className="rounded-[18px] border border-white/10 bg-white/[0.04] p-4">
          <p className="text-[11px] uppercase tracking-[0.2em] text-white/45">
            Access
          </p>
          <p className="mt-2 text-sm font-semibold text-white">{accessLabel}</p>
        </div>
      </div>

      <div className="mt-4 rounded-[20px] border border-white/10 bg-white/[0.04] p-4">
        <p className="text-[11px] uppercase tracking-[0.2em] text-white/45">
          People in call
        </p>
        <p className="mt-2 text-sm font-medium text-white">{attendeeLabel}</p>
      </div>

      <div className="mt-4 rounded-[20px] border border-white/10 bg-white/[0.04] p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.2em] text-white/45">
              Invite link
            </p>
            <p className="mt-2 break-all text-sm leading-6 text-white">
              {meetingLink}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            className="bg-[#2d2f31]/92 h-10 shrink-0 rounded-full border border-white/10 px-4 text-white hover:bg-[#383b3f] hover:text-white"
            onClick={onCopyLink}
          >
            <Copy size={16} className="mr-2" />
            Copy
          </Button>
        </div>
      </div>

      <div className="mt-4 rounded-[20px] border border-white/10 bg-white/[0.04] p-4">
        <p className="text-[11px] uppercase tracking-[0.2em] text-white/45">
          Live signals
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {liveSignals.length > 0 ? (
            liveSignals.map((signal) => (
              <span
                key={signal}
                className="rounded-full bg-[#2d2f31] px-3 py-1.5 text-sm text-white"
              >
                {signal}
              </span>
            ))
          ) : (
            <p className="text-sm text-white/65">No active meeting signals.</p>
          )}
        </div>
      </div>

      <div className="mt-4 rounded-[20px] border border-white/10 bg-white/[0.04] p-4">
        <p className="text-[11px] uppercase tracking-[0.2em] text-white/45">
          Enabled features
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {enabledFeatures.length > 0 ? (
            enabledFeatures.map((feature) => (
              <span
                key={feature}
                className="rounded-full bg-[#2d2f31] px-3 py-1.5 text-sm text-white"
              >
                {feature}
              </span>
            ))
          ) : (
            <p className="text-sm text-white/65">No extra features enabled.</p>
          )}
        </div>
      </div>

      <div className="mt-4 rounded-[20px] border border-white/10 bg-white/[0.04] p-4">
        <p className="text-[11px] uppercase tracking-[0.2em] text-white/45">
          Invitees
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {invitees.length > 0 ? (
            invitees.map((invitee) => (
              <span
                key={invitee}
                className="rounded-full bg-[#2d2f31] px-3 py-1.5 text-sm text-white"
              >
                {invitee}
              </span>
            ))
          ) : (
            <p className="text-sm text-white/65">
              No invitees were attached to this meeting.
            </p>
          )}
        </div>
      </div>

      {!isPersonalRoom && (
        <div className="mt-5">
          <EndCallButton
            className="h-11 w-full rounded-full bg-[#ea4335] text-white hover:bg-[#f04b3e]"
            label="End meeting for everyone"
          />
        </div>
      )}
    </aside>
  );
};

const MeetingRoom = () => {
  const searchParams = useSearchParams();
  const isPersonalRoom = !!searchParams.get('personal');
  const router = useRouter();
  const { toast } = useToast();
  const [layout, setLayout] = useState<CallLayoutType>('grid');
  const [sidePanel, setSidePanel] = useState<SidePanelType>(null);
  const [currentMomentLabel, setCurrentMomentLabel] = useState(
    () => formatMeetingNow(),
  );
  const call = useCall();
  const {
    useCallCallingState,
    useLocalParticipant,
    useParticipantCount,
    useParticipants,
  } = useCallStateHooks();
  const callingState = useCallCallingState();

  if (!call) {
    throw new Error(
      'useStreamCall must be used within a StreamCall component.',
    );
  }

  const meeting = getMeetingMetadata(call);
  const meetingLink = getMeetingLink(
    call.id,
    isPersonalRoom ? '?personal=true' : '',
  );
  const enabledFeatures = getEnabledMeetingFeatures(meeting);
  const localParticipant = useLocalParticipant();
  const participants = useParticipants();
  const participantCount = useParticipantCount();
  const attendeeCount = Math.max(
    participantCount ?? 0,
    participants.length,
    localParticipant ? 1 : 0,
  );
  const attendeeLabel = `${attendeeCount} ${
    attendeeCount === 1 ? 'participant' : 'participants'
  }`;
  const participantNames =
    participants.length > 0
      ? participants.map(
          (participant) =>
            participant.name || participant.userId || 'Participant',
        )
      : [localParticipant?.name || localParticipant?.userId || 'You'];
  const [captionsEnabled, setCaptionsEnabled] = useState(
    meeting.features.captions,
  );
  const [noiseCancellationEnabled, setNoiseCancellationEnabled] = useState(
    meeting.features.noiseCancellation,
  );
  const [isHandRaised, setIsHandRaised] = useState(false);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentMomentLabel(formatMeetingNow());
    }, 30000);

    return () => window.clearInterval(intervalId);
  }, []);

  if (callingState !== CallingState.JOINED) return <Loader />;

  const activeLayoutLabel =
    layout === 'grid'
      ? 'Tiled view'
      : layout === 'speaker-right'
        ? 'Focus view with left rail'
        : 'Focus view with right rail';

  const liveSignals = [
    meeting.features.captions && captionsEnabled ? 'Captions on' : null,
    meeting.features.noiseCancellation && noiseCancellationEnabled
      ? 'Noise filtering on'
      : null,
    meeting.features.handRaise && isHandRaised ? 'Hand raised' : null,
  ].filter(Boolean) as string[];

  const signalItems = [
    meeting.features.captions && captionsEnabled
      ? { label: 'Captions on', icon: Captions }
      : null,
    meeting.features.noiseCancellation && noiseCancellationEnabled
      ? { label: 'Noise filtering on', icon: Volume2 }
      : null,
    meeting.features.handRaise && isHandRaised
      ? { label: 'Hand raised', icon: Activity }
      : null,
  ].filter(Boolean) as Array<{ label: string; icon: LucideIcon }>;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(meetingLink);
    toast({ title: 'Invite link copied' });
  };

  const handleLeaveCall = async () => {
    try {
      await call.leave();
      router.push('/');
    } catch {
      toast({ title: 'Unable to leave the meeting' });
    }
  };

  const toggleSidePanel = (panel: Exclude<SidePanelType, null>) => {
    setSidePanel((currentPanel) => (currentPanel === panel ? null : panel));
  };

  const renderLayout = () => {
    switch (layout) {
      case 'speaker-right':
        return (
          <SpeakerLayout
            participantsBarPosition="left"
            VideoPlaceholder={MeetingVideoPlaceholder}
          />
        );
      case 'speaker-left':
        return (
          <SpeakerLayout
            participantsBarPosition="right"
            VideoPlaceholder={MeetingVideoPlaceholder}
          />
        );
      default:
        return <PaginatedGridLayout VideoPlaceholder={MeetingVideoPlaceholder} />;
    }
  };

  return (
    <section className="meeting-room-shell relative h-dvh overflow-hidden bg-[#202124] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_38%),linear-gradient(180deg,_#202124_0%,_#17181a_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/45 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/65 to-transparent" />

      <div className="relative z-10 flex h-full flex-col">
        <header className="absolute inset-x-3 top-3 z-40 flex items-start justify-between gap-3 sm:inset-x-4 sm:top-4">
          <div className="flex min-w-0 items-start gap-3">
            <Button
              type="button"
              variant="ghost"
              className="bg-[#2d2f31]/92 size-10 rounded-full border border-white/10 p-0 text-white shadow-[0_12px_40px_rgba(0,0,0,0.28)] backdrop-blur-xl hover:bg-[#383b3f] hover:text-white"
              onClick={handleLeaveCall}
            >
              <ArrowLeft size={18} />
            </Button>

            <div className="bg-[#2d2f31]/92 min-w-0 max-w-[min(30rem,calc(100vw-7rem))] rounded-[20px] border border-white/10 px-4 py-3 shadow-[0_12px_40px_rgba(0,0,0,0.28)] backdrop-blur-xl">
              <div className="flex flex-wrap items-center gap-2 text-xs text-white/60">
                <span className="bg-white/8 inline-flex items-center gap-2 rounded-full px-2.5 py-1 font-medium text-white">
                  <span className="size-2 rounded-full bg-[#34a853]" />
                  Live
                </span>
                <span>{currentMomentLabel}</span>
                <span className="hidden sm:inline">{attendeeLabel}</span>
              </div>
              <h1 className="mt-2 truncate text-base font-semibold sm:text-lg">
                {meeting.title}
              </h1>
              <p className="mt-1 truncate text-xs text-white/60 sm:text-sm">
                Code {meeting.meetingCode} . {formatMeetingAccessLabel(meeting.accessType)}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap justify-end gap-2">
            <HeaderActionButton
              label="Copy link"
              icon={Copy}
              onClick={handleCopyLink}
            />
            <HeaderActionButton
              label="People"
              icon={Users}
              active={sidePanel === 'participants'}
              onClick={() => toggleSidePanel('participants')}
            />
            <HeaderActionButton
              label="Details"
              icon={Info}
              active={sidePanel === 'details'}
              onClick={() => toggleSidePanel('details')}
            />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className={headerButtonClass}
                >
                  <LayoutGrid size={16} className="sm:mr-2" />
                  <span className="hidden sm:inline">{activeLayoutLabel}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 border-white/10 bg-[#202124] text-white shadow-[0_18px_40px_rgba(0,0,0,0.3)]">
                <DropdownMenuItem
                  className="focus:bg-[#383b3f] focus:text-white"
                  onClick={() => setLayout('grid')}
                >
                  Tiled view
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="focus:bg-[#383b3f] focus:text-white"
                  onClick={() => setLayout('speaker-left')}
                >
                  Focus view with right rail
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="focus:bg-[#383b3f] focus:text-white"
                  onClick={() => setLayout('speaker-right')}
                >
                  Focus view with left rail
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 px-2 pb-28 pt-20 sm:px-4 sm:pb-32 sm:pt-24 lg:px-5 lg:pb-36">
          <div className="relative h-full overflow-hidden rounded-[28px] border border-white/10 bg-[#111315] shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
            {signalItems.length > 0 && (
              <div className="absolute inset-x-4 top-4 z-20 flex justify-center">
                <div className="flex flex-wrap justify-center gap-2">
                  {signalItems.map((signal) => (
                    <StatusChip
                      key={signal.label}
                      label={signal.label}
                      icon={signal.icon}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="relative h-full p-2 sm:p-3">{renderLayout()}</div>

            {sidePanel && (
              <>
                <button
                  type="button"
                  aria-label="Close side panel"
                  className="absolute inset-0 z-20 bg-black/30 backdrop-blur-[2px]"
                  onClick={() => setSidePanel(null)}
                />

                <div className="absolute inset-y-0 right-0 z-30 w-full max-w-[360px] p-3 sm:p-4">
                  {sidePanel === 'participants' ? (
                    <div className="h-full rounded-[24px] border border-white/10 bg-[#202124] p-3 shadow-[0_18px_60px_rgba(0,0,0,0.32)]">
                      <CallParticipantsList onClose={() => setSidePanel(null)} />
                    </div>
                  ) : (
                    <MeetingDetailsPanel
                      title={meeting.title}
                      description={meeting.description}
                      attendeeLabel={attendeeLabel}
                      meetingCode={meeting.meetingCode}
                      accessLabel={formatMeetingAccessLabel(meeting.accessType)}
                      meetingLink={meetingLink}
                      invitees={meeting.invitees}
                      enabledFeatures={enabledFeatures}
                      liveSignals={liveSignals}
                      isPersonalRoom={isPersonalRoom}
                      onCopyLink={handleCopyLink}
                      onClose={() => setSidePanel(null)}
                    />
                  )}
                </div>
              </>
            )}
          </div>
        </main>

        <footer className="absolute inset-x-3 bottom-3 z-40 flex flex-col gap-3 sm:inset-x-4 sm:bottom-4 lg:inset-x-5">
          <div className="flex items-end gap-3">
            <ParticipantPreviewStrip
              participantNames={participantNames}
              attendeeLabel={attendeeLabel}
              meetingCode={meeting.meetingCode}
            />

            <div className="flex flex-1 justify-center">
              <div className="meeting-room-dock rounded-[26px] border border-white/10 bg-[#17191c]/95 px-3.5 py-2.5 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl">
                <div className="flex items-center justify-center gap-2.5">
                  <ToggleAudioPublishingButton />
                  <ToggleVideoPublishingButton />
                  <ScreenShareButton />
                  {meeting.features.reactions && <ReactionsButton />}
                  <Button
                    type="button"
                    variant="ghost"
                    className="size-[3.25rem] rounded-2xl border border-[#f26b60]/40 bg-[#ea4335] p-0 text-white shadow-[0_10px_24px_rgba(234,67,53,0.3)] transition-transform hover:-translate-y-px hover:bg-[#f04b3e] hover:text-white"
                    onClick={handleLeaveCall}
                  >
                    <PhoneOff size={18} />
                  </Button>
                </div>
              </div>
            </div>

            <div className="hidden min-w-[220px] justify-end gap-2 lg:flex">
              {meeting.features.handRaise && (
                <FooterToggleButton
                  label={isHandRaised ? 'Lower hand' : 'Raise hand'}
                  icon={Activity}
                  active={isHandRaised}
                  onClick={() => setIsHandRaised((currentValue) => !currentValue)}
                />
              )}
              {meeting.features.captions && (
                <FooterToggleButton
                  label="Captions"
                  icon={Captions}
                  active={captionsEnabled}
                  onClick={() =>
                    setCaptionsEnabled((currentValue) => !currentValue)
                  }
                />
              )}
              {meeting.features.noiseCancellation && (
                <FooterToggleButton
                  label="Noise"
                  icon={Volume2}
                  active={noiseCancellationEnabled}
                  onClick={() =>
                    setNoiseCancellationEnabled((currentValue) => !currentValue)
                  }
                />
              )}
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-2 lg:hidden">
            {meeting.features.handRaise && (
              <FooterToggleButton
                label={isHandRaised ? 'Lower hand' : 'Raise hand'}
                icon={Activity}
                active={isHandRaised}
                onClick={() => setIsHandRaised((currentValue) => !currentValue)}
              />
            )}
            {meeting.features.captions && (
              <FooterToggleButton
                label="Captions"
                icon={Captions}
                active={captionsEnabled}
                onClick={() => setCaptionsEnabled((currentValue) => !currentValue)}
              />
            )}
            {meeting.features.noiseCancellation && (
              <FooterToggleButton
                label="Noise"
                icon={Volume2}
                active={noiseCancellationEnabled}
                onClick={() =>
                  setNoiseCancellationEnabled((currentValue) => !currentValue)
                }
              />
            )}
          </div>
        </footer>
      </div>
    </section>
  );
};

export default MeetingRoom;
