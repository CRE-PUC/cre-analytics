import React from 'react';
import { injectStyles } from '../internal/injectStyles';
import { Box } from '../primitives/Box';

const CHECKBOX_CSS = `
[data-cre="checkboxRoot"] {
  display: inline-flex;
  align-items: center;
  gap: var(--cre-space-nano);
  cursor: pointer;
}

[data-cre="checkboxRoot"][data-disabled="true"] {
  cursor: not-allowed;
  opacity: var(--cre-opacity-opaque);
}

[data-cre="checkbox"] {
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: var(--cre-radius-xxsmall);
  border-width: var(--cre-border-width-small);
  border-style: solid;
  border-color: var(--cre-color-border-strong);
  background: var(--cre-color-surface);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin: 0;
}

[data-cre="checkbox"]:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--cre-color-focus);
}

[data-cre="checkbox"][data-checked="true"] {
  background: var(--cre-accent-bg);
  border-color: var(--cre-accent-border);
}

[data-cre="checkbox"][data-checked="true"]::after {
  content: '';
  width: 8px;
  height: 8px;
  background: var(--cre-accent-fg);
  border-radius: 2px;
}

[data-cre="checkbox"][disabled] {
  cursor: not-allowed;
}

[data-cre="checkboxLabel"] {
  color: var(--cre-color-text);
  font-family: var(--cre-font-family-body);
  font-size: var(--cre-font-size-tiny);
}

[data-cre="checkboxRoot"][data-disabled="true"] [data-cre="checkboxLabel"] {
  color: var(--cre-color-text-muted);
}
`;

injectStyles('cre-checkbox-styles', CHECKBOX_CSS);

export type CheckboxProps = {
  checked?: boolean;
  defaultChecked?: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
  label?: React.ReactNode;
  ariaLabel?: string;
  className?: string;
  style?: React.CSSProperties;
  id?: string;
  name?: string;
};

export function Checkbox({
  checked,
  defaultChecked,
  indeterminate,
  disabled,
  onChange,
  label,
  ariaLabel,
  className,
  style,
  id,
  name,
}: CheckboxProps) {
  const input = (
    <input
      data-cre="checkbox"
      type="checkbox"
      id={id}
      name={name}
      checked={checked}
      defaultChecked={defaultChecked}
      disabled={disabled}
      data-checked={checked ? 'true' : 'false'}
      aria-label={label == null ? ariaLabel : undefined}
      ref={(el) => {
        if (!el) return;
        el.indeterminate = Boolean(indeterminate) && !Boolean(checked);
      }}
      onChange={(e) => onChange?.(e.currentTarget.checked)}
    />
  );

  if (label == null) {
    return (
      <Box
        as="span"
        data-cre="checkboxRoot"
        data-disabled={disabled ? 'true' : 'false'}
        className={className}
        style={style}
      >
        {input}
      </Box>
    );
  }

  return (
    <Box
      as="label"
      data-cre="checkboxRoot"
      data-disabled={disabled ? 'true' : 'false'}
      className={className}
      style={style}
    >
      {input}
      <span data-cre="checkboxLabel">
        {label}
      </span>
    </Box>
  );
}
Checkbox.displayName = 'Checkbox';
