import React from 'react';
import type { CreSpace } from './spacing';
import { spaceVar } from './spacing';

export type StackProps<T extends React.ElementType = 'div'> = {
  as?: T;
  gap?: CreSpace;
  align?: React.CSSProperties['alignItems'];
  justify?: React.CSSProperties['justifyContent'];
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
} & Omit<React.ComponentPropsWithoutRef<T>, 'as' | 'className' | 'style' | 'children'>;

export function Stack<T extends React.ElementType = 'div'>({
  as,
  gap = 'micro',
  align,
  justify,
  className,
  style,
  children,
  ...rest
}: StackProps<T>) {
  const Component = (as ?? 'div') as React.ElementType;

  return (
    <Component
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: spaceVar(gap),
        alignItems: align,
        justifyContent: justify,
        ...style,
      }}
      {...rest}
    >
      {children}
    </Component>
  );
}
Stack.displayName = 'Stack';
