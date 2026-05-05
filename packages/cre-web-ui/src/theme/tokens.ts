/**
 * tokens.ts
 *
 * Builds theme token objects from the raw token values parsed in rawTokens.ts.
 * This is the semantic layer: it maps raw palette entries to meaningful roles
 * (background, text, action, feedback) that components can consume without
 * ever knowing which palette step they're referencing.
 *
 * Semantic mapping rationale:
 *
 *   neutral scale  — Inverted per mode in the source JSON, so the same key
 *                    (e.g. neutral.50) is near-white in Light and near-black
 *                    in Dark. Semantic aliases reference the scale uniformly.
 *
 *   primary.600    — The primary action color in both modes.
 *                    Light: #8A0538 (deep red/cranberry)
 *                    Dark:  #CDB1FC (lilac purple)
 *
 *   fix.pureBlack  — Absolute near-black (#1B1819). Used as foreground on
 *                    light-colored buttons in dark mode.
 *   fix.pureWhite  — Absolute near-white (#FCFBFB). Used as foreground on
 *                    dark-colored buttons in light mode.
 */

import { lightColorTokens, darkColorTokens } from './rawTokens';
import type { ColorTokens } from './rawTokens';

export type CreThemeMode = 'light' | 'dark';

// ─── Theme token shape ────────────────────────────────────────────────────────

export type CreThemeTokens = {
  mode: CreThemeMode;

  /**
   * Semantic surface / content / border tokens.
   * Components reference these rather than raw palette steps.
   */
  semantic: {
    /** Page / root background. */
    bg: string;
    /** Elevated card / container surface. */
    surface: string;
    /** Higher-elevation surface (e.g. modals, tooltips). */
    surfaceRaised: string;
    /** Primary text. */
    text: string;
    /** Secondary / muted text. */
    textMuted: string;
    /** Subtle / placeholder text. */
    textSubtle: string;
    /** Default border. */
    border: string;
    /** Stronger border for emphasis. */
    borderStrong: string;
    /** Keyboard-focus ring. */
    focusRing: string;

    /** Primary accent/action color group used for selected/active states outside of Button. */
    accentBg: string;
    accentFg: string;
    accentBorder: string;
    accentHoverBg: string;
    accentHoverBorder: string;
    accentActiveBg: string;
    accentActiveBorder: string;
    accentDisabledBg: string;
    accentDisabledFg: string;
    accentDisabledBorder: string;
  };

  /**
   * Feedback / status colors.
   * Use the mid-scale values (300-400) for foreground; light values (100-200)
   * for tinted backgrounds; dark values (500-600) for dark-surface contexts.
   */
  feedback: {
    success: { bg: string; text: string; border: string };
    alert:   { bg: string; text: string; border: string };
    error:   { bg: string; text: string; border: string };
  };

  /**
   * Component-level tokens for the Button.
   * Covers all interactive states.
   */
  components: {
    button: {
      bg: string; fg: string; border: string;
      hoverBg: string; hoverFg: string; hoverBorder: string;
      activeBg: string; activeFg: string; activeBorder: string;
      disabledBg: string; disabledFg: string; disabledBorder: string;

      secondaryBg: string; secondaryFg: string; secondaryBorder: string;
      secondaryHoverBg: string; secondaryHoverFg: string; secondaryHoverBorder: string;
      secondaryActiveBg: string; secondaryActiveFg: string; secondaryActiveBorder: string;
      secondaryDisabledBg: string; secondaryDisabledFg: string; secondaryDisabledBorder: string;
    };
  };
};

// ─── Semantic builder ─────────────────────────────────────────────────────────

function buildSemanticTokens(p: ColorTokens): CreThemeTokens['semantic'] {
  // neutral.50  → most-background (near-white in light, near-black in dark)
  // neutral.1050 → most-foreground (near-black in light, near-white in dark)
  // This works because the JSON files invert the neutral scale per mode.
  return {
    bg:           p.neutral[50],
    surface:      p.neutral[100],
    surfaceRaised: p.neutral[200],
    text:         p.neutral[1050],
    textMuted:    p.neutral[700],
    textSubtle:   p.neutral[600],
    border:       p.neutral[200],
    borderStrong: p.neutral[400],
    focusRing:    p.effects.focus,

    accentBg: p.primary[600],
    accentFg: p.fix.pureWhite,
    accentBorder: p.primary[700],
    accentHoverBg: p.primary[700],
    accentHoverBorder: p.primary[800],
    accentActiveBg: p.primary[800],
    accentActiveBorder: p.primary[800],
    accentDisabledBg: p.neutral[300],
    accentDisabledFg: p.neutral[700],
    accentDisabledBorder: p.neutral[400],
  };
}

function buildFeedbackTokens(p: ColorTokens): CreThemeTokens['feedback'] {
  return {
    success: {
      bg:     p.feedback.success[100],
      text:   p.feedback.success[400],
      border: p.feedback.success[300],
    },
    alert: {
      bg:     p.feedback.alert[100],
      text:   p.feedback.alert[400],
      border: p.feedback.alert[300],
    },
    error: {
      bg:     p.feedback.error[100],
      text:   p.feedback.error[400],
      border: p.feedback.error[300],
    },
  };
}

function buildButtonTokens(
  p: ColorTokens,
  mode: CreThemeMode
): CreThemeTokens['components']['button'] {
  // In light mode the button foreground is near-white (on a dark primary bg).
  // In dark mode the button foreground is near-black (on a light primary bg).
  const fg = mode === 'dark' ? p.fix.pureBlack : p.fix.pureWhite;

  return {
    bg:            p.primary[600],
    fg,
    border:        p.primary[700],

    hoverBg:       p.primary[700],
    hoverFg:       fg,
    hoverBorder:   p.primary[800],

    activeBg:      p.primary[800],
    activeFg:      fg,
    activeBorder:  p.primary[800],

    disabledBg:     p.neutral[300],
    disabledFg:     p.neutral[700],
    disabledBorder: p.neutral[400],

    secondaryBg:     p.neutral[100],
    secondaryFg:     p.neutral[1050],
    secondaryBorder: p.neutral[200],

    secondaryHoverBg:     p.neutral[200],
    secondaryHoverFg:     p.neutral[1050],
    secondaryHoverBorder: p.neutral[300],

    secondaryActiveBg:     p.neutral[300],
    secondaryActiveFg:     p.neutral[1050],
    secondaryActiveBorder: p.neutral[400],

    secondaryDisabledBg:     p.neutral[100],
    secondaryDisabledFg:     p.neutral[600],
    secondaryDisabledBorder: p.neutral[200],
  };
}

// ─── Public factory ───────────────────────────────────────────────────────────

export function createThemeTokens(mode: CreThemeMode): CreThemeTokens {
  const p = mode === 'dark' ? darkColorTokens : lightColorTokens;

  const semantic = buildSemanticTokens(p);

  const accentFg = mode === 'dark' ? p.fix.pureBlack : p.fix.pureWhite;

  return {
    mode,
    semantic: {
      ...semantic,
      accentFg,
    },
    feedback:   buildFeedbackTokens(p),
    components: { button: buildButtonTokens(p, mode) },
  };
}

