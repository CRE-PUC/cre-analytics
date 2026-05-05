import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';
import type { CreThemeMode, CreThemeTokens } from './tokens';
import { createThemeTokens } from './tokens';
import { coreTokensToCssVars, themeTokensToCssVars } from './cssVars';

type CreThemeContextValue = {
  mode: CreThemeMode;
  setMode: (mode: CreThemeMode) => void;
  toggleMode: () => void;
  tokens: CreThemeTokens;
};

const CreThemeContext = createContext<CreThemeContextValue | null>(null);

export function useCreTheme(): CreThemeContextValue {
  const value = useContext(CreThemeContext);
  if (!value) {
    throw new Error('useCreTheme must be used within a CreThemeProvider');
  }
  return value;
}

export type CreThemeProviderProps = PropsWithChildren<{
  initialMode?: CreThemeMode;
  mode?: CreThemeMode;
  onModeChange?: (mode: CreThemeMode) => void;
  scope?: 'local' | 'global';
}>;

// Core vars never change — compute once at module load
const CORE_CSS_VARS = coreTokensToCssVars();

export function CreThemeProvider({
  children,
  initialMode = 'light',
  mode: controlledMode,
  onModeChange,
  scope = 'local'
}: CreThemeProviderProps) {
  const [uncontrolledMode, setUncontrolledMode] = useState<CreThemeMode>(initialMode);
  const mode = controlledMode ?? uncontrolledMode;

  const tokens = useMemo(() => createThemeTokens(mode), [mode]);

  // Merge core (static) + mode-specific (dynamic) CSS vars
  const cssVars = useMemo(
    () => ({ ...CORE_CSS_VARS, ...themeTokensToCssVars(tokens) }),
    [tokens]
  );

  useEffect(() => {
    if (scope !== 'global') return;

    const root = document.documentElement;
    root.setAttribute('data-cre-theme', mode);

    for (const [key, value] of Object.entries(cssVars)) {
      root.style.setProperty(key, value);
    }

    return () => {
      root.removeAttribute('data-cre-theme');
      for (const key of Object.keys(cssVars)) {
        root.style.removeProperty(key);
      }
    };
  }, [cssVars, mode, scope]);

  const value = useMemo<CreThemeContextValue>(() => {
    const setMode = (next: CreThemeMode) => {
      if (controlledMode === undefined) setUncontrolledMode(next);
      onModeChange?.(next);
    };

    return {
      mode,
      setMode,
      toggleMode: () => setMode(mode === 'light' ? 'dark' : 'light'),
      tokens
    };
  }, [controlledMode, mode, onModeChange, tokens]);

  return (
    <CreThemeContext.Provider value={value}>
      {scope === 'global' ? (
        children
      ) : (
        <div data-cre-theme={mode} style={cssVars}>
          {children}
        </div>
      )}
    </CreThemeContext.Provider>
  );
}
CreThemeProvider.displayName = 'CreThemeProvider';
