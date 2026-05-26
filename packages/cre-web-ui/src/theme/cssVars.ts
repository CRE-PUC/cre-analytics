/**
 * cssVars.ts
 *
 * Generates CSS custom property maps from the design token objects.
 *
 * Two separate functions — combine them in the theme provider:
 *
 *   coreTokensToCssVars()         — mode-independent: spacing, radius, typography, opacity
 *   themeTokensToCssVars(tokens)  — mode-specific:    semantic colors, component tokens
 *
 * Naming conventions:
 *   --cre-space-{name}            e.g. --cre-space-micro = 16px
 *   --cre-radius-{name}           e.g. --cre-radius-small = 12px
 *   --cre-border-width-{name}     e.g. --cre-border-width-small = 1px
 *   --cre-opacity-{name}          e.g. --cre-opacity-medium = 0.32
 *   --cre-font-family-{name}      e.g. --cre-font-family-button = Poppins
 *   --cre-color-{semantic}        e.g. --cre-color-bg, --cre-color-text
 *   --cre-feedback-{type}-{role}  e.g. --cre-feedback-error-text
 *   --cre-button-{state-property} e.g. --cre-button-bg, --cre-button-hover-bg
 */

import { coreTokens } from './rawTokens';
import type { CreThemeTokens } from './tokens';

export type CreCssVars = Record<string, string>;

// ─── Core vars (mode-independent) ────────────────────────────────────────────

/**
 * Returns CSS vars for all core tokens.
 * These are applied once and never change between light/dark switches.
 */
export function coreTokensToCssVars(): CreCssVars {
  const { space, radius, borderWidth, opacity, fontFamily, fontSize, layout } = coreTokens;

  return {
    // Spacing
    '--cre-space-none':     `${space.none}px`,
    '--cre-space-quark':    `${space.quark}px`,
    '--cre-space-nano':     `${space.nano}px`,
    '--cre-space-pico':     `${space.pico}px`,
    '--cre-space-micro':    `${space.micro}px`,
    '--cre-space-tiny':     `${space.tiny}px`,
    '--cre-space-xxxsmall': `${space.xxxsmall}px`,
    '--cre-space-xxsmall':  `${space.xxsmall}px`,
    '--cre-space-xsmall':   `${space.xsmall}px`,
    '--cre-space-small':    `${space.small}px`,
    '--cre-space-medium':   `${space.medium}px`,
    '--cre-space-large':    `${space.large}px`,
    '--cre-space-xlarge':   `${space.xlarge}px`,
    '--cre-space-xxlarge':  `${space.xxlarge}px`,
    '--cre-space-xxxlarge': `${space.xxxlarge}px`,
    '--cre-space-huge':     `${space.huge}px`,
    '--cre-space-giant':    `${space.giant}px`,
    '--cre-space-titan':    `${space.titan}px`,

    // Border radius (pill capped at 9999px for CSS compatibility)
    '--cre-radius-none':     `${radius.none}px`,
    '--cre-radius-xxsmall':  `${radius.xxsmall}px`,
    '--cre-radius-xsmall':   `${radius.xsmall}px`,
    '--cre-radius-small':    `${radius.small}px`,
    '--cre-radius-medium':   `${radius.medium}px`,
    '--cre-radius-large':    `${radius.large}px`,
    '--cre-radius-xlarge':   `${radius.xlarge}px`,
    '--cre-radius-xxlarge':  `${radius.xxlarge}px`,
    '--cre-radius-xxxlarge': `${radius.xxxlarge}px`,
    '--cre-radius-huge':     `${radius.huge}px`,
    '--cre-radius-giant':    `${radius.giant}px`,
    '--cre-radius-titan':    `${radius.titan}px`,
    '--cre-radius-pill':     '9999px',

    // Border width
    '--cre-border-width-small':    `${borderWidth.small}px`,
    '--cre-border-width-medium':   `${borderWidth.medium}px`,
    '--cre-border-width-large':    `${borderWidth.large}px`,
    '--cre-border-width-xlarge':   `${borderWidth.xlarge}px`,
    '--cre-border-width-xxlarge':  `${borderWidth.xxlarge}px`,
    '--cre-border-width-xxxlarge': `${borderWidth.xxxlarge}px`,

    // Opacity (0-1 decimals, suitable for CSS `opacity` property or alpha channels)
    '--cre-opacity-extralight': String(opacity.extralight),
    '--cre-opacity-light':      String(opacity.light),
    '--cre-opacity-medium':     String(opacity.medium),
    '--cre-opacity-intense':    String(opacity.intense),
    '--cre-opacity-opaque':     String(opacity.opaque),

    // Font family
    '--cre-font-family-heading':  fontFamily.heading,
    '--cre-font-family-subtitle': fontFamily.subtitle,
    '--cre-font-family-body':     fontFamily.body,
    '--cre-font-family-button':   fontFamily.button,
    '--cre-font-family-caption':  fontFamily.caption,
    '--cre-font-family-overline': fontFamily.overline,

    // Font size
    '--cre-font-size-quark':    `${fontSize.quark}px`,
    '--cre-font-size-nano':     `${fontSize.nano}px`,
    '--cre-font-size-pico':     `${fontSize.pico}px`,
    '--cre-font-size-micro':    `${fontSize.micro}px`,
    '--cre-font-size-tiny':     `${fontSize.tiny}px`,
    '--cre-font-size-xxxsmall': `${fontSize.xxxsmall}px`,
    '--cre-font-size-xxsmall':  `${fontSize.xxsmall}px`,
    '--cre-font-size-xsmall':   `${fontSize.xsmall}px`,
    '--cre-font-size-small':    `${fontSize.small}px`,
    '--cre-font-size-medium':   `${fontSize.medium}px`,
    '--cre-font-size-large':    `${fontSize.large}px`,
    '--cre-font-size-xlarge':   `${fontSize.xlarge}px`,
    '--cre-font-size-xxlarge':  `${fontSize.xxlarge}px`,
    '--cre-font-size-xxxlarge': `${fontSize.xxxlarge}px`,
    '--cre-font-size-huge':     `${fontSize.huge}px`,

    // Layout widths
    '--cre-layout-main': `${layout.mainW}px`,
    '--cre-layout-seco': `${layout.secoW}px`,
    '--cre-layout-focu': `${layout.focuW}px`,
    '--cre-layout-read': `${layout.readW}px`,
    '--cre-layout-full': `${layout.fullW}px`,

    // ── Button structural tokens ──────────────────────────────────────────────
    // These alias core tokens so the Button component never references raw
    // scale vars directly. Override at this level to resize/reshape the button.
    '--cre-button-padding-y':    'var(--cre-space-micro)',   // 16px
    '--cre-button-padding-x':    'var(--cre-space-tiny)',    // 20px
    '--cre-button-gap':          'var(--cre-space-pico)',    // 12px
    '--cre-button-radius':       'var(--cre-radius-small)',  // 12px
    '--cre-button-icon-size':    '24px',
    '--cre-button-icon-padding': '3px',
    // Typography — 24px / 400 / 32px line-height per design spec.
    // TODO: alias to a core font-size token once the full scale is mapped.
    '--cre-button-font-size':    '24px',
    '--cre-button-font-weight':  '400',
    '--cre-button-line-height':  '32px',
  };
}

// ─── Mode-specific vars (switches on theme mode change) ──────────────────────

/**
 * Returns CSS vars for all mode-specific (color) tokens.
 * Call this whenever the theme mode changes.
 */
export function themeTokensToCssVars(tokens: CreThemeTokens): CreCssVars {
  const { mode, semantic, feedback, components: { button } } = tokens;

  return {
    '--cre-mode': mode,

    // ── Semantic surface / content / border ──
    '--cre-color-bg':            semantic.bg,
    '--cre-color-surface':       semantic.surface,
    '--cre-color-surface-raised': semantic.surfaceRaised,
    '--cre-color-text':          semantic.text,
    '--cre-color-text-muted':    semantic.textMuted,
    '--cre-color-text-subtle':   semantic.textSubtle,
    '--cre-color-border':        semantic.border,
    '--cre-color-border-strong': semantic.borderStrong,
    '--cre-color-focus':         semantic.focusRing,

    // ── Semantic accent/action ──
    '--cre-accent-bg':            semantic.accentBg,
    '--cre-accent-fg':            semantic.accentFg,
    '--cre-accent-border':        semantic.accentBorder,
    '--cre-accent-hover-bg':      semantic.accentHoverBg,
    '--cre-accent-hover-border':  semantic.accentHoverBorder,
    '--cre-accent-active-bg':     semantic.accentActiveBg,
    '--cre-accent-active-border': semantic.accentActiveBorder,
    '--cre-accent-disabled-bg':     semantic.accentDisabledBg,
    '--cre-accent-disabled-fg':     semantic.accentDisabledFg,
    '--cre-accent-disabled-border': semantic.accentDisabledBorder,

    // ── Feedback / status ──
    '--cre-feedback-success-bg':     feedback.success.bg,
    '--cre-feedback-success-text':   feedback.success.text,
    '--cre-feedback-success-border': feedback.success.border,

    '--cre-feedback-alert-bg':     feedback.alert.bg,
    '--cre-feedback-alert-text':   feedback.alert.text,
    '--cre-feedback-alert-border': feedback.alert.border,

    '--cre-feedback-error-bg':     feedback.error.bg,
    '--cre-feedback-error-text':   feedback.error.text,
    '--cre-feedback-error-border': feedback.error.border,

    // ── Button component ──
    '--cre-button-bg':     button.bg,
    '--cre-button-fg':     button.fg,
    '--cre-button-border': button.border,

    '--cre-button-hover-bg':     button.hoverBg,
    '--cre-button-hover-fg':     button.hoverFg,
    '--cre-button-hover-border': button.hoverBorder,

    '--cre-button-active-bg':     button.activeBg,
    '--cre-button-active-fg':     button.activeFg,
    '--cre-button-active-border': button.activeBorder,

    '--cre-button-disabled-bg':     button.disabledBg,
    '--cre-button-disabled-fg':     button.disabledFg,
    '--cre-button-disabled-border': button.disabledBorder,

    '--cre-button-secondary-bg':     button.secondaryBg,
    '--cre-button-secondary-fg':     button.secondaryFg,
    '--cre-button-secondary-border': button.secondaryBorder,

    '--cre-button-secondary-hover-bg':     button.secondaryHoverBg,
    '--cre-button-secondary-hover-fg':     button.secondaryHoverFg,
    '--cre-button-secondary-hover-border': button.secondaryHoverBorder,

    '--cre-button-secondary-active-bg':     button.secondaryActiveBg,
    '--cre-button-secondary-active-fg':     button.secondaryActiveFg,
    '--cre-button-secondary-active-border': button.secondaryActiveBorder,

    '--cre-button-secondary-disabled-bg':     button.secondaryDisabledBg,
    '--cre-button-secondary-disabled-fg':     button.secondaryDisabledFg,
    '--cre-button-secondary-disabled-border': button.secondaryDisabledBorder,
  };
}
