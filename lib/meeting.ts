import type { Call } from '@stream-io/video-react-sdk';

export type MeetingAccessType = 'link' | 'invite-only';
export type MeetingFeatureKey =
  | 'quickAccess'
  | 'captions'
  | 'noiseCancellation'
  | 'handRaise'
  | 'reactions';

export interface MeetingFeatures {
  quickAccess: boolean;
  captions: boolean;
  noiseCancellation: boolean;
  handRaise: boolean;
  reactions: boolean;
}

export interface MeetingMetadata {
  title: string;
  description: string;
  meetingCode: string;
  accessType: MeetingAccessType;
  invitees: string[];
  features: MeetingFeatures;
}

interface CallLike {
  id: string;
  state?: {
    custom?: unknown;
  };
}

export const defaultMeetingFeatures: MeetingFeatures = {
  quickAccess: true,
  captions: true,
  noiseCancellation: false,
  handRaise: true,
  reactions: true,
};

export const meetingFeatureOptions: Array<{
  key: MeetingFeatureKey;
  label: string;
  description: string;
}> = [
  {
    key: 'quickAccess',
    label: 'Quick access',
    description: 'Let guests join from the link without waiting.',
  },
  {
    key: 'captions',
    label: 'Captions',
    description: 'Surface live captions during the meeting.',
  },
  {
    key: 'noiseCancellation',
    label: 'Noise cancellation',
    description: 'Reduce background distractions before joining.',
  },
  {
    key: 'handRaise',
    label: 'Hand raise',
    description: 'Allow participants to raise a hand when they want to speak.',
  },
  {
    key: 'reactions',
    label: 'Reactions',
    description: 'Enable lightweight in-call feedback.',
  },
];

const meetingPathPrefix = '/meeting/';
const meetingAlphabet = 'abcdefghijklmnopqrstuvwxyz';
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, '') ?? '';

const isObjectRecord = (
  value: unknown,
): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const getStringValue = (value: unknown) => {
  return typeof value === 'string' ? value.trim() : '';
};

const isMeetingAccessType = (value: unknown): value is MeetingAccessType => {
  return value === 'link' || value === 'invite-only';
};

const createRandomByteArray = (length: number) => {
  const bytes = new Uint8Array(length);

  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    globalThis.crypto.getRandomValues(bytes);

    return bytes;
  }

  for (let index = 0; index < length; index += 1) {
    bytes[index] = Math.floor(Math.random() * 256);
  }

  return bytes;
};

const getFeatureFlag = (
  features: Record<string, unknown>,
  key: keyof MeetingFeatures,
) => {
  const value = features[key];

  return typeof value === 'boolean' ? value : defaultMeetingFeatures[key];
};

const getInvitees = (value: unknown) => {
  if (!Array.isArray(value)) return [];

  return Array.from(
    new Set(
      value
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
};

export const createMeetingCode = () => {
  const bytes = createRandomByteArray(10);
  const characters = Array.from(bytes, (byte) => meetingAlphabet[byte % 26]);

  return `${characters.slice(0, 3).join('')}-${characters
    .slice(3, 7)
    .join('')}-${characters.slice(7, 10).join('')}`;
};

export const normalizeMeetingJoinValue = (value: string) => {
  const trimmedValue = value.trim();

  if (!trimmedValue) return '';

  const compactCode = trimmedValue.replace(/[\s-]/g, '').toLowerCase();
  const isMeetStyleCode =
    compactCode.length === 10 && /^[a-z0-9\s-]+$/i.test(trimmedValue);

  if (isMeetStyleCode) {
    return `${compactCode.slice(0, 3)}-${compactCode.slice(
      3,
      7,
    )}-${compactCode.slice(7, 10)}`;
  }

  return trimmedValue;
};

export const parseInvitees = (value: string) => {
  return Array.from(
    new Set(
      value
        .split(/[\n,]/)
        .map((invitee) => invitee.trim())
        .filter(Boolean),
    ),
  );
};

export const getMeetingJoinDestination = (value: string) => {
  const trimmedValue = value.trim();

  if (!trimmedValue) return null;

  if (/^https?:\/\//i.test(trimmedValue)) {
    try {
      const parsedUrl = new URL(trimmedValue);

      if (parsedUrl.pathname.startsWith(meetingPathPrefix)) {
        return {
          internalPath: `${parsedUrl.pathname}${parsedUrl.search}`,
        };
      }

      return { externalUrl: trimmedValue };
    } catch {
      return { externalUrl: trimmedValue };
    }
  }

  if (trimmedValue.startsWith(meetingPathPrefix)) {
    return { internalPath: trimmedValue };
  }

  const directPathMatch = trimmedValue.match(
    /meeting\/([^/?#\s]+(?:\?[^#\s]+)?)/i,
  );

  if (directPathMatch?.[1]) {
    return {
      internalPath: `${meetingPathPrefix}${directPathMatch[1]}`,
    };
  }

  return {
    internalPath: `${meetingPathPrefix}${normalizeMeetingJoinValue(
      trimmedValue,
    )}`,
  };
};

export const formatMeetingAccessLabel = (accessType: MeetingAccessType) => {
  return accessType === 'invite-only'
    ? 'Invited people only'
    : 'Anyone with the link';
};

export const getMeetingPath = (meetingId: string, query = '') => {
  return `${meetingPathPrefix}${meetingId}${query}`;
};

export const getMeetingAutoJoinPath = (
  meetingId: string,
  options?: {
    personal?: boolean;
  },
) => {
  const params = new URLSearchParams();

  if (options?.personal) {
    params.set('personal', 'true');
  }

  params.set('autojoin', '1');

  return getMeetingPath(meetingId, `?${params.toString()}`);
};

export const getMeetingLink = (meetingId: string, query = '') => {
  const path = getMeetingPath(meetingId, query);

  return baseUrl ? `${baseUrl}${path}` : path;
};

export const getMeetingMetadata = (call?: CallLike | Call | null) => {
  const custom = isObjectRecord(call?.state?.custom) ? call.state.custom : {};
  const features = isObjectRecord(custom.features) ? custom.features : {};

  const description = getStringValue(custom.description);
  const title =
    getStringValue(custom.meetingTitle) || description || 'Untitled meeting';

  return {
    title,
    description,
    meetingCode:
      getStringValue(custom.meetingCode) ||
      normalizeMeetingJoinValue(call?.id ?? ''),
    accessType: isMeetingAccessType(custom.accessType)
      ? custom.accessType
      : 'link',
    invitees: getInvitees(custom.invitees),
    features: {
      quickAccess: getFeatureFlag(features, 'quickAccess'),
      captions: getFeatureFlag(features, 'captions'),
      noiseCancellation: getFeatureFlag(features, 'noiseCancellation'),
      handRaise: getFeatureFlag(features, 'handRaise'),
      reactions: getFeatureFlag(features, 'reactions'),
    },
  } satisfies MeetingMetadata;
};

export const getEnabledMeetingFeatures = (metadata: MeetingMetadata) => {
  return meetingFeatureOptions
    .filter((feature) => metadata.features[feature.key])
    .map((feature) => feature.label);
};
