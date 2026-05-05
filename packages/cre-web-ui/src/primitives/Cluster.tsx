import React from 'react';
import type { CreSpace } from './spacing';
import { spaceVar } from './spacing';

export type ClusterProps<T extends React.ElementType = 'div'> = {
  as?: T;
  gap?: CreSpace;
  align?: React.CSSProperties['alignItems'];
  justify?: React.CSSProperties['justifyContent'];
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
} & Omit<React.ComponentPropsWithoutRef<T>, 'as' | 'className' | 'style' | 'children'>;

export function Cluster<T extends React.ElementType = 'div'>({
  as,
  gap = 'nano',
  align = 'center',
  justify,
  className,
  style,
  children,
  ...rest
}: ClusterProps<T>) {
  const Component = (as ?? 'div') as React.ElementType;

  return (
    <Component
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'wrap',
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
Cluster.displayName = 'Cluster';
