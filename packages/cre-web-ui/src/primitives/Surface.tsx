import React from 'react';
import type { CreRadius } from './radius';
import { radiusVar } from './radius';
import type { CreSpace } from './spacing';
import { spaceVar } from './spacing';

export type CreSurfaceVariant = 'default' | 'subtle' | 'raised';

export type SurfaceProps<T extends React.ElementType = 'div'> = {
  as?: T;
  variant?: CreSurfaceVariant;
  padding?: CreSpace;
  radius?: CreRadius;
  border?: boolean;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
} & Omit<React.ComponentPropsWithoutRef<T>, 'as' | 'className' | 'style' | 'children'>;

function variantBg(variant: CreSurfaceVariant): string {
  switch (variant) {
    case 'raised':
      return 'var(--cre-color-surface-raised)';
    case 'subtle':
      return 'var(--cre-color-bg)';
    case 'default':
    default:
      return 'var(--cre-color-surface)';
  }
}

export function Surface<T extends React.ElementType = 'div'>({
  as,
  variant = 'default',
  padding = 'micro',
  radius = 'small',
  border = true,
  className,
  style,
  children,
  ...rest
}: SurfaceProps<T>) {
  const Component = (as ?? 'div') as React.ElementType;

  return (
    <Component
      className={className}
      style={{
        background: variantBg(variant),
        borderWidth: border ? 'var(--cre-border-width-small)' : 0,
        borderStyle: border ? 'solid' : 'none',
        borderColor: border ? 'var(--cre-color-border)' : 'transparent',
        borderRadius: radiusVar(radius),
        padding: spaceVar(padding),
        boxSizing: 'border-box',
        color: 'var(--cre-color-text)',
        ...style,
      }}
      {...rest}
    >
      {children}
    </Component>
  );
}
Surface.displayName = 'Surface';
