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
    style.textContent = `
      #confirmedPage .confirmed-native-table .total-col{min-width:78px;white-space:nowrap}
      #confirmedPage .confirmed-native-table td.sm-open-shift{background:#fff8ef!important;color:#8d5717!important;font-weight:900}
      #confirmedPage .confirmed-native-table td.sm-close-shift{background:#f7f5ff!important;color:#5f4d98!important;font-weight:900}
      #confirmedPage .confirmed-native-table td.sm-short-shift{background:#d9cef0!important;color:#493775!important;font-weight:900}
      #confirmedPage .confirmed-native-table td.requested-off{background:#343a38!important;color:#fff!important;font-weight:900}
      #confirmedPage .confirmed-native-table td.off{background:#eef1f0!important;color:#68746f!important;font-weight:900}
      #confirmedPage .confirmed-native-table td.paid{background:#e8f7f1!important;color:#2f7d67!important;font-weight:900}
    `;
    document.head.appendChild(style);

    const patternList = () => {
      try {
        return typeof patterns !== 'undefined' && Array.isArray(patterns) ? patterns : [];
      } catch (_) {
        return [];
      }
    };

    const patternForCode = code => {
      const normalized = String(code || '').trim().toUpperCase();
      return patternList().find(item => String(item?.code || '').trim().toUpperCase() === normalized);
    };

    const hoursForCode = code => {
      const pattern = patternForCode(code);
      if (!pattern?.workingTime) return 0;
      const [h, m] = String(pattern.workingTime).split(':').map(Number);
      return (h || 0) + (m || 0) / 60;
    };

    const applyAdminColorRule = (cell, code) => {
      cell.classList.remove('sm-open-shift', 'sm-close-shift', 'sm-short-shift');
      const normalized = String(code || '').trim().toUpperCase();
      if (!normalized || ['休', '希', '有', '休館', '○'].includes(normalized)) return;

      if (normalized === 'G' || normalized === 'H') {
        cell.classList.add('sm-short-shift');
        return;
      }

      const pattern = patternForCode(normalized);
      const category = String(pattern?.category || pattern?.role || '').trim();
      if (category.includes('オープン')) {
        cell.classList.add('sm-open-shift');
      } else if (category.includes('クローズ')) {
        cell.classList.add('sm-close-shift');
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
          const code = String(cell.textContent || '').trim();
          applyAdminColorRule(cell, code);
          if (cell.classList.contains('closed')) return;
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
