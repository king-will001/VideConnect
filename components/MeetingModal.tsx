'use client';

import Image from 'next/image';
import { ReactNode } from 'react';

import { cn } from '@/lib/utils';

import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from './ui/dialog';

interface MeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  className?: string;
  contentClassName?: string;
  children?: ReactNode;
  handleClick?: () => void;
  buttonText?: string;
  image?: string;
  buttonClassName?: string;
  buttonIcon?: string;
}

const MeetingModal = ({
  isOpen,
  onClose,
  title,
  className,
  contentClassName,
  children,
  handleClick,
  buttonText,
  image,
  buttonClassName,
  buttonIcon,
}: MeetingModalProps) => {
  const ctaText = buttonText || 'Schedule Meeting';

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent
        className={cn(
          'flex w-full max-w-[520px] flex-col gap-6 border-none bg-dark-1 px-6 py-9 text-white',
          contentClassName,
        )}
      >
        <div className="flex flex-col gap-6">
          {image && (
            <div className="flex justify-center">
              <Image src={image} alt="checked" width={72} height={72} />
            </div>
          )}
          <DialogTitle
            className={cn('text-3xl font-bold leading-[42px]', className)}
          >
            {title}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {`${title}. ${ctaText}.`}
          </DialogDescription>
          {children}
          <Button
            type="button"
            className={cn(
              'gap-2 bg-blue-1 focus-visible:ring-0 focus-visible:ring-offset-0',
              buttonClassName,
            )}
            onClick={handleClick}
          >
            {buttonIcon && (
              <Image
                src={buttonIcon}
                alt="button icon"
                width={13}
                height={13}
              />
            )}
            <span>{ctaText}</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MeetingModal;
