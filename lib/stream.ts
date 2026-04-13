export const STREAM_REQUEST_TIMEOUT_MS = 30000;
const STREAM_TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;

type StreamTokenPayload = {
  error?: string;
  expiresAt?: number;
  token?: string;
};

type StreamLogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'silent';
type StreamLogger = (
  logLevel: StreamLogLevel,
  message: string,
  ...args: unknown[]
) => void;

let cachedStreamToken:
  | {
      expiresAt: number;
      token: string;
    }
  | null = null;
let pendingStreamTokenRequest: Promise<string> | null = null;

const isEmptyLogPayload = (value: unknown) => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  const values = Object.values(value);

  return (
    values.length === 0 ||
    values.every((item) => item === undefined || item === null || item === '')
  );
};

const streamLogger: StreamLogger = (logLevel, message, ...args) => {
  if (logLevel === 'silent') return;

  const isEmptySfuError =
    logLevel === 'error' &&
    message.includes('SFU reported error') &&
    args.length === 1 &&
    isEmptyLogPayload(args[0]);

  if (isEmptySfuError) {
    console.warn(message, ...args);

    return;
  }

  switch (logLevel) {
    case 'error':
      console.error(message, ...args);
      break;
    case 'warn':
      console.warn(message, ...args);
      break;
    case 'info':
      console.info(message, ...args);
      break;
    case 'trace':
      console.trace(message, ...args);
      break;
    default:
      console.log(message, ...args);
      break;
  }
};

export const STREAM_CLIENT_OPTIONS = {
  logger: streamLogger,
  timeout: STREAM_REQUEST_TIMEOUT_MS,
  locationHintTimeout: STREAM_REQUEST_TIMEOUT_MS,
  defaultWsTimeout: STREAM_REQUEST_TIMEOUT_MS,
  axiosRequestConfig: {
    timeout: STREAM_REQUEST_TIMEOUT_MS,
  },
};

export const tokenProvider = async () => {
  if (
    cachedStreamToken &&
    Date.now() < cachedStreamToken.expiresAt - STREAM_TOKEN_REFRESH_BUFFER_MS
  ) {
    return cachedStreamToken.token;
  }

  if (pendingStreamTokenRequest) {
    return pendingStreamTokenRequest;
  }

  pendingStreamTokenRequest = (async () => {
    const response = await fetch('/api/stream-token', {
      method: 'POST',
      cache: 'no-store',
    });

    const payload = (await response.json().catch(() => null)) as
      | StreamTokenPayload
      | null;

    if (!response.ok || !payload?.token) {
      throw new Error(payload?.error || 'Failed to fetch Stream user token');
    }

    if (payload.expiresAt) {
      cachedStreamToken = {
        token: payload.token,
        expiresAt: payload.expiresAt,
      };
    }

    return payload.token;
  })();

  try {
    return await pendingStreamTokenRequest;
  } finally {
    pendingStreamTokenRequest = null;
  }
};

export const resetStreamTokenCache = () => {
  cachedStreamToken = null;
  pendingStreamTokenRequest = null;
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

export const isStreamTimeoutError = (error: unknown) => {
  const queue: unknown[] = [error];
  const visited = new Set<unknown>();

  while (queue.length > 0) {
    const current = queue.shift();

    if (!current || visited.has(current)) {
      continue;
    }

    visited.add(current);

    if (typeof current === 'string') {
      const normalized = current.toLowerCase();

      if (
        normalized.includes('timeout') ||
        normalized.includes('timed out') ||
        normalized.includes('econnaborted')
      ) {
        return true;
      }

      continue;
    }

    if (current instanceof Error) {
      queue.push(current.message, current.cause);
      continue;
    }

    if (!isObject(current)) {
      continue;
    }

    queue.push(
      current.message,
      current.code,
      current.name,
      current.cause,
      current.error,
    );
  }

  return false;
};
