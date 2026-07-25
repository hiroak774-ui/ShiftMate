(() => {
  'use strict';
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  window.ShiftMateMotion = {
    enter() {
      if (reduced) {
        document.documentElement.classList.add('sm-page-ready');
        return;
      }
      requestAnimationFrame(() => document.documentElement.classList.add('sm-page-ready'));
    },
    leave(callback) {
      if (reduced) {
        callback();
        return;
      }
      document.documentElement.classList.add('sm-page-leaving');
      window.setTimeout(callback, 150);
    },
    markRoleSwitch(target) {
      sessionStorage.setItem('shiftmate_transition', 'role-switch');
      sessionStorage.setItem('shiftmate_transition_target', target);
    },
    consumeTransition() {
      const value = sessionStorage.getItem('shiftmate_transition') || '';
      sessionStorage.removeItem('shiftmate_transition');
      sessionStorage.removeItem('shiftmate_transition_target');
      return value;
    },
    peekTransition() {
      return sessionStorage.getItem('shiftmate_transition') || '';
    }
  };

  document.addEventListener('DOMContentLoaded', () => window.ShiftMateMotion.enter());
})();
