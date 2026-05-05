import React from 'react';
import { injectStyles } from '../internal/injectStyles';
import { Stack } from '../primitives/Stack';
import { Text } from '../primitives/Text';

const FIELD_CSS = `
[data-cre="field-required-star"] { color: var(--cre-feedback-error-text); }
[data-cre="field-error"] { color: var(--cre-feedback-error-text); }
`;

injectStyles('cre-field-styles', FIELD_CSS);

export type FieldProps = {
  label: string;
  description?: string;
  error?: string;
  children?: React.ReactNode;
  htmlFor?: string;
  required?: boolean;
  className?: string;
  style?: React.CSSProperties;
};

export function Field({
  label,
  description,
  error,
  children,
  htmlFor,
  required,
  className,
  style,
}: FieldProps) {
  return (
    <div data-cre="field" className={className} style={style}>
      <Stack gap="quark">
        <Text as="label" variant="label" htmlFor={htmlFor}>
          {label}
          {required ? <span data-cre="field-required-star"> *</span> : null}
        </Text>
        {description ? (
          <Text as="p" variant="caption" tone="muted">
            {description}
          </Text>
        ) : null}
        {children}
        {error ? (
          <Text as="p" variant="caption" data-cre="field-error">
            {error}
          </Text>
        ) : null}
      </Stack>
    </div>
  );
}
Field.displayName = 'Field';
