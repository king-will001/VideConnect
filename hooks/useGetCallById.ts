import { useEffect, useState } from 'react';
import { Call, useStreamVideoClient } from '@stream-io/video-react-sdk';

const DEFAULT_CALL_TYPE = 'default';

export const useGetCallById = (id: string | string[]) => {
  const [call, setCall] = useState<Call>();
  const [isCallLoading, setIsCallLoading] = useState(false);

  const client = useStreamVideoClient();
  const callId = Array.isArray(id) ? id[0] : id;

  useEffect(() => {
    let isMounted = true;

    if (!client || !callId) return;

    const loadCall = async () => {
      try {
        setIsCallLoading(true);
        setCall(undefined);

        const nextCall = client.call(DEFAULT_CALL_TYPE, callId);
        await nextCall.get();

        if (isMounted) {
          setCall(nextCall);
        }

        if (isMounted) {
          setIsCallLoading(false);
        }
      } catch (error) {
        console.error(error);

        if (isMounted) {
          setCall(undefined);
          setIsCallLoading(false);
        }
      }
    };

    void loadCall();

    return () => {
      isMounted = false;
    };
  }, [callId, client]);

  return {
    call,
    isCallLoading: Boolean(callId) && (!client || isCallLoading),
  };
};
