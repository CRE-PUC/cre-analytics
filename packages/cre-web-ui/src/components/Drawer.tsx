import React, { useEffect, useState } from 'react';
import { injectStyles } from '../internal/injectStyles';
import { Surface } from '../primitives/Surface';
import { Stack } from '../primitives/Stack';
import { Inline } from '../primitives/Inline';
import { Heading } from '../primitives/Heading';
import { Box } from '../primitives/Box';

const DRAWER_CSS = `
[data-cre="drawerOverlay"] {
  position: fixed;
  inset: 0;
  background: color-mix(in srgb, var(--cre-color-text) 40%, transparent);
  display: flex;
  justify-content: flex-end;
  padding: 0;
  z-index: 1000;

  opacity: 0;
  transition: opacity 180ms ease-in;
}

[data-cre="drawerOverlay"][data-state="open"] {
  opacity: 1;
  transition-timing-function: ease-out;
}

[data-cre="drawerOverlay"][data-side="left"] {
  justify-content: flex-start;
}

[data-cre="drawerPanel"] {
  width: min(420px, 100%);
  height: 100%;
  display: flex;
  flex-direction: column;

  transform: translateX(16px);
  opacity: 0;
  transition:
    transform 180ms ease-in,
    opacity 180ms ease-in;
}

[data-cre="drawerPanel"][data-state="open"] {
  transform: translateX(0);
  opacity: 1;
  transition-timing-function: ease-out;
}

[data-cre="drawerPanel"][data-side="left"] {
  transform: translateX(-16px);
}

[data-cre="drawerPanel"][data-side="left"][data-state="open"] {
  transform: translateX(0);
}

[data-cre="drawerPanel"][data-motion="pop"] {
  transform: scale(0.98);
}

[data-cre="drawerPanel"][data-motion="pop"][data-state="open"] {
  transform: scale(1);
}

[data-cre="drawerBody"] {
  overflow: auto;
  min-height: 0;
}

[data-cre="drawerPanel"] > [data-cre="surface"] {
  border-top: none;
  border-right: none;
  border-bottom: none;
}

[data-cre="drawerPanel"] > [data-cre="surface"] > [data-cre="stack"] {
  min-height: 0;
}
`;

injectStyles('cre-drawer-styles', DRAWER_CSS);

export type DrawerProps = {
  open: boolean;
  title?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  onClose: () => void;
  dismissible?: boolean;
  side?: 'right' | 'left';
  motion?: 'slide' | 'pop';
  className?: string;
};

export function Drawer({
  open,
  title,
  children,
  footer,
  onClose,
  dismissible = true,
  side = 'right',
  motion = 'slide',
  className,
}: DrawerProps) {
  const titleId = typeof title === 'string' ? 'cre-drawer-title' : undefined;

  const [mounted, setMounted] = useState(open);
  const [state, setState] = useState<'open' | 'closed'>(open ? 'open' : 'closed');

  useEffect(() => {
    if (open) {
      setMounted(true);
      setState('closed');
      const raf = window.requestAnimationFrame(() => setState('open'));
      return () => window.cancelAnimationFrame(raf);
    }

    if (!mounted) return;
    setState('closed');
    const t = window.setTimeout(() => setMounted(false), 180);
    return () => window.clearTimeout(t);
  }, [open, mounted]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && dismissible) onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose, dismissible]);

  if (!mounted) return null;

  return (
    <Box
      as="div"
      data-cre="drawerOverlay"
      data-state={state}
      data-side={side}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onMouseDown={(e) => {
        if (!dismissible) return;
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <Surface
        data-cre="drawerPanel"
        data-state={state}
        data-side={side}
        data-motion={motion}
        variant="raised"
        className={className}
        padding="micro"
        radius="none"
      >
        <Stack gap="micro">
          {title != null ? (
            <Inline align="center" justify="space-between">
              {typeof title === 'string' ? <Heading level={4} id={titleId}>{title}</Heading> : title}
            </Inline>
          ) : null}
          <Box as="div" data-cre="drawerBody">
            {children}
          </Box>
          {footer != null ? <Box as="div">{footer}</Box> : null}
        </Stack>
      </Surface>
    </Box>
  );
}
Drawer.displayName = 'Drawer';
