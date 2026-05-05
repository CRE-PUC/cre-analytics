import React from 'react';
import { injectStyles } from '../internal/injectStyles';
import { Box } from '../primitives/Box';
import { IconSlot } from '../primitives/IconSlot';

const INPUT_CSS = `
[data-cre="inputRoot"] {
  --cre-input-height: 40px;
  --cre-input-padding-x: var(--cre-space-nano);
  --cre-input-radius: var(--cre-radius-xsmall);

  display: inline-flex;
  align-items: center;
  gap: var(--cre-space-nano);
  height: var(--cre-input-height);
  padding: 0 var(--cre-input-padding-x);
  border-radius: var(--cre-input-radius);
  border-width: var(--cre-border-width-small);
  border-style: solid;
  border-color: var(--cre-color-border);
  background: var(--cre-color-surface);
  box-sizing: border-box;
}

[data-cre="inputRoot"][data-disabled="true"] {
  opacity: var(--cre-opacity-opaque);
}

[data-cre="input"] {
  flex: 1;
  min-width: 0;
  height: 100%;
  border: none;
  outline: none;
  background: transparent;
  color: var(--cre-color-text);
  font-family: var(--cre-font-family-body);
  font-size: var(--cre-font-size-tiny);
}

[data-cre="input"]::placeholder {
  color: var(--cre-color-text-subtle);
}

[data-cre="inputRoot"]:focus-within {
  box-shadow: 0 0 0 var(--cre-border-width-medium) var(--cre-color-focus);
  border-color: var(--cre-color-border-strong);
}

[data-cre="inputRoot"][data-error="true"] {
  border-color: var(--cre-feedback-error-border);
}

[data-cre="inputRoot"][data-error="true"]:focus-within {
  box-shadow: 0 0 0 var(--cre-border-width-medium) var(--cre-feedback-error-border);
  border-color: var(--cre-feedback-error-border);
}

[data-cre="inputPasswordToggle"] {
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  color: var(--cre-color-text-subtle);
  line-height: 0;
}

[data-cre="inputPasswordToggle"]:hover {
  color: var(--cre-color-text);
}

[data-cre="input"][disabled] {
  cursor: not-allowed;
}
`;

injectStyles('cre-input-styles', INPUT_CSS);

export type InputProps = {
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  disabled?: boolean;
  type?: 'text' | 'email' | 'password';
  hasError?: boolean;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  onChange?: (value: string) => void;
  id?: string;
  name?: string;
  autoComplete?: string;
  className?: string;
  style?: React.CSSProperties;
  inputProps?: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'defaultValue' | 'placeholder' | 'disabled' | 'onChange' | 'id' | 'name' | 'autoComplete' | 'type'>;
};

const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M1.5 9s2.7-5.25 7.5-5.25S16.5 9 16.5 9s-2.7 5.25-7.5 5.25S1.5 9 1.5 9Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <path
      d="M9 11.25a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z"
      stroke="currentColor"
      strokeWidth="1.5"
    />
  </svg>
);

const EyeOffIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2.25 2.25 15.75 15.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path
      d="M4.065 4.065C2.292 5.415 1.5 9 1.5 9s2.7 5.25 7.5 5.25c1.62 0 3.03-.6 4.185-1.425"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <path
      d="M7.29 7.29a2.25 2.25 0 0 0 3.42 3.42"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M14.196 12.696C15.69 11.187 16.5 9 16.5 9s-2.7-5.25-7.5-5.25c-1.287 0-2.43.27-3.42.69"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </svg>
);

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      value,
      defaultValue,
      placeholder,
      disabled,
      type = 'text',
      hasError,
      leading,
      trailing,
      onChange,
      id,
      name,
      autoComplete,
      className,
      style,
      inputProps,
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = React.useState(false);

    const resolvedType = type === 'password' && showPassword ? 'text' : type;

    const resolvedTrailing =
      type === 'password' && !trailing ? (
        <button
          type="button"
          data-cre="inputPasswordToggle"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          onClick={() => setShowPassword((v) => !v)}
          disabled={disabled}
        >
          {showPassword ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      ) : (
        trailing
      );

    return (
      <Box
        as="div"
        data-cre="inputRoot"
        data-disabled={disabled ? 'true' : 'false'}
        data-error={hasError ? 'true' : 'false'}
        className={className}
        style={style}
      >
        {leading ? <IconSlot>{leading}</IconSlot> : null}
        <input
          ref={ref}
          data-cre="input"
          id={id}
          name={name}
          autoComplete={autoComplete}
          value={value}
          defaultValue={defaultValue}
          placeholder={placeholder}
          disabled={disabled}
          type={resolvedType}
          onChange={(e) => onChange?.(e.target.value)}
          {...inputProps}
        />
        {resolvedTrailing ? <IconSlot>{resolvedTrailing}</IconSlot> : null}
      </Box>
    );
  }
);
Input.displayName = 'Input';
