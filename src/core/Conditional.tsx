import React, { useEffect } from 'react';
import { Listeners } from './types';
import { flexRender } from './flexRender';

export type ConditionalProps = {
  show: boolean;
  persist?: boolean;
  children: React.ComponentType<{}> | React.ReactNode;
  fields?: { listeners: Listeners }[];
  onMount?: () => void;
  onUnmount?: () => void;
};

export const Conditional = ({
  show,
  onMount,
  onUnmount,
  fields,
  children,
}: ConditionalProps) => {
  const Component = children;

  const onMountListeners = fields
    ? fields.map(field => field.listeners.onMount)
    : [onMount];

  const onUnmountListeners = fields
    ? fields.map(field => field.listeners.onUnmount)
    : [onUnmount];

  return show ? (
    <UnmountWrapper onMount={onMountListeners} onUnmount={onUnmountListeners}>
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
  onMount?: (Listeners['onMount'] | undefined)[];
  onUnmount?: (Listeners['onUnmount'] | undefined)[];
  children: React.ReactNode;
}) => {
  useEffect(() => {
    onMount && onMount.forEach(mountFn => mountFn?.());

    return () => {
      onUnmount && onUnmount.forEach(unmountFn => unmountFn?.());
    };
  }, []);

  return <>{children}</>;
};
