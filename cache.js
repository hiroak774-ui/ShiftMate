(() => {
  'use strict';

  const KEY = 'shiftmate_app_snapshot_v1';
  const MAX_AGE_MS = 10 * 60 * 1000;

  function readRaw() {
    try {
      const value = sessionStorage.getItem(KEY);
      return value ? JSON.parse(value) : null;
    } catch (_) {
      return null;
    }
  }

  function writeRaw(value) {
    try {
      sessionStorage.setItem(KEY, JSON.stringify(value));
      return true;
    } catch (_) {
      return false;
    }
  }

  function get(month, role, allowStale = false) {
    const root = readRaw();

    if (!root || root.month !== month || !root.snapshot) {
      return null;
    }

    const age = Date.now() - Number(root.savedAt || 0);

    if (!allowStale && age > MAX_AGE_MS) {
      return null;
    }

    return role ? root.snapshot[role] || null : root.snapshot;
  }

  function set(month, snapshot) {
    return writeRaw({
      month,
      savedAt: Date.now(),
      snapshot
    });
  }

  function merge(month, patch) {
    const root = readRaw();
    const current =
      root && root.month === month && root.snapshot
        ? root.snapshot
        : {};

    return set(month, {
      ...current,
      ...patch
    });
  }

  function invalidate(role) {
    if (!role) {
      sessionStorage.removeItem(KEY);
      return;
    }

    const root = readRaw();

    if (!root || !root.snapshot) {
      return;
    }

    delete root.snapshot[role];
    root.savedAt = Date.now();
    writeRaw(root);
  }

  function meta() {
    const root = readRaw();

    if (!root) {
      return null;
    }

    return {
      month: root.month,
      savedAt: Number(root.savedAt || 0),
      ageMs: Date.now() - Number(root.savedAt || 0)
    };
  }

  window.ShiftMateCache = {
    get,
    set,
    merge,
    invalidate,
    meta
  };
})();
