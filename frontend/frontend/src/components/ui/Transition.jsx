import React from 'react';
import { cn } from '../../utils/cn';

export const DEFAULT_DURATION_MS = 500;

export default function Transition({
  open,
  children,
  className,
  baseClassName = 'transition-all duration-500 ease-out',
  enterClassName = '',
  exitClassName = '',
  durationMs = DEFAULT_DURATION_MS,
  persist = false,
  as = 'div',
  ...props
}) {
  const ComponentTag = as;
  const [isMounted, setIsMounted] = React.useState(open || persist);
  const [isVisible, setIsVisible] = React.useState(open);

  React.useEffect(() => {
    if (open) {
      setIsMounted(true);
      const frame = requestAnimationFrame(() => setIsVisible(true));
      return () => cancelAnimationFrame(frame);
    }
    setIsVisible(false);
    if (!persist) {
      const timeout = window.setTimeout(() => setIsMounted(false), durationMs);
      return () => window.clearTimeout(timeout);
    }
    return undefined;
  }, [open, persist, durationMs]);

  if (!isMounted && !persist) {
    return null;
  }

  return React.createElement(
    ComponentTag,
    {
      className: cn(baseClassName, className, isVisible ? enterClassName : exitClassName),
      ...props,
    },
    children
  );
}
