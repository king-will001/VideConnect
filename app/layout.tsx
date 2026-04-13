import { ReactNode } from 'react';
import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';

import './globals.css';
import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
  title: 'VideConnect',
  description: 'VideConnect video calling app',
  icons: {
    icon: '/icons/logo.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body className="bg-dark-2">
        <ClerkProvider
          appearance={{
            layout: {
              socialButtonsVariant: 'iconButton',
              logoImageUrl: '/icons/logo.svg',
            },
            variables: {
              colorText: '#fff',
              colorTextSecondary: '#C9DDFF',
              colorPrimary: '#0E78F9',
              colorBackground: '#1C1F2E',
              colorInputBackground: '#252A41',
              colorInputText: '#fff',
            },
            elements: {
              card: 'border border-dark-3 bg-dark-1 text-white shadow-none',
              cardBox: 'shadow-none',
              headerTitle: 'text-white',
              headerSubtitle: 'text-sky-1',
              socialButtonsBlockButton:
                'border-2 border-[#565761] bg-dark-3 text-white hover:bg-dark-4',
              socialButtonsBlockButtonText: 'text-white',
              dividerLine: 'bg-dark-3',
              dividerText: 'text-sky-1',
              formFieldLabel: 'text-sky-2',
              formFieldInput:
                'border-dark-3 bg-dark-3 text-white placeholder:text-sky-1',
              formFieldHintText: 'text-sky-1',
              formFieldSuccessText: 'text-sky-1',
              formFieldErrorText: 'text-red-400',
              footerActionText: 'text-sky-1',
              footerActionLink: 'text-blue-1 hover:text-blue-1/90',
              formButtonPrimary:
                'bg-blue-1 text-white hover:bg-blue-1/90 focus-visible:ring-0 focus-visible:ring-offset-0',
              identityPreviewText: 'text-white',
              identityPreviewEditButton:
                'text-blue-1 hover:text-blue-1/90',
              formResendCodeLink: 'text-blue-1 hover:text-blue-1/90',
              otpCodeFieldInput:
                'border-dark-3 bg-dark-3 text-white',
            },
          }}
        >
          <Toaster />
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
