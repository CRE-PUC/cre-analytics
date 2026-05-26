import React from 'react';
import { injectStyles } from '../internal/injectStyles';
import { Surface } from '../primitives/Surface';
import { Stack } from '../primitives/Stack';
import { Box } from '../primitives/Box';

const CARD_CSS = `
[data-cre="card"] {
  display: flex;
  flex-direction: column;
}
`;
injectStyles('cre-card-styles', CARD_CSS);

export type CardProps = {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  children?: React.ReactNode;
  variant?: React.ComponentProps<typeof Surface>['variant'];
  padding?: React.ComponentProps<typeof Surface>['padding'];
  className?: string;
  style?: React.CSSProperties;
};

export function Card({
  header,
  footer,
  children,
  variant = 'default',
  padding = 'micro',
  className,
  style,
}: CardProps) {
  const hasStructured = header != null || footer != null;

  return (
    <Box as="div" data-cre="card" className={className} style={style}>
      <Surface variant={variant} padding={padding}>
        {hasStructured ? (
          <Stack gap="micro">
            {header != null ? <Box as="div">{header}</Box> : null}
            <Box as="div">{children}</Box>
            {footer != null ? <Box as="div">{footer}</Box> : null}
          </Stack>
        ) : (
          children
        )}
      </Surface>
    </Box>
  );
}
Card.displayName = 'Card';
