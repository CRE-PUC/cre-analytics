import React from 'react';
import { injectStyles } from '../internal/injectStyles';
import { Box } from '../primitives/Box';

const BADGE_CSS = `
[data-cre="badge"] {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 var(--cre-space-nano);
  height: 20px;
  border-radius: var(--cre-radius-pill);
  border-width: var(--cre-border-width-small);
  border-style: solid;
  font-family: var(--cre-font-family-body);
  font-size: var(--cre-font-size-pico);
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
  box-sizing: border-box;
}

[data-cre="badge"][data-variant="neutral"] {
  background: var(--cre-color-bg);
  color: var(--cre-color-text-muted);
  border-color: var(--cre-color-border);
}

[data-cre="badge"][data-variant="success"] {
  background: var(--cre-feedback-success-bg);
  color: var(--cre-feedback-success-text);
  border-color: var(--cre-feedback-success-border);
}

[data-cre="badge"][data-variant="warning"] {
  background: var(--cre-feedback-alert-bg);
  color: var(--cre-feedback-alert-text);
  border-color: var(--cre-feedback-alert-border);
}

[data-cre="badge"][data-variant="error"] {
  background: var(--cre-feedback-error-bg);
  color: var(--cre-feedback-error-text);
  border-color: var(--cre-feedback-error-border);
}

[data-cre="badge"][data-variant="accent"] {
  background: var(--cre-accent-bg);
  color: var(--cre-accent-fg);
  border-color: var(--cre-accent-border);
}
`;

injectStyles('cre-badge-styles', BADGE_CSS);

export type CreBadgeVariant = 'neutral' | 'success' | 'warning' | 'error' | 'accent';

export type BadgeProps = {
  variant?: CreBadgeVariant;
  children?: React.ReactNode;
  className?: string;
};

export function Badge({ variant = 'neutral', children, className }: BadgeProps) {
  return (
    <Box as="span" data-cre="badge" data-variant={variant} className={className}>
      {children}
    </Box>
  );
}
Badge.displayName = 'Badge';
