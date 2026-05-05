import React from 'react';

export type IconSlotProps = {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  size?: string;
  padding?: string;
};

export function IconSlot({
  children,
  className,
  style,
  size = 'var(--cre-button-icon-size)',
  padding = 'var(--cre-button-icon-padding)',
}: IconSlotProps) {
  if (!children) return null;

  return (
    <span
      aria-hidden="true"
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        padding,
        flexShrink: 0,
        color: 'inherit',
        ...style,
      }}
    >
      {children}
    </span>
  );
}
IconSlot.displayName = 'IconSlot';
