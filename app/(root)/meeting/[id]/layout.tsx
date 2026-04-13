import { ReactNode } from 'react';

import '@stream-io/video-react-sdk/dist/css/styles.css';

const MeetingLayout = ({ children }: Readonly<{ children: ReactNode }>) => {
  return <>{children}</>;
};

export default MeetingLayout;
