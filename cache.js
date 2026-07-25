(() => {
  'use strict';
  const KEY = 'shiftmate_app_snapshot_v2';
  const MAX_AGE_MS = 10 * 60 * 1000;
  function readRaw(){try{const v=sessionStorage.getItem(KEY);return v?JSON.parse(v):null}catch(_){return null}}
  function writeRaw(v){try{sessionStorage.setItem(KEY,JSON.stringify(v));return true}catch(_){return false}}
  function get(month,role,allowStale=false){const r=readRaw();if(!r||r.month!==month||!r.snapshot)return null;const age=Date.now()-Number(r.savedAt||0);if(!allowStale&&age>MAX_AGE_MS)return null;return role?r.snapshot[role]||null:r.snapshot}
  function set(month,snapshot){return writeRaw({month,savedAt:Date.now(),snapshot})}
  function merge(month,patch){const r=readRaw();const current=r&&r.month===month&&r.snapshot?r.snapshot:{};return set(month,{...current,...patch})}
  function invalidate(role){if(!role){sessionStorage.removeItem(KEY);return}const r=readRaw();if(!r||!r.snapshot)return;delete r.snapshot[role];r.savedAt=Date.now();writeRaw(r)}
  function clear(){try{sessionStorage.removeItem(KEY)}catch(_){}}
  function meta(){const r=readRaw();return r?{month:r.month,savedAt:Number(r.savedAt||0),ageMs:Date.now()-Number(r.savedAt||0)}:null}
  window.ShiftMateCache={get,set,merge,invalidate,clear,meta};
})();
