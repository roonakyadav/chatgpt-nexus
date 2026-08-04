/**
 * Full-screen modal renderer for the current announcement.
 *
 * Opens on:
 *   - megaphone button click
 *   - "查看详情" inside the bubble
 *   - the `1.6.x` version chip in the prompt-manager header
 *
 * Markdown is rendered via `marked` + sanitized through `DOMPurify` —
 * the same pipeline the prompt manager uses for prompt body previews,
 * so we don't add a second markdown sanitizer to the bundle.
 *
 * The modal IS intentionally interrupting (backdrop, focus trap on Esc),
 * unlike the bubble which is deliberately not. The bubble surfaces the
 * announcement; the modal is the user's explicit "read it" gesture.
 */
import browser from 'webextension-polyfill';
import type { AnnouncementAction, RemoteAnnouncement } from './types';
import './modal.css';

/**
 * Get icon SVG for announcement type.
 */
function getTypeIcon(type?: string): string {
  const icons: Record<string, string> = {
    release: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>`,
    tip: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14c.18-.9.27-1.85.26-2.83a7.07 7.07 0 0 0-4-6.32c-.76-.36-1.6-.58-2.46-.63A7.07 7.07 0 0 0 3.8 8.75c-.05.86.17 1.7.53 2.46a7.07 7.07 0 0 0 6.32 4c.98.01 1.93-.08 2.83-.26"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`,
    bugfix: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="8" height="8" x="8" y="8" rx="2"/><path d="M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M8 8v6"/><path d="M16 8v6"/><path d="M9 12h6"/><path d="M12 16v4"/><path d="M12 4V2"/></svg>`,
    warning: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>`,
    community: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    info: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`,
  };
  
  if (!type) return icons.info;
  const lowerType = type.toLowerCase();
  return icons[lowerType] || icons.info;
}

/**
 * Get display label for announcement type.
 */
function getTypeLabel(type?: string): string {
  const labels: Record<string, string> = {
    release: 'Release',
    tip: 'Tip',
    bugfix: 'Bug Fix',
    warning: 'Warning',
    community: 'Community',
    info: 'Info',
  };
  
  if (!type) return labels.info;
  const lowerType = type.toLowerCase();
  return labels[lowerType] || labels.info;
}

const MODAL_CLASS = 'gv-announcement-modal';
const BACKDROP_CLASS = 'gv-announcement-modal__backdrop';

export interface ModalHandle {
  destroy: () => void;
}

export interface OpenModalArgs {
  announcement: RemoteAnnouncement;
  closeLabel: string;
  versionPrefix?: string;
  onClose: () => void;
}

function formatPublishedAt(input: string | undefined): string {
  if (!input) return '';
  const d = new Date(input);
  if (!Number.isFinite(d.getTime())) return '';
  try {
    return d.toISOString().slice(0, 10);
  } catch {
    return '';
  }
}

/**
 * Handle announcement action clicks.
 * Supports 'url' (external links) and 'internal' (extension navigation).
 */
function handleAction(action: AnnouncementAction): void {
  try {
    if (action.type === 'url') {
      // Open external URL in new tab
      if (action.target) {
        window.open(action.target, '_blank', 'noopener,noreferrer');
      }
    } else if (action.type === 'internal') {
      // Handle internal navigation
      handleInternalAction(action.target);
    }
  } catch (error) {
    console.warn('[GPT-Nexus] Failed to handle announcement action:', error);
  }
}

/**
 * Handle internal action routing.
 * Maps internal targets to extension functionality.
 */
function handleInternalAction(target: string): void {
  switch (target) {
    case 'appearance.visualEffects':
      // Open extension options and navigate to visual effects
      browser.runtime.sendMessage({ type: 'gv.openPopup' }).catch(() => {
        console.debug('[GPT-Nexus] Could not open extension popup');
      });
      break;
    
    case 'appearance.themes':
      // Open extension options and navigate to themes
      browser.runtime.sendMessage({ type: 'gv.openPopup' }).catch(() => {
        console.debug('[GPT-Nexus] Could not open extension popup');
      });
      break;
    
    case 'about':
      // Open extension options and navigate to about
      browser.runtime.sendMessage({ type: 'gv.openPopup' }).catch(() => {
        console.debug('[GPT-Nexus] Could not open extension popup');
      });
      break;
    
    case 'promptManager':
      // Open prompt manager (already on ChatGPT page, just trigger it)
      console.debug('[GPT-Nexus] Prompt manager action - already on ChatGPT page');
      break;
    
    case 'announcementHistory':
      // Future placeholder for announcement history
      console.debug('[GPT-Nexus] Announcement history not yet implemented');
      break;
    
    default:
      console.debug('[GPT-Nexus] Unknown internal action target:', target);
      break;
  }
}

export function openAnnouncementModal(args: OpenModalArgs): ModalHandle {
  // Close any prior modal first.
  document.querySelectorAll<HTMLElement>(`.${BACKDROP_CLASS}`).forEach((b) => b.remove());

  const backdrop = document.createElement('div');
  backdrop.className = BACKDROP_CLASS;

  const card = document.createElement('div');
  card.className = MODAL_CLASS;
  card.setAttribute('role', 'dialog');
  card.setAttribute('aria-modal', 'true');
  card.setAttribute('aria-labelledby', 'gv-announcement-modal-title');

  // Header with icon, title, version, date, type badge
  const header = document.createElement('header');
  header.className = `${MODAL_CLASS}__header`;

  // Type icon
  const iconContainer = document.createElement('div');
  iconContainer.className = `${MODAL_CLASS}__icon`;
  iconContainer.innerHTML = getTypeIcon(args.announcement.type);
  header.appendChild(iconContainer);

  // Title section
  const titleSection = document.createElement('div');
  titleSection.className = `${MODAL_CLASS}__title-section`;

  const titleRow = document.createElement('div');
  titleRow.className = `${MODAL_CLASS}__title-row`;

  const titleEl = document.createElement('h2');
  titleEl.id = 'gv-announcement-modal-title';
  titleEl.className = `${MODAL_CLASS}__title`;
  const titlePrefix = args.announcement.version
    ? `${args.versionPrefix ?? 'v'}${args.announcement.version} — `
    : '';
  titleEl.textContent = `${titlePrefix}${args.announcement.title}`;
  titleRow.appendChild(titleEl);

  // Type badge
  const typeBadge = document.createElement('span');
  typeBadge.className = `${MODAL_CLASS}__type-badge`;
  typeBadge.textContent = getTypeLabel(args.announcement.type);
  titleRow.appendChild(typeBadge);

  titleSection.appendChild(titleRow);

  // Date
  const dateText = formatPublishedAt(args.announcement.publishedAt);
  if (dateText) {
    const date = document.createElement('div');
    date.className = `${MODAL_CLASS}__date`;
    date.textContent = dateText;
    titleSection.appendChild(date);
  }

  header.appendChild(titleSection);

  // Close button
  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = `${MODAL_CLASS}__close`;
  closeBtn.setAttribute('aria-label', args.closeLabel);
  closeBtn.title = args.closeLabel;
  closeBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18"/><path d="m6 6 12 12"/></svg>`;
  header.appendChild(closeBtn);

  card.appendChild(header);

  // Body
  const body = document.createElement('div');
  body.className = `${MODAL_CLASS}__body`;

  // Hero image with skeleton loading
  if (args.announcement.primaryImageUrl) {
    const heroContainer = document.createElement('div');
    heroContainer.className = `${MODAL_CLASS}__hero-container`;
    
    // Skeleton loader
    const skeleton = document.createElement('div');
    skeleton.className = `${MODAL_CLASS}__hero-skeleton`;
    heroContainer.appendChild(skeleton);
    
    const img = document.createElement('img');
    img.className = `${MODAL_CLASS}__hero`;
    img.alt = '';
    img.loading = 'lazy';
    
    img.onload = () => {
      skeleton.remove();
      img.classList.add(`${MODAL_CLASS}__hero--loaded`);
    };
    
    img.onerror = () => {
      heroContainer.remove();
    };
    
    img.src = args.announcement.primaryImageUrl;
    heroContainer.appendChild(img);
    body.appendChild(heroContainer);
  }

  // Summary as highlighted subtitle
  if (args.announcement.summary) {
    const summaryEl = document.createElement('div');
    summaryEl.className = `${MODAL_CLASS}__summary`;
    summaryEl.textContent = args.announcement.summary;
    body.appendChild(summaryEl);
  }

  const md = document.createElement('div');
  md.className = `${MODAL_CLASS}__markdown gv-md`;
  // Render markdown with `marked` + `DOMPurify`, both loaded on demand so they
  // stay out of the eager content bundle. Show the raw text immediately as a
  // fallback, then upgrade to sanitized HTML once the libraries resolve.
  md.textContent = args.announcement.bodyMarkdown;
  void (async () => {
    try {
      const [{ marked }, { default: DOMPurify }] = await Promise.all([
        import('marked'),
        import('dompurify'),
      ]);
      const out = await marked.parse(args.announcement.bodyMarkdown);
      md.innerHTML = DOMPurify.sanitize(out, { ADD_ATTR: ['target', 'rel'] });
    } catch {
      md.textContent = args.announcement.bodyMarkdown;
    }
  })();
  // Open links in a new tab — same pattern as the prompt-manager modal.
  md.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'A') {
      e.preventDefault();
      const href = (target as HTMLAnchorElement).href;
      if (href) window.open(href, '_blank', 'noopener,noreferrer');
    }
  });
  body.appendChild(md);

  // Render action buttons if present (max 3)
  if (args.announcement.actions && args.announcement.actions.length > 0) {
    const actionsContainer = document.createElement('div');
    actionsContainer.className = `${MODAL_CLASS}__actions`;
    
    // Limit to 3 actions, first is primary
    const actionsToRender = args.announcement.actions.slice(0, 3);
    
    actionsToRender.forEach((action, index) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = index === 0 
        ? `${MODAL_CLASS}__action ${MODAL_CLASS}__action--primary`
        : `${MODAL_CLASS}__action ${MODAL_CLASS}__action--secondary`;
      btn.textContent = action.label;
      
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleAction(action);
      });
      
      actionsContainer.appendChild(btn);
    });
    
    body.appendChild(actionsContainer);
  }

  card.appendChild(body);

  // Footer
  const footer = document.createElement('footer');
  footer.className = `${MODAL_CLASS}__footer`;
  
  const footerActions = document.createElement('div');
  footerActions.className = `${MODAL_CLASS}__footer-actions`;
  
  // Dismiss button
  const dismissBtn = document.createElement('button');
  dismissBtn.type = 'button';
  dismissBtn.className = `${MODAL_CLASS}__footer-btn ${MODAL_CLASS}__footer-btn--secondary`;
  dismissBtn.textContent = 'Dismiss';
  dismissBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    destroy();
    args.onClose();
  });
  footerActions.appendChild(dismissBtn);
  
  // Close button
  const closeFooterBtn = document.createElement('button');
  closeFooterBtn.type = 'button';
  closeFooterBtn.className = `${MODAL_CLASS}__footer-btn ${MODAL_CLASS}__footer-btn--primary`;
  closeFooterBtn.textContent = 'Close';
  closeFooterBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    destroy();
    args.onClose();
  });
  footerActions.appendChild(closeFooterBtn);
  
  footer.appendChild(footerActions);
  card.appendChild(footer);

  backdrop.appendChild(card);
  document.body.appendChild(backdrop);

  function destroy() {
    // Add fade-out animation
    backdrop.style.animation = 'fadeOut 0.2s ease-out forwards';
    
    // Remove after animation completes
    setTimeout(() => {
      backdrop.remove();
      document.removeEventListener('keydown', onKey);
    }, 200);
  }

  function onKey(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      destroy();
      args.onClose();
    }
  }

  closeBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    destroy();
    args.onClose();
  });
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) {
      destroy();
      args.onClose();
    }
  });
  document.addEventListener('keydown', onKey);

  return { destroy };
}
