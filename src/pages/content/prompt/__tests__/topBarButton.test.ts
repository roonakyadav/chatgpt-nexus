import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getNexusButtonElement,
  startTopBarNexusButton,
  stopTopBarNexusButton,
} from '../topBarButton';

describe('Prompt topBarButton', () => {
  beforeEach(() => {
    stopTopBarNexusButton();
    document.body.innerHTML = '';
  });

  it('injects the ⭐ Nexus button before the Share button as the first item', () => {
    const container = document.createElement('div');
    const shareBtn = document.createElement('button');
    shareBtn.setAttribute('data-testid', 'share-chat-button');
    shareBtn.className = 'share-btn-class';
    container.appendChild(shareBtn);
    document.body.appendChild(container);

    const onClick = vi.fn();
    startTopBarNexusButton({ onClick });

    const btn = getNexusButtonElement();
    expect(btn).not.toBeNull();
    expect(btn?.textContent).toBe('⭐ Nexus');
    expect(btn?.parentElement).toBe(container);
    expect(btn?.nextSibling).toBe(shareBtn);

    btn?.click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('removes injected button when stopped', () => {
    const container = document.createElement('div');
    const shareBtn = document.createElement('button');
    shareBtn.setAttribute('data-testid', 'share-chat-button');
    container.appendChild(shareBtn);
    document.body.appendChild(container);

    startTopBarNexusButton({ onClick: vi.fn() });
    expect(getNexusButtonElement()).not.toBeNull();

    stopTopBarNexusButton();
    expect(getNexusButtonElement()).toBeNull();
  });
});
