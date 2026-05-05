import React from 'react';
import type { CreSpace } from './spacing';
import { spaceVar } from './spacing';

export type InlineProps<T extends React.ElementType = 'div'> = {
  as?: T;
  gap?: CreSpace;
  align?: React.CSSProperties['alignItems'];
  justify?: React.CSSProperties['justifyContent'];
  wrap?: boolean;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
} & Omit<React.ComponentPropsWithoutRef<T>, 'as' | 'className' | 'style' | 'children'>;

export function Inline<T extends React.ElementType = 'div'>({
  as,
  gap = 'micro',
  align,
  justify,
  wrap = false,
  className,
  style,
  children,
  ...rest
}: InlineProps<T>) {
  const Component = (as ?? 'div') as React.ElementType;

  return (
    <Component
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'row',
        flexWrap: wrap ? 'wrap' : 'nowrap',
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
Inline.displayName = 'Inline';
