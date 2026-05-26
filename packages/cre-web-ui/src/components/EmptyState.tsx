import React from 'react';
import { injectStyles } from '../internal/injectStyles';
import { Box } from '../primitives/Box';
import { Stack } from '../primitives/Stack';
import { Heading } from '../primitives/Heading';
import { Text } from '../primitives/Text';

const EMPTY_STATE_CSS = `
[data-cre="emptyState"] {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}
`;
injectStyles('cre-empty-state-styles', EMPTY_STATE_CSS);

export type EmptyStateProps = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

export function EmptyState({ title, description, actions, className, style }: EmptyStateProps) {
  return (
    <Box as="div" data-cre="emptyState" className={className} style={style}>
      <Stack gap="nano">
        <Heading level={4}>{title}</Heading>
        {description ? (
          <Text as="p" tone="muted">
            {description}
          </Text>
        ) : null}
        {actions ?? null}
      </Stack>
    </Box>
  );
}
EmptyState.displayName = 'EmptyState';
