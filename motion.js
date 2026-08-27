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

  function setupStaffConfirmedHours() {
    const host = document.querySelector('#confirmedPage #confirmedTable');
    if (!host || !document.querySelector('#requestPage')) return;

    const style = document.createElement('style');
    style.textContent = '#confirmedPage .confirmed-native-table .total-col{min-width:78px;white-space:nowrap}';
    document.head.appendChild(style);

    const hoursForCode = code => {
      try {
        const list = typeof patterns !== 'undefined' && Array.isArray(patterns) ? patterns : [];
        const pattern = list.find(item => item?.code === code);
        if (!pattern?.workingTime) return 0;
        const [h, m] = String(pattern.workingTime).split(':').map(Number);
        return (h || 0) + (m || 0) / 60;
      } catch (_) {
        return 0;
      }
    };

    const formatHours = hours => String(Math.round((Number(hours) || 0) * 100) / 100);

    const updateTotals = () => {
      host.querySelectorAll('.confirmed-native-table tbody tr').forEach(row => {
        const cells = [...row.querySelectorAll('td')];
        if (cells.length < 4) return;
        const totalCell = cells[cells.length - 1];
        const dayCells = cells.slice(2, -1);
        let workDays = 0;
        let totalHours = 0;

        dayCells.forEach(cell => {
          if (cell.classList.contains('closed')) return;
          const code = String(cell.textContent || '').trim();
          if (!code || ['休', '希', '有', '休館'].includes(code)) return;
          workDays += 1;
          totalHours += hoursForCode(code);
        });

        const next = `${workDays}日 / ${formatHours(totalHours)}h`;
        if (totalCell.textContent !== next) totalCell.textContent = next;
      });
    };

    const observer = new MutationObserver(updateTotals);
    observer.observe(host, { childList: true, subtree: true });
    updateTotals();
  }

  document.addEventListener('DOMContentLoaded', () => {
    window.ShiftMateMotion.enter();
    setupStaffConfirmedHours();
  });
})();
