import React from 'react';
import type { CreSpace } from './spacing';
import { spaceVar } from './spacing';

export type GridProps<T extends React.ElementType = 'div'> = {
  as?: T;
  columns?: number;
  minItemWidth?: number | string;
  gap?: CreSpace;
  align?: React.CSSProperties['alignItems'];
  justify?: React.CSSProperties['justifyItems'];
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
} & Omit<React.ComponentPropsWithoutRef<T>, 'as' | 'className' | 'style' | 'children'>;

function toCssLength(value: number | string): string {
  return typeof value === 'number' ? `${value}px` : value;
}

export function Grid<T extends React.ElementType = 'div'>({
  as,
  columns,
  minItemWidth,
  gap = 'micro',
  align,
  justify,
  className,
  style,
  children,
  ...rest
}: GridProps<T>) {
  const Component = (as ?? 'div') as React.ElementType;

  const templateColumns =
    typeof minItemWidth !== 'undefined'
      ? `repeat(auto-fit, minmax(${toCssLength(minItemWidth)}, 1fr))`
      : typeof columns === 'number'
        ? `repeat(${columns}, minmax(0, 1fr))`
        : undefined;

  return (
    <Component
      className={className}
      style={{
        display: 'grid',
        gridTemplateColumns: templateColumns,
        gap: spaceVar(gap),
        alignItems: align,
        justifyItems: justify,
        ...style,
      }}
      {...rest}
    >
      {children}
    </Component>
  );
}
Grid.displayName = 'Grid';
