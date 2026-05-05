import React from 'react';

export type CreTextVariant = 'body' | 'caption' | 'label';
export type CreTextTone = 'default' | 'muted' | 'subtle';

function variantStyle(variant: CreTextVariant): React.CSSProperties {
  switch (variant) {
    case 'caption':
      return {
        fontFamily: 'var(--cre-font-family-caption)',
        fontSize: 'var(--cre-font-size-pico)',
      };
    case 'label':
      return {
        fontFamily: 'var(--cre-font-family-body)',
        fontSize: 'var(--cre-font-size-micro)',
        fontWeight: 600,
      };
    case 'body':
    default:
      return {
        fontFamily: 'var(--cre-font-family-body)',
        fontSize: 'var(--cre-font-size-tiny)',
      };
  }
}

function toneColor(tone: CreTextTone): string {
  switch (tone) {
    case 'subtle':
      return 'var(--cre-color-text-subtle)';
    case 'muted':
      return 'var(--cre-color-text-muted)';
    case 'default':
    default:
      return 'var(--cre-color-text)';
  }
}

export type TextProps<T extends React.ElementType = 'span'> = {
  as?: T;
  variant?: CreTextVariant;
  tone?: CreTextTone;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
} & Omit<React.ComponentPropsWithoutRef<T>, 'as' | 'className' | 'style' | 'children'>;

export function Text<T extends React.ElementType = 'span'>({
  as,
  variant = 'body',
  tone = 'default',
  className,
  style,
  children,
  ...rest
}: TextProps<T>) {
  const Component = (as ?? 'span') as React.ElementType;

  return (
    <Component
      className={className}
      style={{
        margin: 0,
        color: toneColor(tone),
        ...variantStyle(variant),
        ...style,
      }}
      {...rest}
    >
      {children}
    </Component>
  );
}
Text.displayName = 'Text';
