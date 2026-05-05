import React, { useEffect, useMemo, useRef, useState } from 'react';
import { injectStyles } from '../internal/injectStyles';
import { Box } from '../primitives/Box';

const SELECT_CSS = `
[data-cre="selectRoot"] {
  position: relative;
  display: inline-flex;
  width: fit-content;
}

[data-cre="selectTrigger"] {
  --cre-select-radius: var(--cre-radius-xsmall);
  --cre-select-height: 40px;
  --cre-select-padding-x: var(--cre-space-nano);

  height: var(--cre-select-height);
  padding: 0 var(--cre-select-padding-x);
  border-radius: var(--cre-select-radius);
  border-width: var(--cre-border-width-small);
  border-style: solid;
  border-color: var(--cre-color-border);
  background: var(--cre-color-surface);
  color: var(--cre-color-text);
  font-family: var(--cre-font-family-body);
  font-size: var(--cre-font-size-tiny);
  outline: none;
  box-sizing: border-box;

  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--cre-space-quark);
  min-width: 160px;
  cursor: pointer;
  user-select: none;
}

[data-cre="selectTrigger"][data-open="true"] {
  border-color: var(--cre-color-border-strong);
  box-shadow: 0 0 0 3px var(--cre-color-focus);
}

[data-cre="selectTrigger"]:focus-visible {
  box-shadow: 0 0 0 3px var(--cre-color-focus);
  border-color: var(--cre-color-border-strong);
}

[data-cre="selectTrigger"][disabled] {
  cursor: not-allowed;
  opacity: var(--cre-opacity-opaque);
}

[data-cre="selectValue"][data-placeholder="true"] {
  color: var(--cre-color-text-subtle);
}

[data-cre="selectChevron"] {
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 6px solid var(--cre-color-text-muted);
  flex-shrink: 0;
  transition: transform 140ms ease;
}

[data-cre="selectTrigger"][data-open="true"] [data-cre="selectChevron"] {
  transform: rotate(180deg);
}

[data-cre="selectMenu"] {
  --cre-select-radius: var(--cre-radius-xsmall);
  position: absolute;
  left: 0;
  top: calc(100% + var(--cre-space-nano));
  width: 100%;
  max-height: 240px;
  overflow: auto;
  background: var(--cre-color-surface-raised);
  border: var(--cre-border-width-small) solid var(--cre-color-border);
  border-radius: var(--cre-select-radius);
  box-sizing: border-box;
  z-index: 10;

  transform-origin: top;
  transition:
    opacity 140ms ease,
    transform 140ms ease;
}

[data-cre="selectMenu"][data-state="open"] {
  border-color: var(--cre-color-border-strong);
}

[data-cre="selectMenu"][data-state="closed"] {
  opacity: 0;
  transform: translateY(-4px) scaleY(0.98);
  pointer-events: none;
}

[data-cre="selectMenu"][data-state="open"] {
  opacity: 1;
  transform: translateY(0) scaleY(1);
}

[data-cre="selectOption"] {
  padding: var(--cre-space-nano) var(--cre-select-padding-x);
  cursor: pointer;
  font-family: var(--cre-font-family-body);
  font-size: var(--cre-font-size-tiny);
  color: var(--cre-color-text);
  background: transparent;
  border: none;
  text-align: left;
  width: 100%;
  box-sizing: border-box;
}

[data-cre="selectOption"][data-highlighted="true"] {
  background: var(--cre-accent-hover-bg);
  color: var(--cre-accent-fg);
}

[data-cre="selectOption"][data-selected="true"] {
  background: var(--cre-accent-bg);
  color: var(--cre-accent-fg);
}

[data-cre="selectOption"][data-disabled="true"] {
  cursor: not-allowed;
  color: var(--cre-color-text-subtle);
  opacity: var(--cre-opacity-opaque);
}
`;

injectStyles('cre-select-styles', SELECT_CSS);

export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export type SelectProps = {
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  disabled?: boolean;
  onChange?: (value: string) => void;
  id?: string;
  name?: string;
  className?: string;
  style?: React.CSSProperties;
};

export function Select({
  options,
  value,
  defaultValue,
  placeholder,
  disabled,
  onChange,
  id,
  name,
  className,
  style,
}: SelectProps) {
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState<string>(defaultValue ?? '');
  const currentValue = isControlled ? (value ?? '') : internalValue;

  const [open, setOpen] = useState(false);
  const [menuMounted, setMenuMounted] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const selected = useMemo(
    () => options.find((o) => o.value === currentValue) ?? null,
    [options, currentValue]
  );

  const displayLabel = selected?.label ?? placeholder ?? '';
  const isPlaceholder = selected == null;

  useEffect(() => {
    if (open) {
      setMenuMounted(true);
      return;
    }

    if (!menuMounted) return;
    const t = window.setTimeout(() => setMenuMounted(false), 140);
    return () => window.clearTimeout(t);
  }, [open, menuMounted]);

  useEffect(() => {
    if (!open) return;

    function onMouseDown(e: MouseEvent) {
      const root = rootRef.current;
      if (!root) return;
      if (e.target instanceof Node && root.contains(e.target)) return;
      setOpen(false);
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }

    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const idx = Math.max(
      0,
      options.findIndex((o) => o.value === currentValue && !o.disabled)
    );
    setHighlightedIndex(idx);
  }, [open, options, currentValue]);

  const commit = (next: string) => {
    onChange?.(next);
    if (!isControlled) setInternalValue(next);
  };

  return (
    <Box
      as="div"
      data-cre="selectRoot"
      ref={rootRef}
      id={id}
      className={className}
      style={style}
    >
      {name ? <input type="hidden" name={name} value={currentValue} /> : null}

      <button
        ref={triggerRef}
        type="button"
        data-cre="selectTrigger"
        data-open={open ? 'true' : 'false'}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => {
          if (disabled) return;
          setOpen((o) => !o);
        }}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setOpen(true);
            return;
          }
        }}
      >
        <span data-cre="selectValue" data-placeholder={isPlaceholder ? 'true' : 'false'}>
          {displayLabel}
        </span>
        <span data-cre="selectChevron" aria-hidden="true" />
      </button>

      {menuMounted ? (
        <Box
          as="div"
          data-cre="selectMenu"
          data-state={open ? 'open' : 'closed'}
          role="listbox"
          aria-label={typeof placeholder === 'string' ? placeholder : undefined}
          tabIndex={-1}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setHighlightedIndex((i) => {
                const next = Math.min(options.length - 1, i + 1);
                return next;
              });
              return;
            }
            if (e.key === 'ArrowUp') {
              e.preventDefault();
              setHighlightedIndex((i) => Math.max(0, i - 1));
              return;
            }
            if (e.key === 'Enter') {
              e.preventDefault();
              const opt = options[highlightedIndex];
              if (!opt || opt.disabled) return;
              commit(opt.value);
              setOpen(false);
              triggerRef.current?.focus();
              return;
            }
          }}
        >
          {options.map((opt, idx) => {
            const isSelected = opt.value === currentValue;
            const isHighlighted = idx === highlightedIndex;
            return (
              <button
                key={opt.value}
                type="button"
                data-cre="selectOption"
                data-selected={isSelected ? 'true' : 'false'}
                data-highlighted={isHighlighted ? 'true' : 'false'}
                data-disabled={opt.disabled ? 'true' : 'false'}
                disabled={opt.disabled}
                onMouseEnter={() => setHighlightedIndex(idx)}
                onClick={() => {
                  if (opt.disabled) return;
                  commit(opt.value);
                  setOpen(false);
                  triggerRef.current?.focus();
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </Box>
      ) : null}
    </Box>
  );
}
Select.displayName = 'Select';
