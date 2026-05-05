import React from 'react';

export type ScrollAreaProps<T extends React.ElementType = 'div'> = {
  as?: T;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
} & Omit<React.ComponentPropsWithoutRef<T>, 'as' | 'className' | 'style' | 'children'>;

export function ScrollArea<T extends React.ElementType = 'div'>({
  as,
  className,
  style,
  children,
  ...rest
}: ScrollAreaProps<T>) {
  const Component = (as ?? 'div') as React.ElementType;

  return (
    <Component
      className={className}
      style={{
        overflow: 'auto',
        WebkitOverflowScrolling: 'touch',
        boxSizing: 'border-box',
        maxHeight: '100%',
        minHeight: 0,
        ...style,
      }}
      {...rest}
    >
      {children}
    </Component>
  );
}
ScrollArea.displayName = 'ScrollArea';
