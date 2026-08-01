/**
 * Top-bar "⭐ Nexus" button injected into ChatGPT's top control toolbar.
 *
 * Position rule:
 *   - Inserts as the FIRST button in the existing toolbar (to the LEFT of Share,
 *     Notification, Download, and Options).
 *   - Clones styling from native ChatGPT toolbar buttons (Share / temp chat toggle)
 *     using buildClonedButtonClassName for native height, spacing, hover, focus,
 *     and transitions.
 */
import { buildClonedButtonClassName } from '../shared/clonedButtonClass';
import {
  findHorizontalRowAncestor,
  findOptionsButtonRow,
  findShareButtonSlot,
} from '../shared/headerActionSlot';

const TAG = 'data-gv-nexus-btn';

interface InjectArgs {
  onClick: () => void;
}

let onClickRef: (() => void) | null = null;
let observer: MutationObserver | null = null;

interface Anchor {
  parent: HTMLElement;
  before: Element | null;
  styleSource: HTMLElement;
}

function findAnchor(): Anchor | null {
  // Primary: insert to the LEFT of Share so ⭐ Nexus is the first button in the toolbar
  const shareSlot = findShareButtonSlot();
  if (shareSlot) {
    return {
      parent: shareSlot.parent,
      before: shareSlot.before,
      styleSource: shareSlot.styleSource,
    };
  }

  // Fallback 1: options button row
  const optionsRow = findOptionsButtonRow();
  if (optionsRow) {
    return {
      parent: optionsRow.parent,
      before: optionsRow.before,
      styleSource: optionsRow.styleSource,
    };
  }

  // Fallback 2: temporary chat toggle outside a conversation
  const temp =
    document.querySelector<HTMLElement>('[data-testid="temporary-chat-toggle"]') ||
    document.querySelector<HTMLElement>(
      '[aria-label*="emporary" i], [aria-label*="临时" i], [aria-label*="临" i]',
    );
  if (!temp || !temp.parentElement) return null;
  const horiz = findHorizontalRowAncestor(temp);
  if (horiz) {
    return { parent: horiz.parent, before: horiz.before, styleSource: temp };
  }
  return { parent: temp.parentElement, before: temp, styleSource: temp };
}

function injectIfNeeded(): void {
  const anchor = findAnchor();
  if (!anchor) return;
  const { parent, before, styleSource } = anchor;

  // Idempotency: keep only one survivor and relocate if necessary
  const allExisting = Array.from(document.querySelectorAll<HTMLButtonElement>(`[${TAG}]`));
  if (allExisting.length > 0) {
    const survivor = allExisting[0];
    for (let i = 1; i < allExisting.length; i++) allExisting[i].remove();
    if (survivor.parentElement !== parent || survivor.nextSibling !== before) {
      try {
        parent.insertBefore(survivor, before);
      } catch {
        /* `before` detached — next mutation tick will retry */
      }
    }
    return;
  }
  if (!onClickRef) return;

  const btn = document.createElement('button');
  btn.className = buildClonedButtonClassName(styleSource.className, 'gv-nexus-topbar-btn');
  btn.type = 'button';
  btn.setAttribute(TAG, '1');
  btn.setAttribute('aria-label', '⭐ Nexus');
  btn.title = '⭐ Nexus';
  btn.textContent = '⭐ Nexus';

  btn.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    onClickRef?.();
  });

  parent.insertBefore(btn, before);
}

export function startTopBarNexusButton(args: InjectArgs): void {
  onClickRef = args.onClick;
  injectIfNeeded();
  if (!observer) {
    observer = new MutationObserver(() => injectIfNeeded());
    observer.observe(document.body, { childList: true, subtree: true });
  }
}

export function getNexusButtonElement(): HTMLButtonElement | null {
  return document.querySelector<HTMLButtonElement>(`[${TAG}]`);
}

export function stopTopBarNexusButton(): void {
  observer?.disconnect();
  observer = null;
  document.querySelectorAll<HTMLElement>(`[${TAG}]`).forEach((b) => b.remove());
  onClickRef = null;
}
