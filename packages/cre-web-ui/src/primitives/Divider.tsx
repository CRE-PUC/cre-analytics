import React from 'react';

export type DividerProps = {
  orientation?: 'horizontal' | 'vertical';
  className?: string;
  style?: React.CSSProperties;
};

export function Divider({
  orientation = 'horizontal',
  className,
  style,
}: DividerProps) {
  const isVertical = orientation === 'vertical';

  return (
    <div
      role="separator"
      aria-orientation={isVertical ? 'vertical' : 'horizontal'}
      className={className}
      style={{
        alignSelf: 'stretch',
        background: 'var(--cre-color-border)',
        width: isVertical ? 'var(--cre-border-width-small)' : '100%',
        height: isVertical ? '100%' : 'var(--cre-border-width-small)',
        flexShrink: 0,
        ...style,
      }}
    />
  );
}
Divider.displayName = 'Divider';
