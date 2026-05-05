import React, { useEffect, useMemo, useRef, useState } from 'react';
import { injectStyles } from '../internal/injectStyles';
import { Button } from './Button';
import { Box } from '../primitives/Box';
import { Inline } from '../primitives/Inline';
import { Stack } from '../primitives/Stack';
import { Surface } from '../primitives/Surface';
import { Text } from '../primitives/Text';

const DATE_RANGE_FILTER_CSS = `
[data-cre="dateRangeFilterRoot"] {
  position: relative;
  display: inline-flex;
}

[data-cre="dateRangeFilterIcon"] {
  width: 20px;
  height: 20px;
  display: inline-flex;
}

[data-cre="dateRangeFilterPopover"] {
  position: absolute;
  top: calc(100% + var(--cre-space-nano));
  right: 0;
  z-index: 20;
  width: 320px;
  transform-origin: top right;
  transition:
    opacity 140ms ease,
    transform 140ms ease;
}

[data-cre="dateRangeFilterPopover"][data-state="closed"] {
  opacity: 0;
  transform: translateY(-4px) scale(0.98);
  pointer-events: none;
}

[data-cre="dateRangeFilterPopover"][data-state="open"] {
  opacity: 1;
  transform: translateY(0) scale(1);
}

[data-cre="dateRangeFilterHeader"] {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--cre-space-nano);
}

[data-cre="dateRangeFilterGrid"] {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: var(--cre-space-quark);
}

[data-cre="dateRangeFilterDow"] {
  font-family: var(--cre-font-family-body);
  font-size: var(--cre-font-size-micro);
  color: var(--cre-color-text-muted);
  text-align: center;
}

[data-cre="dateRangeFilterDay"] {
  appearance: none;
  border: var(--cre-border-width-small) solid transparent;
  background: transparent;
  color: var(--cre-color-text);
  border-radius: var(--cre-radius-xsmall);
  width: 100%;
  height: 36px;
  cursor: pointer;
  font-family: var(--cre-font-family-body);
  font-size: var(--cre-font-size-tiny);
  box-sizing: border-box;
}

[data-cre="dateRangeFilterDay"]:focus-visible {
  box-shadow: 0 0 0 3px var(--cre-color-focus);
  border-color: var(--cre-color-border-strong);
}

[data-cre="dateRangeFilterDay"][data-outside="true"] {
  color: var(--cre-color-text-subtle);
}

[data-cre="dateRangeFilterDay"][data-in-range="true"] {
  background: var(--cre-accent-hover-bg);
  color: var(--cre-accent-fg);
}

[data-cre="dateRangeFilterDay"][data-range-edge="true"] {
  background: var(--cre-accent-bg);
  border-color: var(--cre-accent-border);
  color: var(--cre-accent-fg);
}

[data-cre="dateRangeFilterFooter"] {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--cre-space-nano);
}
`;

injectStyles('cre-date-range-filter-styles', DATE_RANGE_FILTER_CSS);

export type DateRangeValue = {
  startMs: number | null;
  endMs: number | null;
};

export type CreDateRangeFilterTriggerVariant = 'field' | 'icon';

export type DateRangeFilterProps = {
  value?: DateRangeValue;
  defaultValue?: DateRangeValue;
  onChange?: (value: DateRangeValue) => void;
  disabled?: boolean;
  placeholder?: string;
  triggerVariant?: CreDateRangeFilterTriggerVariant;
  className?: string;
  style?: React.CSSProperties;
};

const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const;

function startOfDayMs(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function formatShortDate(ms: number): string {
  const d = new Date(ms);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function monthLabel(year: number, monthIndex: number): string {
  const d = new Date(year, monthIndex, 1);
  return d.toLocaleString(undefined, { month: 'long', year: 'numeric' });
}

type CalendarCell = {
  date: Date;
  outside: boolean;
  dayNumber: number;
  dayMs: number;
};

function buildMonthGrid(year: number, monthIndex: number): CalendarCell[] {
  const first = new Date(year, monthIndex, 1);
  const firstDow = first.getDay();
  const start = new Date(year, monthIndex, 1 - firstDow);
  const cells: CalendarCell[] = [];

  for (let i = 0; i < 42; i += 1) {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    cells.push({
      date,
      outside: date.getMonth() !== monthIndex,
      dayNumber: date.getDate(),
      dayMs: startOfDayMs(date),
    });
  }

  return cells;
}

function normalizeRange(value: DateRangeValue): DateRangeValue {
  const { startMs, endMs } = value;
  if (startMs == null || endMs == null) return { startMs, endMs };
  if (startMs <= endMs) return { startMs, endMs };
  return { startMs: endMs, endMs: startMs };
}

function CalendarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M7 2.8V5.2M17 2.8V5.2M4.5 8.2H19.5M6.5 5.2H17.5C18.6046 5.2 19.5 6.09543 19.5 7.2V19.2C19.5 20.3046 18.6046 21.2 17.5 21.2H6.5C5.39543 21.2 4.5 20.3046 4.5 19.2V7.2C4.5 6.09543 5.39543 5.2 6.5 5.2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M8 11.2H9.6M11.2 11.2H12.8M14.4 11.2H16M8 14.4H9.6M11.2 14.4H12.8M14.4 14.4H16M8 17.6H9.6M11.2 17.6H12.8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function DateRangeFilter({
  value,
  defaultValue = { startMs: null, endMs: null },
  onChange,
  disabled,
  placeholder = 'Date range',
  triggerVariant = 'field',
  className,
  style,
}: DateRangeFilterProps) {
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState<DateRangeValue>(defaultValue);
  const currentValue = normalizeRange(isControlled ? (value as DateRangeValue) : internalValue);

  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const today = useMemo(() => new Date(), []);
  const initialMonth = currentValue.startMs != null ? new Date(currentValue.startMs) : today;
  const [viewYear, setViewYear] = useState(initialMonth.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialMonth.getMonth());

  useEffect(() => {
    if (open) {
      setMounted(true);
      return;
    }

    if (!mounted) return;
    const t = window.setTimeout(() => setMounted(false), 140);
    return () => window.clearTimeout(t);
  }, [open, mounted]);

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

  const commit = (next: DateRangeValue) => {
    const normalized = normalizeRange(next);
    onChange?.(normalized);
    if (!isControlled) setInternalValue(normalized);
  };

  const grid = useMemo(() => buildMonthGrid(viewYear, viewMonth), [viewYear, viewMonth]);

  const inRange = (dayMs: number): boolean => {
    if (currentValue.startMs == null) return false;
    if (currentValue.endMs == null) return dayMs === currentValue.startMs;
    return dayMs >= currentValue.startMs && dayMs <= currentValue.endMs;
  };

  const isEdge = (dayMs: number): boolean => {
    if (currentValue.startMs == null) return false;
    if (currentValue.endMs == null) return dayMs === currentValue.startMs;
    return dayMs === currentValue.startMs || dayMs === currentValue.endMs;
  };

  const triggerLabel = useMemo(() => {
    const { startMs, endMs } = currentValue;
    if (startMs == null) return placeholder;
    if (endMs == null) return `${formatShortDate(startMs)} —`;
    return `${formatShortDate(startMs)} — ${formatShortDate(endMs)}`;
  }, [currentValue, placeholder]);

  return (
    <div data-cre="dateRangeFilterRoot" ref={rootRef} className={className} style={style}>
      {triggerVariant === 'icon' ? (
        <Button
          ref={triggerRef}
          variant="secondary"
          iconOnly
          leadingIcon={<span data-cre="dateRangeFilterIcon"><CalendarIcon /></span>}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-label={placeholder}
          disabled={disabled}
          onClick={() => { if (!disabled) setOpen((o) => !o); }}
        />
      ) : (
        <Button
          ref={triggerRef}
          variant="secondary"
          leadingIcon={<span data-cre="dateRangeFilterIcon"><CalendarIcon /></span>}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-label={placeholder}
          disabled={disabled}
          onClick={() => { if (!disabled) setOpen((o) => !o); }}
        >
          {triggerLabel}
        </Button>
      )}

      {mounted ? (
        <div
          data-cre="dateRangeFilterPopover"
          data-state={open ? 'open' : 'closed'}
          role="dialog"
          aria-modal="false"
        >
          <Surface variant="raised" padding="micro" radius="small">
            <Stack gap="nano">
              <Box as="div" data-cre="dateRangeFilterHeader">
                <Button
                  size="small"
                  variant="secondary"
                  iconOnly
                  leadingIcon={<Text as="span" variant="label">‹</Text>}
                  aria-label="Previous month"
                  onClick={() => {
                    const d = new Date(viewYear, viewMonth - 1, 1);
                    setViewYear(d.getFullYear());
                    setViewMonth(d.getMonth());
                  }}
                />

                <Text as="div" variant="label">
                  {monthLabel(viewYear, viewMonth)}
                </Text>

                <Button
                  size="small"
                  variant="secondary"
                  iconOnly
                  leadingIcon={<Text as="span" variant="label">›</Text>}
                  aria-label="Next month"
                  onClick={() => {
                    const d = new Date(viewYear, viewMonth + 1, 1);
                    setViewYear(d.getFullYear());
                    setViewMonth(d.getMonth());
                  }}
                />
              </Box>

              <Box as="div" data-cre="dateRangeFilterGrid">
                {DOW.map((d, i) => (
                  <Box key={i} as="div" data-cre="dateRangeFilterDow">
                    {d}
                  </Box>
                ))}

                {grid.map((cell) => (
                  <button
                    key={cell.dayMs}
                    type="button"
                    data-cre="dateRangeFilterDay"
                    data-outside={cell.outside ? 'true' : 'false'}
                    data-in-range={inRange(cell.dayMs) ? 'true' : 'false'}
                    data-range-edge={isEdge(cell.dayMs) ? 'true' : 'false'}
                    onClick={() => {
                      const clicked = cell.dayMs;
                      const { startMs, endMs } = currentValue;

                      if (startMs == null || (startMs != null && endMs != null)) {
                        commit({ startMs: clicked, endMs: null });
                        return;
                      }

                      commit({ startMs, endMs: clicked });
                    }}
                  >
                    {cell.dayNumber}
                  </button>
                ))}
              </Box>

              <Box as="div" data-cre="dateRangeFilterFooter">
                <Text as="div" tone="muted" variant="caption">
                  {currentValue.startMs != null && currentValue.endMs != null
                    ? `${formatShortDate(currentValue.startMs)} — ${formatShortDate(currentValue.endMs)}`
                    : currentValue.startMs != null
                      ? `${formatShortDate(currentValue.startMs)} —`
                      : 'Select start and end dates'}
                </Text>

                <Inline gap="quark" align="center">
                  <Button
                    size="small"
                    variant="secondary"
                    onClick={() => {
                      commit({ startMs: null, endMs: null });
                    }}
                  >
                    Clear
                  </Button>

                  <Button
                    size="small"
                    variant="secondary"
                    onClick={() => {
                      setOpen(false);
                      triggerRef.current?.focus();
                    }}
                  >
                    Done
                  </Button>
                </Inline>
              </Box>
            </Stack>
          </Surface>
        </div>
      ) : null}
    </div>
  );
}
DateRangeFilter.displayName = 'DateRangeFilter';
