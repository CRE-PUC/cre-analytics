'use client';

import { Stack, Heading, Text } from '@cre/web-ui';

export default function Home() {
  return (
    <Stack gap="medium" style={{ padding: 'var(--cre-space-large)' }}>
      <Heading level={1}>CRE Analytics</Heading>
      <Text variant="body" tone="muted">Backoffice dashboard — coming soon.</Text>
    </Stack>
  );
}
