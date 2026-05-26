export type CreSpace =
  | 'none'
  | 'quark'
  | 'nano'
  | 'pico'
  | 'micro'
  | 'tiny'
  | 'xxxsmall'
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
  | 'titan';

export function spaceVar(value: CreSpace): string {
  return `var(--cre-space-${value})`;
}
