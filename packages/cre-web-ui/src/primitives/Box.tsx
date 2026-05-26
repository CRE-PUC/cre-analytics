import React from 'react';

export type BoxProps<T extends React.ElementType = 'div'> = {
  as?: T;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
} & Omit<React.ComponentPropsWithoutRef<T>, 'as' | 'className' | 'style' | 'children'>;

export const Box = React.forwardRef<HTMLDivElement, BoxProps<'div'>>(function Box(props, ref) {
  const { as, className, style, children, ...rest } = props;
  const Component = (as ?? 'div') as React.ElementType;

  return (
    <Component ref={ref} className={className} style={style} {...rest}>
      {children}
    </Component>
  );
}) as <T extends React.ElementType = 'div'>(props: BoxProps<T> & { ref?: React.ForwardedRef<HTMLDivElement> }) => React.ReactElement;

(Box as any).displayName = 'Box';
