import React, { useEffect } from 'react';
import { injectStyles } from '../internal/injectStyles';
import { Surface } from '../primitives/Surface';
import { Stack } from '../primitives/Stack';
import { Inline } from '../primitives/Inline';
import { Heading } from '../primitives/Heading';
import { Box } from '../primitives/Box';

const MODAL_CSS = `
[data-cre="modalOverlay"] {
  position: fixed;
  inset: 0;
  background: color-mix(in srgb, var(--cre-color-text) 40%, transparent);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--cre-space-micro);
  z-index: 1000;
}

[data-cre="modalPanel"] {
  width: min(640px, 100%);
  max-height: min(80vh, 900px);
  display: flex;
  flex-direction: column;
}

[data-cre="modalBody"] {
  overflow: auto;
  min-height: 0;
}

[data-cre="modalPanel"] > [data-cre="surface"] > [data-cre="stack"] {
  min-height: 0;
}
`;

injectStyles('cre-modal-styles', MODAL_CSS);

export type ModalProps = {
  open: boolean;
  title?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  onClose: () => void;
  dismissible?: boolean;
  className?: string;
};

export function Modal({ open, title, children, footer, onClose, dismissible = true, className }: ModalProps) {
  const titleId = typeof title === 'string' ? 'cre-modal-title' : undefined;

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && dismissible) onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose, dismissible]);

  if (!open) return null;

  return (
    <Box
      as="div"
      data-cre="modalOverlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onMouseDown={(e) => {
        if (!dismissible) return;
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <Surface data-cre="modalPanel" variant="raised" className={className} padding="micro" radius="small">
        <Stack gap="micro">
          {title != null ? (
            <Inline align="center" justify="space-between">
              {typeof title === 'string' ? <Heading level={4} id={titleId}>{title}</Heading> : title}
            </Inline>
          ) : null}
          <Box as="div" data-cre="modalBody">
            {children}
          </Box>
          {footer != null ? <Box as="div">{footer}</Box> : null}
        </Stack>
      </Surface>
    </Box>
  );
}
Modal.displayName = 'Modal';
