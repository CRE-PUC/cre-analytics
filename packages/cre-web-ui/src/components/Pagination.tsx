import React from 'react';
import { injectStyles } from '../internal/injectStyles';
import { Box } from '../primitives/Box';
import { Inline } from '../primitives/Inline';
import { Text } from '../primitives/Text';
import { Button } from './Button';

const PAGINATION_CSS = `
[data-cre="pagination"] { display: contents; }
`;
injectStyles('cre-pagination-styles', PAGINATION_CSS);

export type PaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
  style?: React.CSSProperties;
};

export function Pagination({ page, totalPages, onPageChange, className, style }: PaginationProps) {
  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <Box as="div" data-cre="pagination" className={className} style={style}>
      <Inline gap="nano" align="center">
        <Button disabled={!canPrev} onClick={() => (canPrev ? onPageChange(page - 1) : null)}>
          Previous
        </Button>
        <Text as="span" tone="muted">
          Page {page} of {totalPages}
        </Text>
        <Button disabled={!canNext} onClick={() => (canNext ? onPageChange(page + 1) : null)}>
          Next
        </Button>
      </Inline>
    </Box>
  );
}
Pagination.displayName = 'Pagination';
