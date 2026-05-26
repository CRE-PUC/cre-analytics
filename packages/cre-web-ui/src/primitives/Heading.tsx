import React from 'react';
import { Text } from './Text';

export type HeadingProps = {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
} & Omit<React.ComponentPropsWithoutRef<'h1'>, 'as' | 'className' | 'style' | 'children'>;

function sizeForLevel(level: 1 | 2 | 3 | 4 | 5 | 6): React.CSSProperties {
  switch (level) {
    case 1:
      return { fontSize: 'var(--cre-font-size-xxlarge)', fontWeight: 700, fontFamily: 'var(--cre-font-family-heading)' };
    case 2:
      return { fontSize: 'var(--cre-font-size-xlarge)', fontWeight: 700, fontFamily: 'var(--cre-font-family-heading)' };
    case 3:
      return { fontSize: 'var(--cre-font-size-large)', fontWeight: 700, fontFamily: 'var(--cre-font-family-heading)' };
    case 4:
      return { fontSize: 'var(--cre-font-size-medium)', fontWeight: 700, fontFamily: 'var(--cre-font-family-heading)' };
    case 5:
      return { fontSize: 'var(--cre-font-size-small)', fontWeight: 700, fontFamily: 'var(--cre-font-family-heading)' };
    case 6:
    default:
      return { fontSize: 'var(--cre-font-size-xsmall)', fontWeight: 700, fontFamily: 'var(--cre-font-family-heading)' };
  }
}

export function Heading({ level = 2, className, style, children, ...rest }: HeadingProps) {
  const tag = (`h${level}` as const) satisfies keyof JSX.IntrinsicElements;

  return (
    <Text
      as={tag}
      className={className}
      style={{
        margin: 0,
        color: 'var(--cre-color-text)',
        ...sizeForLevel(level),
        ...style,
      }}
      {...rest}
    >
      {children}
    </Text>
  );
}
Heading.displayName = 'Heading';
