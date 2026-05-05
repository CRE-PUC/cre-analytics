export type CreRadius =
  | 'none'
  | 'xxsmall'
  | 'xsmall'
  | 'small'
  | 'medium'
  | 'large'
  | 'xlarge'
  | 'xxlarge'
  | 'xxxlarge'
  | 'huge'
  | 'giant'
  | 'titan'
  | 'pill';

export function radiusVar(value: CreRadius): string {
  return value === 'pill' ? '9999px' : `var(--cre-radius-${value})`;
}
