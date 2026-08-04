/**
 * Theme system — applies custom color themes to ChatGPT's dark mode.
 * Supports multiple themes: default, forest, crimson, midnight-blue, royal-purple, emerald, sunset-amber, deep-ocean, mocha, obsidian, champagne.
 *
 * ChatGPT's dark theme drives every surface from CSS custom properties that
 * resolve to pure black (#000): the main chat/page surface, the sidebar, and
 * the elevated surface used for menus / dialogs (e.g. the Settings modal). We
 * override just those (plus the border tokens) with the user's palette. The
 * override is scoped to ChatGPT's own dark class (`html.dark`), so it is
 * automatically a no-op in light mode — no JS theme detection needed.
 */

const STYLE_ID = 'gv-theme-style';
const STORAGE_KEY = 'gvTheme';
const DEFAULT_THEME = 'default';

type Theme =
  | 'default'
  | 'forest'
  | 'crimson'
  | 'midnight-blue'
  | 'royal-purple'
  | 'emerald'
  | 'sunset-amber'
  | 'deep-ocean'
  | 'mocha'
  | 'obsidian'
  | 'champagne';

interface ThemePalette {
  mainSurface: string;
  elevatedSurface: string;
  border: string;
}

const THEME_PALETTES: Record<Theme, ThemePalette> = {
  default: {
    mainSurface: '#000000',
    elevatedSurface: '#000000',
    border: '#3d3d3b',
  },
  forest: {
    mainSurface: '#1a2e1a',
    elevatedSurface: '#2d4a2d',
    border: '#3d5f3d',
  },
  crimson: {
    mainSurface: '#2e1a1a',
    elevatedSurface: '#4a2d2d',
    border: '#5f3d3d',
  },
  'midnight-blue': {
    mainSurface: '#1a1e2e',
    elevatedSurface: '#2d324a',
    border: '#3d425f',
  },
  'royal-purple': {
    mainSurface: '#0F0B18',
    elevatedSurface: '#1B1430',
    border: '#2B2147',
  },
  emerald: {
    mainSurface: '#081312',
    elevatedSurface: '#10211F',
    border: '#163532',
  },
  'sunset-amber': {
    mainSurface: '#181109',
    elevatedSurface: '#24180D',
    border: '#3A2712',
  },
  'deep-ocean': {
    mainSurface: '#06131A',
    elevatedSurface: '#0C1E28',
    border: '#123243',
  },
  mocha: {
    mainSurface: '#171210',
    elevatedSurface: '#221A17',
    border: '#31231F',
  },
  obsidian: {
    mainSurface: '#000000',
    elevatedSurface: '#080808',
    border: '#101010',
  },
  champagne: {
    mainSurface: '#161410',
    elevatedSurface: '#211E18',
    border: '#322D24',
  },
};

function generateCSS(palette: ThemePalette): string {
  // For default theme, return empty CSS (no overrides needed)
  if (palette.mainSurface === '#000000' && palette.elevatedSurface === '#000000') {
    return '';
  }

  return `
  html.dark,
  html.dark body {
    --main-surface-primary: ${palette.mainSurface} !important;
    --sidebar-surface-primary: ${palette.mainSurface} !important;
    --bg-elevated-secondary: ${palette.elevatedSurface} !important;
    --border-default: ${palette.border} !important;
    --border-medium: ${palette.border} !important;
    --border-heavy: ${palette.border} !important;
    --border-sharp: ${palette.border} !important;
    --border-light: ${palette.border} !important;
    background-color: ${palette.mainSurface} !important;
  }
  /* Second token family (introduced for Codex, merged site-wide by ChatGPT's
     2026-07 redesign — the Chat/Work split): --bg-secondary-surface paints
     content surfaces (Codex main area, library rows), --component-sidebar-bg
     feeds --sidebar-surface-primary, --sidebar-surface is Codex's own sidebar.
     All three resolve to #000 in dark mode. */
  html.dark,
  html.dark body {
    --bg-secondary-surface: ${palette.mainSurface} !important;
    --sidebar-surface: ${palette.mainSurface} !important;
    --component-sidebar-bg: ${palette.mainSurface} !important;
  }
  /* ChatGPT's 2026-07 redesign re-declares --main-surface-primary on EVERY
     dark-scope element (\`html.dark :not(:where(.light, .light *))\`), which
     shadows the html/body override above for all descendants — new utilities
     like .bg-surface-primary (Work-tab suggestion list, library filter bar)
     then paint pure black again. Mirror the exact same selector; our <style>
     is appended after ChatGPT's sheets, so at equal specificity we win by
     order. Deliberately NOT !important: ChatGPT's intentional higher-
     specificity surface variations (.popover menus, .snc, canvas) must keep
     winning, or every floating panel would flatten to the base color. */
  html.dark,
  html.dark :not(:where(.light, .light *)) {
    --main-surface-primary: ${palette.mainSurface};
  }
  /* The sticky conversation header paints its own opaque black instead of using
     the surface token, so the token override alone leaves a black bar at top. */
  html.dark header.sticky.top-0 {
    background-color: ${palette.mainSurface} !important;
  }
  /* The composer fade overlay (fades messages out behind the input box) uses a
     hardcoded black background masked to fade in — leaving a black band at the
     bottom over the now-gray page. Recolor it to the gentle background so the
     fade blends in instead of showing as a dark strip. */
  html.dark [class*="thread-bottom-container"]::after {
    background-color: ${palette.mainSurface} !important;
  }
  /* ChatGPT re-declares the surface tokens on a wrapper below <body>, so the
     variable overrides above don't reach deep nodes (e.g. code-block headers).
     Override the surface *utility classes* directly — these are exactly the
     "primary surface" elements that should sit at the base background.
     .bg-surface-primary is the 2026-07 successor utility; hard-overriding it
     too keeps the fix alive even if a late-loaded route chunk re-shadows the
     token (menus don't use these utilities — verified they paint via their
     own oklch classes — so !important is safe here). */
  html.dark .bg-token-main-surface-primary,
  html.dark .bg-token-sidebar-surface-primary,
  html.dark .bg-surface-primary {
    background-color: ${palette.mainSurface} !important;
  }
`;
}

function applyStyle(theme: Theme): void {
  const palette = THEME_PALETTES[theme];
  const css = generateCSS(palette);

  let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement('style');
    style.id = STYLE_ID;
    (document.head || document.documentElement).appendChild(style);
  }

  if (css) {
    style.textContent = css;
  } else {
    style.remove();
  }
}

function removeStyle(): void {
  document.getElementById(STYLE_ID)?.remove();
}

export function startGentleDarkMode(): void {
  chrome.storage?.sync?.get({ [STORAGE_KEY]: DEFAULT_THEME }, (res) => {
    const theme = res?.[STORAGE_KEY] as Theme;
    if (theme && theme !== 'default') {
      applyStyle(theme);
    }
  });

  const storageChangeHandler = (
    changes: Record<string, chrome.storage.StorageChange>,
    area: string,
  ) => {
    if (area === 'sync' && changes[STORAGE_KEY]) {
      const newTheme = changes[STORAGE_KEY].newValue as Theme;
      if (newTheme && newTheme !== 'default') {
        applyStyle(newTheme);
      } else {
        removeStyle();
      }
    }
  };

  chrome.storage?.onChanged?.addListener(storageChangeHandler);

  window.addEventListener(
    'beforeunload',
    () => {
      removeStyle();
      try {
        chrome.storage?.onChanged?.removeListener(storageChangeHandler);
      } catch {
        // Ignore cleanup errors during page teardown.
      }
    },
    { once: true },
  );
}
