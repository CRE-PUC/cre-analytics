/**
 * rawTokens.ts
 *
 * Single source of truth for the Figma design token JSON files.
 * Only this file knows the shape of those JSONs — everything else
 * in the theme system consumes the typed, normalized values exported here.
 *
 * Token files:
 *   Core.tokens.json   — mode-independent: spacing, radius, typography, opacity
 *   Light.tokens.json  — light-mode color palette + effects
 *   Dark.tokens.json   — dark-mode color palette + effects
 */

import coreJson from '../DsTokens/Core.tokens.json';
import lightJson from '../DsTokens/Light.tokens.json';
import darkJson from '../DsTokens/Dark.tokens.json';

// ─── Extraction helpers ───────────────────────────────────────────────────────

/** Extract a number $value from a Figma token node. */
function n(token: { $value: number }): number {
  return token.$value;
}

/** Extract a string $value from a Figma token node. */
function s(token: { $value: string }): string {
  return token.$value;
}

/**
 * Extract a color as a CSS hex or rgba string from a Figma color token.
 * Handles the alpha channel when it is less than 1.
 */
function c(token: { $value: { hex: string; alpha: number } }): string {
  const { hex, alpha } = token.$value;
  if (alpha === 1) return hex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha.toFixed(2)})`;
}

// ─── Core tokens (mode-independent) ──────────────────────────────────────────

const _sp = coreJson['spacing & padding'];
const _br = coreJson['border']['radius'];
const _bw = coreJson['border']['width'];
const _op = coreJson['opacity'];
const _ff = coreJson['typography']['font-family'];
const _fs = coreJson['typography']['font-size'];
const _layout = coreJson['layout'];

/**
 * Foundational tokens that do not change between light and dark mode.
 * These drive spacing, shape, typography, and opacity CSS custom properties.
 */
export const coreTokens = {
  /**
   * Spacing & padding scale (pixel values).
   * Maps to CSS vars: --cre-space-{name}
   */
  space: {
    none:     n(_sp['none']),     // 0
    quark:    n(_sp['quark']),    // 4
    nano:     n(_sp['nano']),     // 8
    pico:     n(_sp['pico']),     // 12
    micro:    n(_sp['micro']),    // 16
    tiny:     n(_sp['tiny']),     // 20
    xxxsmall: n(_sp['xxxsmall']), // 24
    xxsmall:  n(_sp['xxsmall']),  // 28
    xsmall:   n(_sp['xsmall']),   // 32
    small:    n(_sp['small']),    // 36
    medium:   n(_sp['medium']),   // 40
    large:    n(_sp['large']),    // 48
    xlarge:   n(_sp['xlarge']),   // 56
    xxlarge:  n(_sp['xxlarge']),  // 64
    xxxlarge: n(_sp['xxxlarge']), // 80
    huge:     n(_sp['huge']),     // 120
    giant:    n(_sp['giant']),    // 160
    titan:    n(_sp['titan']),    // 200
  },

  /**
   * Border-radius scale (pixel values).
   * Maps to CSS vars: --cre-radius-{name}
   */
  radius: {
    none:     n(_br['null']),         // 0
    xxsmall:  n(_br['xxsmall']),      // 4
    xsmall:   n(_br['xsmall']),       // 8
    small:    n(_br['small']),        // 12  ← default button radius
    medium:   n(_br['medium']),       // 16
    large:    n(_br['large']),        // 20
    xlarge:   n(_br['xlarge']),       // 24
    xxlarge:  n(_br['xxlarge']),      // 28
    xxxlarge: n(_br['xxxlarge']),     // 32
    huge:     n(_br['huge']),         // 36
    giant:    n(_br['giant']),        // 40
    titan:    n(_br['titan']),        // 48
    pill:     n(_br['full or pill']), // 80000 (use 9999px in CSS)
  },

  /**
   * Border-width scale (pixel values).
   * Maps to CSS vars: --cre-border-width-{name}
   */
  borderWidth: {
    small:    n(_bw['small']),    // 1
    medium:   n(_bw['medium']),   // 2
    large:    n(_bw['large']),    // 3
    xlarge:   n(_bw['xlarge']),   // 4
    xxlarge:  n(_bw['xxlarge']),  // 6
    xxxlarge: n(_bw['xxxlarge']), // 8
  },

  /**
   * Opacity scale.
   * Stored as 0-100 % in Figma; exported here as 0-1 decimals for direct CSS use.
   * Maps to CSS vars: --cre-opacity-{name}
   */
  opacity: {
    extralight: n(_op['extralight']) / 100, // 0.08
    light:      n(_op['light'])      / 100, // 0.16
    medium:     n(_op['medium'])     / 100, // 0.32
    intense:    n(_op['intense'])    / 100, // 0.64
    opaque:     n(_op['opaque'])     / 100, // 0.72
  },

  /**
   * Font-family definitions from the typography system.
   * Maps to CSS vars: --cre-font-family-{name}
   *
   * heading / subtitle / button → Poppins
   * body / caption / overline   → Source Sans Pro
   */
  fontFamily: {
    heading:  s(_ff['heading']),  // Poppins
    subtitle: s(_ff['subtitle']), // Poppins
    body:     s(_ff['body']),     // Source Sans Pro
    button:   s(_ff['button']),   // Poppins
    caption:  s(_ff['caption']),  // Source Sans Pro
    overline: s(_ff['overline']), // Source Sans Pro
  },

  /**
   * Font-size scale (pixel values).
   * Maps to CSS vars: --cre-font-size-{name}
   */
  fontSize: {
    quark:    n(_fs['quark']),
    nano:     n(_fs['nano']),
    pico:     n(_fs['pico']),
    micro:    n(_fs['micro']),
    tiny:     n(_fs['tiny']),
    xxxsmall: n(_fs['xxxsmall']),
    xxsmall:  n(_fs['xxsmall']),
    xsmall:   n(_fs['xsmall']),
    small:    n(_fs['small']),
    medium:   n(_fs['medium']),
    large:    n(_fs['large']),
    xlarge:   n(_fs['xlarge']),
    xxlarge:  n(_fs['xxlarge']),
    xxxlarge: n(_fs['xxxlarge']),
    huge:     n(_fs['huge']),
  },

  /**
   * Common layout widths (pixel values).
   * Maps to CSS vars: --cre-layout-{name}
   */
  layout: {
    mainW: n(_layout['main_w']),
    secoW: n(_layout['seco_w']),
    focuW: n(_layout['focu_w']),
    readW: n(_layout['read_w']),
    fullW: n(_layout['full_w']),
  },
} as const;

export type CoreTokens = typeof coreTokens;

// ─── Color tokens (mode-specific) ────────────────────────────────────────────

/**
 * Builds a strongly-typed color token object from a Light or Dark token JSON.
 *
 * Palette design notes:
 *   primary   — Light: warm pinks/reds (#F2E3E3 → #270002)
 *               Dark:  lilac purples (#F2E3E3 → #9A60F9)
 *   secondary — Light: cool purples (#EEE5FE → #15032F)
 *               Dark:  warm pinks (#F8E6E6 → #54000C)
 *   neutral   — The scale is INVERTED per mode so that neutral.50 is always
 *               the "most background" value (near-white in light, near-black
 *               in dark) and neutral.1050 is always the "most foreground" value.
 *               Semantic tokens reference the same neutral key in both modes.
 *   tertiary  — Light: warm crimsons; Dark: deep burgundies
 *   fix       — Absolute pure-black / pure-white / logo; mode-invariant usage
 *   feedback  — Success (teal), Alert (yellow), Error (red) — same in both modes
 *   effects   — Focus ring (blue, with alpha)
 */
function buildColorTokens(json: typeof lightJson) {
  return {
    primary: {
      100: c(json.primary['100']),
      200: c(json.primary['200']),
      300: c(json.primary['300']),
      400: c(json.primary['400']),
      500: c(json.primary['500']),
      600: c(json.primary['600']),
      700: c(json.primary['700']),
      800: c(json.primary['800']),
    },
    secondary: {
      100: c(json.secondary['100']),
      200: c(json.secondary['200']),
      300: c(json.secondary['300']),
      400: c(json.secondary['400']),
      450: c(json.secondary['450']),
      500: c(json.secondary['500']),
      600: c(json.secondary['600']),
      700: c(json.secondary['700']),
      800: c(json.secondary['800']),
    },
    neutral: {
      50:   c(json.neutral['50']),
      100:  c(json.neutral['100']),
      200:  c(json.neutral['200']),
      300:  c(json.neutral['300']),
      400:  c(json.neutral['400']),
      500:  c(json.neutral['500']),
      600:  c(json.neutral['600']),
      700:  c(json.neutral['700']),
      800:  c(json.neutral['800']),
      900:  c(json.neutral['900']),
      1000: c(json.neutral['1000']),
      1050: c(json.neutral['1050']),
    },
    tertiary: {
      100: c(json.tertiary['100']),
      200: c(json.tertiary['200']),
      300: c(json.tertiary['300']),
      400: c(json.tertiary['400']),
      450: c(json.tertiary['450']),
      500: c(json.tertiary['500']),
      600: c(json.tertiary['600']),
      700: c(json.tertiary['700']),
      800: c(json.tertiary['800']),
    },
    fix: {
      pureBlack: c(json.fix['pure black']),
      pureWhite: c(json.fix['pure white']),
      logo:      c(json.fix['logo']),
    },
    feedback: {
      success: {
        100: c(json.feedback.success['100']),
        200: c(json.feedback.success['200']),
        300: c(json.feedback.success['300']),
        400: c(json.feedback.success['400']),
        500: c(json.feedback.success['500']),
        600: c(json.feedback.success['600']),
      },
      alert: {
        100: c(json.feedback.alert['100']),
        200: c(json.feedback.alert['200']),
        300: c(json.feedback.alert['300']),
        400: c(json.feedback.alert['400']),
        500: c(json.feedback.alert['500']),
        600: c(json.feedback.alert['600']),
      },
      error: {
        100: c(json.feedback.error['100']),
        200: c(json.feedback.error['200']),
        300: c(json.feedback.error['300']),
        400: c(json.feedback.error['400']),
        500: c(json.feedback.error['500']),
        600: c(json.feedback.error['600']),
      },
    },
    effects: {
      focus: c(json.effects.focus), // rgba(41,98,253,0.88)
    },
  };
}

export const lightColorTokens = buildColorTokens(lightJson);
export const darkColorTokens  = buildColorTokens(darkJson);

/** The shape of a mode's color token set. */
export type ColorTokens = ReturnType<typeof buildColorTokens>;
