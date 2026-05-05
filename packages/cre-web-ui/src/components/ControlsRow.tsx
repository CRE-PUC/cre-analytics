import React from 'react';
import { injectStyles } from '../internal/injectStyles';
import { Box } from '../primitives/Box';
import { Inline } from '../primitives/Inline';

const CONTROLS_ROW_CSS = `
[data-cre="controlsRow"] {
  width: 100%;
}
`;
injectStyles('cre-controls-row-styles', CONTROLS_ROW_CSS);

export type ControlsRowProps = {
  left?: React.ReactNode;
  right?: React.ReactNode;
  gap?: React.ComponentProps<typeof Inline>['gap'];
  wrap?: boolean;
  className?: string;
  style?: React.CSSProperties;
};

export function ControlsRow({ left, right, gap = 'micro', wrap = true, className, style }: ControlsRowProps) {
  return (
    <Box as="div" data-cre="controlsRow" className={className} style={style}>
      <Inline gap={gap} wrap={wrap} align="center" justify="space-between">
        <Inline gap="nano" wrap={wrap} align="center">
          {left}
        </Inline>
        <Inline gap="nano" wrap={wrap} align="center">
          {right}
        </Inline>
      </Inline>
    </Box>
  );
}
ControlsRow.displayName = 'ControlsRow';
