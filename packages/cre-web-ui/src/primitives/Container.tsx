import React from 'react';
import type { CreSpace } from './spacing';
import { spaceVar } from './spacing';

export type CreContainerSize = 'read' | 'focu' | 'seco' | 'main' | 'full';

function sizeToVar(size: CreContainerSize): string {
  switch (size) {
    case 'read':
      return 'var(--cre-layout-read)';
    case 'focu':
      return 'var(--cre-layout-focu)';
    case 'seco':
      return 'var(--cre-layout-seco)';
    case 'full':
      return 'var(--cre-layout-full)';
    case 'main':
    default:
      return 'var(--cre-layout-main)';
  }
}

export type ContainerProps<T extends React.ElementType = 'div'> = {
  as?: T;
  size?: CreContainerSize;
  paddingX?: CreSpace;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
} & Omit<React.ComponentPropsWithoutRef<T>, 'as' | 'className' | 'style' | 'children'>;

export function Container<T extends React.ElementType = 'div'>({
  as,
  size = 'main',
  paddingX = 'micro',
  className,
  style,
  children,
  ...rest
}: ContainerProps<T>) {
  const Component = (as ?? 'div') as React.ElementType;

  return (
    <Component
      className={className}
      style={{
        width: '100%',
        maxWidth: sizeToVar(size),
        marginLeft: 'auto',
        marginRight: 'auto',
        paddingLeft: spaceVar(paddingX),
        paddingRight: spaceVar(paddingX),
        boxSizing: 'border-box',
        ...style,
      }}
      {...rest}
    >
      {children}
    </Component>
  );
}
Container.displayName = 'Container';
