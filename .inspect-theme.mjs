import { JSDOM } from 'jsdom';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = __dirname;

/* ==========================================================================
   0. CSS PARSER — tokenizes a stylesheet into {selector, property, value, line}
   with specificity calculation and cascade ordering.
   ========================================================================== */

function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

function specificity(selector) {
  // (inline, ids, classes attrs pseuodo-classes, elements pseudo-elements)
  let a = 0, b = 0, c = 0, d = 0;
  const s = selector.trim();
  const tokens = s.match(/[#.]?[\w-]+|\[[^\]]+\]|:\w+(?:\([^)]+\))?|::?\w+|\*/g) || [];
  for (const tok of tokens) {
    if (tok.startsWith('#')) b++;
    else if (tok.startsWith('.') || tok.startsWith('[')) c++;
    else if (tok.startsWith('::')) d++;
    else if (tok.startsWith(':')) c++;
    else if (tok === '*') {}
    else d++;
  }
  return [a, b, c, d];
}

function cmpSpec(a, b) {
  for (let i = 0; i < 4; i++) if (a[i] !== b[i]) return a[i] - b[i];
  return 0;
}

/**
 * Parse CSS into an array of rules, each with selectors + declarations.
 * Media queries are handled by resolving @media (prefers-color-scheme: dark) as
 * "active if darkScheme=true" and recording that gate on the inner rules.
 */
function parseCSS(sourceText, fileName, opts = {}) {
  const text = stripComments(sourceText);
  const rules = [];
  let line = 1;

  function advanceLines(str) {
    const m = str.match(/\n/g);
    if (m) line += m.length;
  }

  let i = 0;

  while (i < text.length) {
    // skip whitespace / track lines
    while (i < text.length && /\s/.test(text[i])) {
      if (text[i] === '\n') line++;
      i++;
    }
    if (i >= text.length) break;

    // at-rule
    if (text.startsWith('@', i)) {
      const atMatch = text.slice(i).match(/^@([\w-]+)[^{;]*\{/);
      if (!atMatch) {
        // skip until ; or next
        const semi = text.indexOf(';', i);
        const brace = text.indexOf('{', i);
        if (semi === -1) break;
        advanceLines(text.slice(i, semi + 1));
        i = semi + 1;
        continue;
      }
      const atName = atMatch[1].toLowerCase();
      const atHeaderEnd = i + atMatch[0].length;
      const headerStartLine = line;
      advanceLines(text.slice(i, atHeaderEnd));
      i = atHeaderEnd;

      // find matching close brace (account for nesting: @media, @supports, @keyframes)
      let depth = 1;
      let j = i;
      while (j < text.length && depth > 0) {
        if (text[j] === '{') depth++;
        else if (text[j] === '}') depth--;
        if (text[j] === '\n') line++;
        j++;
      }
      const block = text.slice(i, j - 1); // inside the at-rule
      const atFullHeader = text.slice(text.indexOf('@', i - atMatch[0].length), atHeaderEnd - 1).trim();

      if (atName === 'media' && /prefers-color-scheme:\s*dark/.test(atFullHeader)) {
        // Parse inner block as a nested CSS, mark every rule with mediaGate='dark'
        const nested = parseCSS(block + '\n}', fileName, { parentMedia: 'dark', startLine: headerStartLine - 1 });
        rules.push(...nested);
      } else if (atName === 'layer' || atName === 'supports' || atName === 'media') {
        // Keep the rules inside but record no special gate (for @layer base, treat as active)
        const nested = parseCSS(block + '\n}', fileName, { startLine: headerStartLine - 1 });
        rules.push(...nested);
      }
      // skip keyframes / page / etc
      i = j;
      continue;
    }

    // Regular rule block: find '{' and matching '}'
    const blockStart = text.indexOf('{', i);
    if (blockStart === -1) break;
    const selectorPart = text.slice(i, blockStart).trim();
    const selectors = selectorPart.split(',').map((s) => s.trim()).filter(Boolean);
    const ruleStartLine = line;
    advanceLines(text.slice(i, blockStart + 1));
    i = blockStart + 1;

    // find close
    let depth = 1;
    let j = i;
    while (j < text.length && depth > 0) {
      if (text[j] === '{') depth++;
      else if (text[j] === '}') depth--;
      if (text[j] === '\n') line++;
      j++;
    }
    const declBlock = text.slice(i, j - 1);
    const decls = parseDecls(declBlock);

    for (const sel of selectors) {
      for (const { prop, value, declLine } of decls) {
        rules.push({
          selector: sel,
          property: prop.toLowerCase(),
          value,
          specificity: specificity(sel),
          fileName,
          line: ruleStartLine + declLine - 1,
          order: rules.length,
          mediaGate: opts.parentMedia || null,
        });
      }
    }
    i = j;
  }
  return rules;
}

function parseDecls(block) {
  const decls = [];
  let line = 1;
  let i = 0;
  while (i < block.length) {
    while (i < block.length && /\s/.test(block[i])) {
      if (block[i] === '\n') line++;
      i++;
    }
    if (i >= block.length) break;
    // find ; or next }
    let end = block.length;
    for (let k = i; k < block.length; k++) {
      if (block[k] === ';' || block[k] === '}') { end = k; break; }
    }
    const piece = block.slice(i, end).trim();
    const colon = piece.indexOf(':');
    if (colon > 0) {
      const prop = piece.slice(0, colon).trim();
      const value = piece.slice(colon + 1).trim();
      if (prop && value) decls.push({ prop, value, declLine: line });
    }
    // advance lines for piece
    const npiece = piece.match(/\n/g);
    if (npiece) line += npiece.length;
    i = end + 1;
  }
  return decls;
}

/* ==========================================================================
   1. RULE FILTERING + CASCADE — for an element (selector, attrs, classes,
      parentClasses), collect applicable rules and return the winning one per
      property, taking into account specificity, media query gate, source order.
   ========================================================================== */

function elementMatches(ruleSelector, elementContext) {
  // Build a simulated element by concatenating into a single test string.
  // We'll use regex matching to answer: does the ruleSelector describe an
  // element that has the tag, id, classes, attrs of elementContext + any of
  // the parent classes/attrs as ancestors (in any order — sufficient for this
  // report).
  const {
    tag = 'div',
    id = null,
    classes = [],
    attrs = {}, // { 'data-gv-theme': 'dark' }
    parentClasses = [], // classes on html/body/ancestors (used for .dark, .theme-host.dark-theme etc.)
    parentAttrs = {},
    ancestors = [], // ordered list of ancestors each with {classes, attrs, id}
  } = elementContext;

  // Parse the rule selector into COMPOUND parts split by descendant (space),
  // child (>), adjacent (+), general sibling (~). For simplicity, we only
  // handle: compound classes in the LAST part (the element itself), and any
  // ancestor requirements as PREFIX parts.
  const parts = ruleSelector.split(/\s+(?![^\[]*\])/).filter(Boolean);
  if (parts.length === 0) return false;

  const subjectPart = parts[parts.length - 1];

  // Subject must match THIS element
  if (!compoundMatches(subjectPart, { tag, id, classes, attrs })) return false;

  // Ancestors (parts[0..n-2]) must match the ancestor chain somehow
  // Walk backwards through ancestors to satisfy in order
  const ancestorParts = parts.slice(0, parts.length - 1);
  if (ancestorParts.length > 0) {
    let idx = ancestors.length - 1;
    for (let p = ancestorParts.length - 1; p >= 0; p--) {
      let matched = false;
      while (idx >= 0) {
        const anc = ancestors[idx];
        if (compoundMatches(ancestorParts[p], {
          tag: anc.tag || 'div',
          id: anc.id,
          classes: anc.classes || [],
          attrs: anc.attrs || {},
        })) {
          matched = true;
          idx--;
          break;
        }
        idx--;
      }
      if (!matched) return false;
    }
  }
  return true;
}

function compoundMatches(compound, el) {
  // compound like: .gv-pm-panel[data-gv-theme='dark'] or html.dark or .theme-host.dark-theme
  // Split tokenizer: keep delimiters
  const tokens = compound.match(/([#.][\w-]+|\[[^\]]+\]|[\w-]+|\*)/g) || [];
  for (const tok of tokens) {
    if (tok === '*') continue;
    if (tok.startsWith('#')) {
      if (el.id !== tok.slice(1)) return false;
    } else if (tok.startsWith('.')) {
      if (!el.classes.includes(tok.slice(1))) return false;
    } else if (tok.startsWith('[')) {
      // [attr='val'], [attr=val], [attr]
      const m = tok.match(/^\[([\w-]+)(?:([~|^$*]?=)\s*["']?([^"'\]]*)["']?)?\]$/);
      if (!m) return false;
      const [, attr, op, val] = m;
      if (!op) {
        if (!(attr in el.attrs)) return false;
      } else {
        const actual = String(el.attrs[attr] ?? '');
        switch (op) {
          case '=': if (actual !== val) return false; break;
          default: return true; // tolerant: if attr exists, treat as ok
        }
      }
    } else {
      // tag
      if (tok.toLowerCase() !== el.tag.toLowerCase()) return false;
    }
  }
  return true;
}

function findWinningRules(rules, elementContext, { darkScheme = true } = {}) {
  const filtered = rules.filter((r) => {
    if (r.mediaGate === 'dark' && !darkScheme) return false;
    // Only one @media dark gate in use for this report; no light-gated media.
    return elementMatches(r.selector, elementContext);
  });
  const winners = {};
  for (const rule of filtered) {
    const cur = winners[rule.property];
    if (!cur) { winners[rule.property] = rule; continue; }
    // specificity first, then source order
    const sc = cmpSpec(rule.specificity, cur.specificity);
    if (sc > 0) winners[rule.property] = rule;
    else if (sc === 0 && rule.order > cur.order) winners[rule.property] = rule;
  }
  return winners;
}

/* ==========================================================================
   2. CSS VARIABLE RESOLUTION (simplified) — for values like
      color-mix(in srgb, var(--gpt-primary, #1a73e8) 10%, ...)
      or var(--border-medium, oklch(...))
   return the final resolved literal.
   ========================================================================== */

function resolveVar(value, scopeVars, depth = 0) {
  if (depth > 6) return value;
  if (typeof value !== 'string') return value;
  return value.replace(/var\(\s*(--[\w-]+)\s*(?:,\s*([^)]+))?\)/g, (_, name, fallback) => {
    if (name in scopeVars) return resolveVar(scopeVars[name], scopeVars, depth + 1);
    if (fallback !== undefined) return resolveVar(fallback.trim(), scopeVars, depth + 1);
    return _;
  });
}

/* ==========================================================================
   3. Load actual CSS files
   ========================================================================== */

const contentStyleCSS = fs.readFileSync(path.join(ROOT, 'public', 'contentStyle.css'), 'utf8');
const tailwindCSS = fs.readFileSync(path.join(ROOT, 'src', 'assets', 'styles', 'tailwind.css'), 'utf8');

const contentStyleRules = parseCSS(contentStyleCSS, 'public/contentStyle.css');
const tailwindRules = parseCSS(tailwindCSS, 'src/assets/styles/tailwind.css');

/* ==========================================================================
   4. Simulate: PROMPT MANAGER PANEL
   Element: <div id="gv-pm-panel" class="gv-pm-panel" data-gv-theme="dark|light">
   Ancestors (host page): html.dark > body.dark-theme > .theme-host.dark-theme > …
   NOTE: data-gv-theme is ALWAYS set (prompt/index.ts line 849).
   ========================================================================== */

const promptPanelAncestors = (mode) => [
  { tag: 'html', classes: mode === 'dark' ? ['dark'] : ['light'], attrs: {}, id: null },
  { tag: 'body', classes: mode === 'dark' ? ['dark-theme'] : ['light-theme'], attrs: { 'data-theme': mode }, id: null },
  { tag: 'div',  classes: mode === 'dark' ? ['theme-host', 'dark-theme'] : ['theme-host', 'light-theme'], attrs: {}, id: null },
];

function promptPanelCtx(mode) {
  return {
    tag: 'div',
    id: 'gv-pm-panel',
    classes: ['gv-pm-panel'],
    attrs: { 'data-gv-theme': mode, role: 'dialog' },
    ancestors: promptPanelAncestors(mode),
  };
}

const PROPS = ['background', 'background-color', 'color', 'border-color', 'border-top-color', 'border-bottom-color', 'box-shadow'];

function inspectElement(rules, ctx, label, { darkScheme = true, scopeVars = {} } = {}) {
  const winners = findWinningRules(rules, ctx, { darkScheme });
  const rows = [];
  for (const p of ['background-color', 'color', 'border-color', 'box-shadow']) {
    let r = winners[p];
    // border-color fallback: use first specific border top/bottom/left/right
    if (!r && p === 'border-color') r = winners['border-top-color'] || winners['border-bottom-color'];
    if (!r && p === 'background-color') r = winners['background'];
    if (!r) {
      rows.push({ property: p, value: '(none set in stylesheets)', cssVar: '', selector: '', file: '', line: '' });
      continue;
    }
    const resolved = resolveVar(r.value, scopeVars);
    // extract variable used (if any)
    const varMatch = r.value.match(/var\(\s*(--[\w-]+)/);
    rows.push({
      property: p,
      value: resolved,
      cssVar: varMatch ? varMatch[1] : '',
      selector: r.selector,
      file: r.fileName,
      line: r.line,
      specificity: r.specificity,
    });
  }
  return { label, rows };
}

const pmDark = inspectElement(contentStyleRules, promptPanelCtx('dark'), 'Prompt Manager (data-gv-theme=dark)', { darkScheme: true });
const pmLight = inspectElement(contentStyleRules, promptPanelCtx('light'), 'Prompt Manager (data-gv-theme=light)', { darkScheme: false });

/* ==========================================================================
   5. Simulate: MAIN EXTENSION PANEL (popup)
   Element: <div class="bg-background text-foreground w-[360px]"> (Popup.tsx:695)
   Ancestors: html.dark (or html without .dark for light) > body > #__root
   Tailwind utilities: bg-background -> var(--background) -> oklch(...)
                      text-foreground -> var(--foreground) -> oklch(...)
                      border-border -> var(--border) -> oklch(...)
   ========================================================================== */

/* We need to also simulate the Tailwind utility-to-property mapping.
   Tailwind v4 transforms `bg-background` → `background-color: var(--background)`,
   but since the CSS we loaded (tailwind.css) defines @theme with
   --color-background: var(--background);, the utility is generated by Tailwind
   engine from the `@import 'tailwindcss'` rule. To account for this, we
   manually construct the Tailwind utility rules that would apply to the root
   div, and append them to the rule list AFTER the @layer base :root / .dark
   variable declarations (so utilities override base, as expected). */

function makeTailwindUtility(selector, prop, val, file, line) {
  return {
    selector,
    property: prop,
    value: val,
    specificity: specificity(selector),
    fileName: file,
    line,
    order: 1_000_000, // utilities are AFTER base in Tailwind cascade
    mediaGate: null,
  };
}

const tailwindUtilRules = [
  // class bg-background → background-color: var(--tw-color-background, var(--color-background))
  // tailwind.css line 81 maps: --color-background: var(--background);
  makeTailwindUtility('.bg-background', 'background-color', 'var(--background)',
    'src/assets/styles/tailwind.css (TW util: bg-background ← @theme line 81)', 81),
  makeTailwindUtility('.text-foreground', 'color', 'var(--foreground)',
    'src/assets/styles/tailwind.css (TW util: text-foreground ← @theme line 82)', 82),
  makeTailwindUtility('.border-border', 'border-color', 'var(--border)',
    'src/assets/styles/tailwind.css (TW util: border-border ← @theme line 97)', 97),
  makeTailwindUtility('.bg-card', 'background-color', 'var(--card)',
    'src/assets/styles/tailwind.css (TW util: bg-card ← @theme line 83)', 83),
  makeTailwindUtility('.text-primary', 'color', 'var(--primary)',
    'src/assets/styles/tailwind.css (TW util: text-primary ← @theme line 87)', 87),
  makeTailwindUtility('.shadow-none', 'box-shadow', 'none',
    '<tw-default: shadow-none>', 0),
];

// Append Tailwind base :root and .dark vars to the ruleset
const combinedPopupRules = [...tailwindRules, ...tailwindUtilRules];

function mainPanelCtx(mode) {
  // Popup root div: <div class="bg-background text-foreground w-[360px]">
  // Ancestors (popup own chrome-extension:// document):
  //   html.dark (or html for light) > body > #__root > this
  return {
    tag: 'div',
    id: null,
    classes: ['bg-background', 'text-foreground', 'w-[360px]'],
    attrs: {},
    ancestors: [
      { tag: 'html', classes: mode === 'dark' ? ['dark'] : [], attrs: {}, id: null },
      { tag: 'body', classes: [], attrs: {}, id: null },
      { tag: 'div',  classes: [], attrs: { id: '__root' }, id: '__root' },
    ],
  };
}

function buildScopeVars(mode) {
  // Same values as tailwind.css @layer base
  const light = {
    '--background': 'oklch(0.98 0.003 205)',
    '--foreground': 'oklch(0.13 0.006 205)',
    '--card': 'oklch(0.995 0.001 205)',
    '--card-foreground': 'oklch(0.13 0.006 205)',
    '--popover': 'oklch(0.995 0.001 205)',
    '--popover-foreground': 'oklch(0.13 0.006 205)',
    '--primary': '#0f766e',
    '--primary-foreground': '#ffffff',
    '--border': 'oklch(0.9 0.004 205)',
    '--input': 'oklch(0.9 0.004 205)',
    '--ring': '#0f766e',
    '--color-background': 'var(--background)',
    '--color-foreground': 'var(--foreground)',
    '--color-card': 'var(--card)',
    '--color-border': 'var(--border)',
    '--color-primary': 'var(--primary)',
    // Prompt-Manager fallback vars (not used by popup itself but for completeness)
    '--main-surface-primary': '#ffffff',
    '--text-primary': '#0f172a',
    '--border-medium': '#e2e8f0',
  };
  const dark = {
    ...light,
    '--background': 'oklch(0.16 0.006 205)',
    '--foreground': 'oklch(0.92 0.005 205)',
    '--card': 'oklch(0.2 0.008 205)',
    '--card-foreground': 'oklch(0.92 0.005 205)',
    '--popover': 'oklch(0.2 0.008 205)',
    '--popover-foreground': 'oklch(0.92 0.005 205)',
    '--primary': '#2dd4bf',
    '--primary-foreground': '#ffffff',
    '--border': 'oklch(0.3 0.008 205)',
    '--input': 'oklch(0.3 0.008 205)',
    '--ring': '#5eead4',
    '--main-surface-primary': '#0b1220',
    '--text-primary': '#e8e8e8',
    '--border-medium': '#1f2937',
  };
  return mode === 'dark' ? dark : light;
}

const mpDarkVars = buildScopeVars('dark');
const mpLightVars = buildScopeVars('light');

const mpDark = inspectElement(combinedPopupRules, mainPanelCtx('dark'),
  'Main Extension Panel (html.dark > .bg-background.text-foreground)',
  { darkScheme: true, scopeVars: mpDarkVars });
const mpLight = inspectElement(combinedPopupRules, mainPanelCtx('light'),
  'Main Extension Panel (html > .bg-background.text-foreground)',
  { darkScheme: false, scopeVars: mpLightVars });

/* ==========================================================================
   6. Also inspect: Prompt Manager HEADER + SEARCH + TITLE + FOOTER (children)
      so the report shows where child-element divergence starts.
   ========================================================================== */

function childCtx(mode, cls, tag = 'div', parentId = 'gv-pm-panel') {
  return {
    tag,
    id: null,
    classes: [cls],
    attrs: {},
    ancestors: [
      ...promptPanelAncestors(mode),
      { tag: 'div', classes: ['gv-pm-panel'], attrs: { 'data-gv-theme': mode, id: parentId }, id: parentId },
    ],
  };
}

const childSummary = [];
for (const mode of ['dark', 'light']) {
  for (const [label, cls, tag] of [
    ['.gv-pm-header', 'gv-pm-header', 'div'],
    ['.gv-pm-title', 'gv-pm-title', 'div'],
    ['.gv-pm-footer', 'gv-pm-footer', 'div'],
  ]) {
    const res = inspectElement(contentStyleRules, childCtx(mode, cls, tag),
      `PM child ${label} [mode=${mode}]`, { darkScheme: mode === 'dark' });
    childSummary.push(res);
  }
}

/* ==========================================================================
   7. Print markdown table
   ========================================================================== */

function printInspection(title, inspection, mode) {
  let out = `\n### ${title}\n\n`;
  out += `| Property | Computed Value | CSS Variable | Winning Selector | Source File | Line |\n`;
  out += `|----------|----------------|--------------|------------------|-------------|------|\n`;
  for (const r of inspection.rows) {
    const v = (r.value.length > 100) ? r.value.slice(0, 97) + '…' : r.value;
    out += `| ${r.property.padEnd(15)} | ${v.padEnd(42)} | ${(r.cssVar || '—').padEnd(26)} | ${(r.selector || '—').padEnd(48)} | ${(r.file || '—').padEnd(40)} | ${String(r.line).padEnd(4)} |\n`;
  }
  return out;
}

let REPORT = '';

REPORT += printInspection(pmDark.label, pmDark, 'dark');
REPORT += printInspection(pmLight.label, pmLight, 'light');
REPORT += printInspection(mpDark.label, mpDark, 'dark');
REPORT += printInspection(mpLight.label, mpLight, 'light');

for (const c of childSummary) {
  REPORT += printInspection(c.label, c, '');
}

/* ==========================================================================
   8. Side-by-side comparison of equivalent semantic properties.
   ========================================================================== */

REPORT += `\n\n## SIDE-BY-SIDE COMPARISON (FINAL COMPUTED VALUES)\n\n`;
REPORT += `| Semantic Property | Main Panel (Light) | PM Popup (Light) | Main Panel (Dark) | PM Popup (Dark) |\n`;
REPORT += `|-------------------|--------------------|------------------|--------------------|-----------------|\n`;

function valFor(ins, prop) {
  const r = ins.rows.find((x) => x.property === prop);
  return r ? r.value : '—';
}

REPORT += `| background-color  | ${valFor(mpLight,'background-color').padEnd(26)} | ${valFor(pmLight,'background-color').padEnd(26)} | ${valFor(mpDark,'background-color').padEnd(26)} | ${valFor(pmDark,'background-color').padEnd(26)} |\n`;
REPORT += `| color (text)      | ${valFor(mpLight,'color').padEnd(26)} | ${valFor(pmLight,'color').padEnd(26)} | ${valFor(mpDark,'color').padEnd(26)} | ${valFor(pmDark,'color').padEnd(26)} |\n`;
REPORT += `| border-color      | ${valFor(mpLight,'border-color').padEnd(26)} | ${valFor(pmLight,'border-color').padEnd(26)} | ${valFor(mpDark,'border-color').padEnd(26)} | ${valFor(pmDark,'border-color').padEnd(26)} |\n`;
REPORT += `| box-shadow        | ${valFor(mpLight,'box-shadow').padEnd(26)} | ${valFor(pmLight,'box-shadow').padEnd(26)} | ${valFor(mpDark,'box-shadow').padEnd(26)} | ${valFor(pmDark,'box-shadow').padEnd(26)} |\n`;

console.log(REPORT);
fs.writeFileSync(path.join(ROOT, '.theme-inspection-report.md'), REPORT);
console.error('\n→ Also wrote .theme-inspection-report.md');
