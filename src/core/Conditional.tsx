import React, { useEffect } from 'react';
import { Listeners } from './types';
import { flexRender } from './flexRender';

export type ConditionalProps = {
  show: boolean;
  persist?: boolean;
  children: React.ComponentType<{}> | React.ReactNode;
  onMount?: () => void;
  onUnmount?: () => void;
};

export const Conditional = ({
  show,
  onMount,
  onUnmount,
  children,
}: ConditionalProps) => {
  const Component = children;
  return show ? (
    <UnmountWrapper onMount={onMount} onUnmount={onUnmount}>
      {flexRender(Component, {})}
    </UnmountWrapper>
  ) : (
    <></>
  );
};

const UnmountWrapper = ({
  onMount,
  onUnmount,
  children,
}: {
  onMount?: Listeners['onMount'];
  onUnmount?: Listeners['onUnmount'];
  children: React.ReactNode;
}) => {
  useEffect(() => {
    onMount && onMount();

    return () => {
      onUnmount && onUnmount();
    };
  }, [onMount, onUnmount]);

  return <>{children}</>;
};
