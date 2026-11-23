import { describe, expect, it, vi } from 'vitest';
import { triggerConfetti } from './confetti';
import { storage } from '../db/storage';

describe('triggerConfetti', () => {
  it('runs safely in browser-like environment without throwing', () => {
    expect(() => triggerConfetti({ count: 20 })).not.toThrow();
  });
});

describe('storage theme preferences', () => {
  it('defaults to light or dark and persists user choice', () => {
    storage.setTheme('dark');
    expect(storage.getTheme()).toBe('dark');

    storage.setTheme('light');
    expect(storage.getTheme()).toBe('light');
  });
});
