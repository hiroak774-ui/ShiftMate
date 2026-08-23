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

  function installAdminShiftEnhancements() {
    if (!document.querySelector('#table')) return;

    const style = document.createElement('style');
    style.id = 'shiftmate-admin-shift-enhancements';
    style.textContent = `
      .cell.closeShift{background:#f7f5ff!important;color:#5f4d98!important}
      .cell.shortShift{background:#e9e3f8!important;color:#514084!important;font-weight:900}
      .cell.edit.shortShift:hover{background:#dfd7f4!important}
      .timeRow.shortShift{background:#f3f0fb!important}
      .timeRow.shortShift .timeCode,
      .timeRow.shortShift .timeCategory{background:#d8cff1!important;color:#514084!important}
    `;
    document.head.appendChild(style);

    function markShortShiftElements(root = document) {
      root.querySelectorAll('#table .cell.edit[data-k]').forEach(cell => {
        const code = String(cell.textContent || '').trim().toUpperCase();
        cell.classList.toggle('shortShift', code === 'G' || code === 'H');
      });
      root.querySelectorAll('#timeGrid .timeRow').forEach(row => {
        const code = String(row.querySelector('.timeCode')?.textContent || '').trim().toUpperCase();
        row.classList.toggle('shortShift', code === 'G' || code === 'H');
      });
    }

    markShortShiftElements();

    const observer = new MutationObserver(() => markShortShiftElements());
    const table = document.querySelector('#table');
    const timeGrid = document.querySelector('#timeGrid');
    if (table) observer.observe(table, { childList: true, subtree: true });
    if (timeGrid) observer.observe(timeGrid, { childList: true, subtree: true });

    document.addEventListener('click', event => {
      const cell = event.target.closest?.('#table .cell.edit[data-k]');
      if (!cell) return;

      event.preventDefault();
      event.stopImmediatePropagation();

      const day = Number(cell.dataset.day);
      if (typeof isClosedDay === 'function' && isClosedDay(day)) {
        if (typeof say === 'function') say('休館日はシフトを入力できません');
        return;
      }

      const key = cell.dataset.k;
      const current = String(draftShift?.[key] || '');
      const next = current === String(selectedShift ?? '') ? '' : String(selectedShift ?? '');
      draftShift[key] = next;

      if (typeof setShiftDirty === 'function') setShiftDirty(true);
      if (typeof table === 'function') table();
      if (typeof pub === 'function') pub();
    }, true);

    if (typeof window.createShiftShareCanvas === 'function') {
      window.createShiftShareCanvas = function createShiftShareCanvas() {
        const days = daysInMonth(), members = shiftTablePeople();
        const roleW = 44, nameW = 166, dayW = 39, totalW = 78, rowH = 64, headerH = 64;
        const mainW = roleW + nameW + days * dayW + totalW;
        const padX = 28, padTop = 24, padBottom = 24, titleH = 72, guideGap = 18, guideH = 160;
        const mainH = headerH + members.length * rowH;
        const width = padX * 2 + mainW;
        const height = padTop + titleH + mainH + guideGap + guideH + padBottom;
        const scale = Math.min(2, window.devicePixelRatio || 1), canvas = document.createElement('canvas');
        canvas.width = width * scale; canvas.height = height * scale;
        const ctx = canvas.getContext('2d'); ctx.scale(scale, scale);
        const holidays = monthlyDateSet('holidays'), closedDays = monthlyDateSet('closedDays');
        const x0 = padX, y0 = padTop + titleH;

        const color = {
          bg:'#f7fbf9', paper:'#ffffff', ink:'#26332f', sub:'#64736e',
          mint:'#63c7ad', mintDark:'#2f9d82', mintPale:'#e9f7f2',
          line:'#9dafaa', lineSoft:'#cbd8d4', stripe:'#f8faf9',
          sunday:'#fff0f1', sundayInk:'#cf5862', saturday:'#eef5ff', saturdayInk:'#587dab',
          closed:'#e95763', closedDark:'#bf3f4a'
        };

        function rect(x,y,w,h,fill,stroke=color.line,lineWidth=1){
          ctx.fillStyle=fill; ctx.fillRect(x,y,w,h);
          if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lineWidth;ctx.strokeRect(x,y,w,h)}
        }
        function text(t,x,y,size=10,weight=700,fill=color.ink,align='center'){
          ctx.fillStyle=fill;
          ctx.font=`${weight} ${size}px -apple-system,BlinkMacSystemFont,"Segoe UI","Yu Gothic",sans-serif`;
          ctx.textAlign=align;ctx.textBaseline='middle';ctx.fillText(String(t??''),x,y);
        }
        function cellColor(code){
          if(code==='希')return ['#313735','#fff'];
          if(code==='休')return ['#ecefee','#303735'];
          if(code==='有')return ['#dff2ea','#2f6f5c'];
          const normalized=String(code||'').trim().toUpperCase();
          const p=patternByCode(code),cat=String(p?.category||'');
          if(cat==='オープン')return ['#fde5d9','#8b4a2f'];
          if(cat==='クローズ'){
            if(normalized==='G'||normalized==='H')return ['#d8cff1','#514084'];
            return ['#e4dfff','#5f4d98'];
          }
          return ['#fff','#28322f'];
        }
        function durationText(value){
          if(value===null||value===undefined||value==='')return '—';
          const n=Number(value);
          return Number.isFinite(n)?`${n%1?n.toFixed(1):n}時間`:String(value);
        }
        function dateLabel(value){
          const parts=String(value||'').split('-');
          return parts.length===3?`${Number(parts[1])}月${Number(parts[2])}日`:String(value||'');
        }

        ctx.fillStyle=color.bg;ctx.fillRect(0,0,width,height);
        rect(x0,padTop,mainW,titleH-10,color.paper,null);
        rect(x0,padTop,8,titleH-10,color.mint,null);
        text(`${year}年 ${month+1}月`,x0+24,padTop+24,17,850,color.mintDark,'left');
        text('勤務シフト表',x0+24,padTop+49,25,900,color.ink,'left');
        text('ShiftMate',x0+mainW-12,padTop+31,16,850,color.mintDark,'right');
        text('確定シフト',x0+mainW-12,padTop+51,10,750,color.sub,'right');

        const headerY=y0;
        rect(x0,headerY,roleW,headerH,color.mintPale,color.line);
        text('役職',x0+roleW/2,headerY+headerH/2,10,850);
        rect(x0+roleW,headerY,nameW,headerH,color.mintPale,color.line);
        text('スタッフ名',x0+roleW+nameW/2,headerY+headerH/2,11,850);

        for(let d=1;d<=days;d++){
          const x=x0+roleW+nameW+(d-1)*dayW,wd=new Date(year,month,d).getDay(),key=dateKey(d);
          const closed=closedDays.has(key),holiday=holidays.has(key);
          const fill=closed?color.closed:holiday||wd===0?color.sunday:wd===6?color.saturday:color.mintPale;
          const ink=closed?'#fff':holiday||wd===0?color.sundayInk:wd===6?color.saturdayInk:color.ink;
          rect(x,headerY,dayW,headerH,fill,color.line);
          text(d,x+dayW/2,headerY+21,13,900,ink);
          text(closed?'休館':DAY[wd],x+dayW/2,headerY+45,10,850,ink);
        }

        const totalX=x0+roleW+nameW+days*dayW;
        rect(totalX,headerY,totalW,headerH,color.mintPale,color.line);
        text('勤務日数',totalX+totalW/2,headerY+21,9,850);
        text('勤務時間',totalX+totalW/2,headerY+44,9,850);

        members.forEach((p,i)=>{
          const y=headerY+headerH+i*rowH;
          const base=color.paper;
          rect(x0,y,roleW,rowH,base,color.line);
          text(p.type==='insured'?'社保':p.newcomer?'新人':'',x0+roleW/2,y+rowH/2,9,850,color.ink);
          rect(x0+roleW,y,nameW,rowH,base,color.line);
          text(p.name,x0+roleW+12,y+rowH/2,18,900,color.ink,'left');

          let count=0,hours=0;
          for(let d=1;d<=days;d++){
            const x=x0+roleW+nameW+(d-1)*dayW,key=dateKey(d),closed=closedDays.has(key),code=draftShift[`${p.id}-${d}`]||'';
            if(closed)continue;
            const [fill,ink]=cellColor(code);
            rect(x,y,dayW,rowH,fill,color.lineSoft);
            text(code,x+dayW/2,y+rowH/2,20,900,ink);
            if(code&&!['休','希','有','○'].includes(code)){count++;hours+=hoursForCode(code)}
          }
          rect(totalX,y,totalW,rowH,base,color.line);
          text(`${count}日`,totalX+totalW/2,y+20,11,850);
          text(`${hours%1?hours.toFixed(1):hours}h`,totalX+totalW/2,y+42,10,750,color.sub);
        });

        closedDays.forEach(key=>{
          const d=Number(String(key).slice(-2));
          if(!d||d>days||!members.length)return;
          const x=x0+roleW+nameW+(d-1)*dayW,y=headerY+headerH,h=members.length*rowH;
          rect(x,y,dayW,h,color.closed,color.closedDark);
          const chars=['休','館','日'],gap=Math.min(23,Math.max(16,h/5)),center=y+h/2;
          chars.forEach((ch,i)=>text(ch,x+dayW/2,center+(i-1)*gap,15,900,'#fff'));
        });

        const guideY=headerY+mainH+guideGap,sectionGap=10,sectionW=(mainW-sectionGap*3)/4,boxH=guideH;
        function simpleTable(x,headers,rows,widths){
          const headerHeight=24,rowHeight=Math.min(20,(boxH-headerHeight)/Math.max(rows.length,1));
          let cx=x;
          headers.forEach((h,i)=>{const w=sectionW*widths[i];rect(cx,guideY,w,headerHeight,color.mintPale,color.lineSoft);text(h,cx+w/2,guideY+headerHeight/2,7.5,850);cx+=w});
          rows.forEach((row,ri)=>{let xx=x;row.forEach((value,i)=>{const w=sectionW*widths[i],yy=guideY+headerHeight+ri*rowHeight;rect(xx,yy,w,rowHeight,ri%2?color.stripe:color.paper,color.lineSoft);text(value,xx+w/2,yy+rowHeight/2,7.5,i===0?850:700);xx+=w})});
        }
        function titledList(x,title,rows){
          rect(x,guideY,sectionW,boxH,color.paper,color.lineSoft);
          rect(x,guideY,sectionW,24,color.mintPale,color.lineSoft);
          text(title,x+sectionW/2,guideY+12,8.5,850);
          const rowHeight=20;
          rows.forEach((r,i)=>{const yy=guideY+24+i*rowHeight;if(yy+rowHeight>guideY+boxH)return;rect(x,yy,sectionW,rowHeight,i%2?color.stripe:color.paper,color.lineSoft);text(r[0],x+8,yy+rowHeight/2,8,850,color.ink,'left');text(r[1],x+sectionW-8,yy+rowHeight/2,7.5,700,color.sub,'right')});
        }
        function patternRows(codes){return shiftPatterns.filter(p=>codes.includes(String(p.code||''))).map(p=>[
          p.code,
          `${p.startTime||'—'}〜${p.endTime||'—'}`,
          durationText(p.workingTime!==undefined?p.workingTime:hoursForCode(p.code)),
          durationText(p.breakTime!==undefined?p.breakTime:p.breakHours)
        ])}

        const holidayRows=[];
        (monthlySetting?.holidays||[]).forEach(v=>holidayRows.push(['祝日',dateLabel(v)]));
        (monthlySetting?.closedDays||[]).forEach(v=>holidayRows.push(['休館日',dateLabel(v)]));
        if(!holidayRows.length)holidayRows.push(['—','なし']);

        titledList(x0,'祝日・休館日',holidayRows);
        simpleTable(x0+sectionW+sectionGap,['勤務区分','時間','労働時間','休憩時間'],patternRows('ABCDEF'),[.18,.34,.24,.24]);
        simpleTable(x0+(sectionW+sectionGap)*2,['勤務区分','時間','労働時間','休憩時間'],patternRows('GHI'),[.18,.34,.24,.24]);
        titledList(x0+(sectionW+sectionGap)*3,'休み表',[['休','休日'],['希','希望休'],['有','有給']]);

        text('ShiftMate',x0,height-9,9,700,color.sub,'left');
        return canvas;
      };
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    window.ShiftMateMotion.enter();
    installAdminShiftEnhancements();
  });
})();
