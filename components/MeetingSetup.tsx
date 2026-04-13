'use client';

import { useEffect, useState } from 'react';
import {
  DeviceSettings,
  VideoPreview,
  useCall,
  useCallStateHooks,
} from '@stream-io/video-react-sdk';

import {
  formatMeetingAccessLabel,
  getEnabledMeetingFeatures,
  getMeetingLink,
  getMeetingMetadata,
} from '@/lib/meeting';
import {
  isStreamTimeoutError,
  STREAM_REQUEST_TIMEOUT_MS,
} from '@/lib/stream';

import Alert from './Alert';
import { Button } from './ui/button';
import { useToast } from './ui/use-toast';

const MeetingSetup = ({
  setIsSetupComplete,
}: {
  setIsSetupComplete: (value: boolean) => void;
}) => {
  const { useCallEndedAt, useCallStartsAt } = useCallStateHooks();
  const callStartsAt = useCallStartsAt();
  const callEndedAt = useCallEndedAt();
  const callTimeNotArrived =
    callStartsAt && new Date(callStartsAt) > new Date();
  const callHasEnded = !!callEndedAt;

  const call = useCall();
  const { toast } = useToast();
  const [isJoining, setIsJoining] = useState(false);

  if (!call) {
    throw new Error(
      'useStreamCall must be used within a StreamCall component.',
    );
  }

  const { camera, microphone } = call;

  const meeting = getMeetingMetadata(call);
  const enabledFeatures = getEnabledMeetingFeatures(meeting);
  const meetingLink = getMeetingLink(call.id);

  const [isMicCamToggled, setIsMicCamToggled] = useState(false);
  const [captionsEnabled, setCaptionsEnabled] = useState(meeting.features.captions);
  const [noiseCancellationEnabled, setNoiseCancellationEnabled] = useState(
    meeting.features.noiseCancellation,
  );

  useEffect(() => {
    const setupDevices = async () => {
      try {
        if (isMicCamToggled) {
          // Disable devices
          try {
            await camera.disable();
          } catch (err) {
            console.warn('Failed to disable camera:', err);
          }
          try {
            await microphone.disable();
          } catch (err) {
            console.warn('Failed to disable microphone:', err);
          }
          return;
        }

        // Enable devices with error handling
        try {
          await camera.enable();
        } catch (err) {
          console.warn('Failed to enable camera:', err);
          toast({
            title: 'Camera not available',
            description: 'Could not access your camera. Check permissions and try again.',
            variant: 'destructive',
          });
        }

        try {
          await microphone.enable();
        } catch (err) {
          console.warn('Failed to enable microphone:', err);
          toast({
            title: 'Microphone not available',
            description: 'Could not access your microphone. Check permissions and try again.',
            variant: 'destructive',
          });
        }
      } catch (err) {
        console.error('Device setup error:', err);
      }
    };

    void setupDevices();
  }, [camera, isMicCamToggled, microphone, toast]);

  if (callTimeNotArrived)
    return (
      <Alert
        title={`Your Meeting has not started yet. It is scheduled for ${callStartsAt.toLocaleString()}`}
      />
    );

  if (callHasEnded)
    return (
      <Alert
        title="The call has been ended by the host"
        iconUrl="/icons/call-ended.svg"
      />
    );

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-dark-2 px-4 py-8 text-white">
      <div className="w-full max-w-6xl rounded-[28px] bg-dark-1 p-6 shadow-2xl lg:p-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="flex flex-col gap-4">
            <div className="rounded-[24px] bg-dark-2 p-5">
              <p className="text-sm uppercase tracking-[0.2em] text-sky-1">
                Meet-style pre-join
              </p>
              <h1 className="mt-2 text-3xl font-bold">{meeting.title}</h1>
              <p className="mt-1 text-sm text-sky-1">
                {meeting.meetingCode} ·{' '}
                {formatMeetingAccessLabel(meeting.accessType)}
              </p>
              <p className="mt-3 text-base text-sky-2">{meeting.description}</p>
            </div>

            <div className="overflow-hidden rounded-[24px] border border-dark-3 bg-dark-2 p-4">
              <VideoPreview />
            </div>

            <div className="flex flex-wrap gap-2">
              {enabledFeatures.map((feature) => (
                <span
                  key={feature}
                  className="rounded-full bg-dark-3 px-3 py-1 text-sm text-sky-2"
                >
                  {feature}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="rounded-[24px] bg-dark-2 p-5">
              <h2 className="text-lg font-semibold">Before you join</h2>
              <div className="mt-4 grid gap-3">
                <label className="flex items-center justify-between gap-3 rounded-2xl bg-dark-3 px-4 py-3 text-sm">
                  <span>Join with mic and camera off</span>
                  <input
                    type="checkbox"
                    checked={isMicCamToggled}
                    onChange={(event) =>
                      setIsMicCamToggled(event.target.checked)
                    }
                  />
                </label>

                {meeting.features.captions && (
                  <button
                    type="button"
                    onClick={() => setCaptionsEnabled((currentValue) => !currentValue)}
                    className="flex items-center justify-between gap-3 rounded-2xl bg-dark-3 px-4 py-3 text-sm"
                  >
                    <span>Live captions</span>
                    <span className="text-sky-1">
                      {captionsEnabled ? 'On' : 'Off'}
                    </span>
                  </button>
                )}

                {meeting.features.noiseCancellation && (
                  <button
                    type="button"
                    onClick={() =>
                      setNoiseCancellationEnabled((currentValue) => !currentValue)
                    }
                    className="flex items-center justify-between gap-3 rounded-2xl bg-dark-3 px-4 py-3 text-sm"
                  >
                    <span>Noise cancellation</span>
                    <span className="text-sky-1">
                      {noiseCancellationEnabled ? 'On' : 'Off'}
                    </span>
                  </button>
                )}
              </div>

              <div className="mt-4 flex flex-col gap-3">
                <DeviceSettings />
                <Button
                  type="button"
                  variant="ghost"
                  className="justify-start rounded-2xl border border-dark-3 bg-dark-3 text-white hover:bg-dark-4 hover:text-white"
                  onClick={() => {
                    navigator.clipboard.writeText(meetingLink);
                    toast({ title: 'Invite link copied' });
                  }}
                >
                  Copy invite link
                </Button>
              </div>
            </div>

            <div className="rounded-[24px] bg-dark-2 p-5">
              <h2 className="text-lg font-semibold">Meeting details</h2>
              <div className="mt-4 grid gap-3 text-sm">
                <div className="rounded-2xl bg-dark-3 px-4 py-3">
                  <p className="text-sky-1">Quick access</p>
                  <p className="mt-1 text-white">
                    {meeting.features.quickAccess
                      ? 'Guests can join from the link without waiting.'
                      : 'Host approval is expected before guests join.'}
                  </p>
                </div>

                <div className="rounded-2xl bg-dark-3 px-4 py-3">
                  <p className="text-sky-1">Invite list</p>
                  <p className="mt-1 text-white">
                    {meeting.invitees.length > 0
                      ? `${meeting.invitees.length} invitee(s) added`
                      : 'No invitees were listed for this meeting.'}
                  </p>
                </div>

                {meeting.features.captions && captionsEnabled && (
                  <div className="rounded-2xl bg-blue-1/10 px-4 py-3 text-sky-2">
                    Captions will be surfaced after you join.
                  </div>
                )}

                {meeting.features.noiseCancellation && noiseCancellationEnabled && (
                  <div className="rounded-2xl bg-blue-1/10 px-4 py-3 text-sky-2">
                    Noise cancellation is enabled for this session.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-sky-1">
            Review your devices, confirm your meeting settings, then join.
          </p>
          <Button
            className="rounded-2xl bg-green-500 px-6 py-2.5 text-white hover:bg-green-500/90"
            disabled={isJoining}
            onClick={async () => {
              setIsJoining(true);

              try {
                // Ensure devices are properly initialized before joining
                if (!isMicCamToggled) {
                  try {
                    await camera.enable();
                  } catch (err) {
                    console.warn('Pre-join camera enable failed:', err);
                  }
                  try {
                    await microphone.enable();
                  } catch (err) {
                    console.warn('Pre-join microphone enable failed:', err);
                  }
                }

                await call.join({
                  create: false,
                  video: !isMicCamToggled,
                  joinResponseTimeout: STREAM_REQUEST_TIMEOUT_MS,
                  rpcRequestTimeout: STREAM_REQUEST_TIMEOUT_MS,
                });
                setIsSetupComplete(true);
              } catch (error) {
                console.error('Failed to join meeting:', error);
                
                const errorMessage = error instanceof Error ? error.message : String(error);
                
                if (isStreamTimeoutError(error)) {
                  toast({
                    title: 'Meeting join timed out',
                    description: `Stream did not respond within ${Math.round(
                      STREAM_REQUEST_TIMEOUT_MS / 1000,
                    )} seconds. Check your internet connection, firewall, VPN, and Stream app configuration, then try again.`,
                    variant: 'destructive',
                  });
                } else if (errorMessage.includes('NotReadableError') || errorMessage.includes('device')) {
                  toast({
                    title: 'Device access failed',
                    description: 'Your camera or microphone is not available. Check permissions, close other apps using these devices, and try again.',
                    variant: 'destructive',
                  });
                } else {
                  toast({
                    title: 'Failed to join meeting',
                    description:
                      'The meeting request could not be completed. Try again, and verify your Stream credentials if the issue persists.',
                    variant: 'destructive',
                  });
                }
              } finally {
                setIsJoining(false);
              }}}
          >
            {isJoining ? 'Joining...' : 'Join meeting'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MeetingSetup;
