/**
 * Schema for the remote announcement feed (announcements.json).
 *
 * Single-current-announcement model. To re-pop the bubble for everyone,
 * bump `current.id` (the id is the only "is this new?" signal — the rest
 * of the fields are content that can change freely).
 *
 * Stored at:
 *   https://raw.githubusercontent.com/roonakyadav/chatgpt-nexus/refs/heads/main/announcements.json
 *
 * Add a `history` array later if/when we want to render a "past
 * announcements" list inside the modal. The schema bump (`v: 2`) would
 * be backwards-compatible — `current` stays at top level, parsers that
 * only know v=1 can keep working.
 */

/**
 * Announcement priority levels.
 * Controls display behavior and auto-opening logic.
 */
export type AnnouncementPriority = 'low' | 'normal' | 'high' | 'critical';
export interface RemoteAnnouncement {
  /** Stable, unique id — bumping this re-pops the bubble for every user. */
  id: string;
  /** Optional version label shown next to the title in the modal. */
  version?: string;
  /** Bubble + modal title. Keep under ~60 chars; bubble truncates. */
  title: string;
  /** ISO 8601 timestamp. Shown in the modal header. Optional. */
  publishedAt?: string;
  /**
   * Short preview text shown inside the bubble. Renderer truncates to
   * ~80 chars with an ellipsis — the editor should still strive to keep
   * this short.
   */
  summary: string;
  /**
   * Full announcement body. Rendered as sanitized Markdown inside the
   * modal. Images via `![](url)` work; links open in a new tab.
   */
  bodyMarkdown: string;
  /**
   * Optional hero image rendered above the markdown body in the modal.
   * Should be a stable public URL (e.g. raw.githubusercontent.com path
   * under the support repo's `support-assets/` folder).
   */
  primaryImageUrl?: string;
  /**
   * Optional announcement type for categorization and styling.
   * Examples: 'info', 'warning', 'feature', 'maintenance', 'urgent'
   */
  type?: string;
  /**
   * Optional priority level controlling display behavior.
   * Defaults to 'normal' if not specified.
   */
  priority?: AnnouncementPriority;
  /**
   * Optional array of action buttons to display in the modal.
   * Each action can have a label, URL, and optional styling hints.
   */
  actions?: AnnouncementAction[];
  /**
   * Optional ISO 8601 timestamp when this announcement should expire.
   * After this time, the announcement should not be shown even if
   * the user hasn't seen it yet.
   */
  expiresAt?: string;
}

/**
 * Action button configuration for announcement modals.
 */
export interface AnnouncementAction {
  /** Button label text. */
  label: string;
  /** Action type: 'url' for external links, 'internal' for extension navigation. */
  type: 'url' | 'internal';
  /**
   * Target for the action.
   * - For 'url': full URL to open
   * - For 'internal': internal route identifier (e.g., 'appearance.visualEffects')
   */
  target: string;
}

export interface RemoteAnnouncementFile {
  v: 1;
  current: RemoteAnnouncement | null;
}

/** In-memory cache wrapper persisted in chrome.storage.local. */
export interface AnnouncementCacheEntry {
  /** Epoch ms when we last fetched successfully. */
  fetchedAt: number;
  /** The parsed remote payload — `null` means "fetched but no current announcement". */
  payload: RemoteAnnouncementFile | null;
}
