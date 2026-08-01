/**
 * Conversation walking + export pipeline.
 */
import type { LinearConversation } from '../conversationApi/types';

export function toJson(linear: LinearConversation): string {
  return JSON.stringify(linear, null, 2) + '\n';
}
