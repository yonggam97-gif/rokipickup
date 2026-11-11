/* ============================================================
   실시간 서버 연결 (Firebase Realtime Database)
   - 설정(js/config.js)이 비어 있거나 주소에 ?demo 가 있으면 '연습 모드'
     · 연습 모드: 같은 폰/PC 브라우저 안에서만 데이터가 오가요 (localStorage)
   데이터 구조
     /santas/{id}  : { lat, lng, acc, ts, on, bat, hidden, src }
     /alerts/{key} : { title, msg, link, santa, ts }
     /stats/{key}  : { opens, clicks }
   ============================================================ */
const BE = (function () {
  const LIVE = !!(FIREBASE_CONFIG && FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.databaseURL) && !/[?&]demo\b/.test(location.search);
  const SDK = 'https://www.gstatic.com/firebasejs/10.14.1/';
  let db = null, auth = null, offset = 0, readyP = null;

  function loadScript(src) {
    return new Promise((ok, no) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = () => no(new Error('load ' + src)); document.head.appendChild(s); });
  }
  function ready() {
    if (readyP) return readyP;
    readyP = !LIVE ? Promise.resolve() : (async () => {
      await loadScript(SDK + 'firebase-app-compat.js');
      await Promise.all([loadScript(SDK + 'firebase-database-compat.js'), loadScript(SDK + 'firebase-auth-compat.js')]);
      firebase.initializeApp(FIREBASE_CONFIG);
      db = firebase.database(); auth = firebase.auth();
      db.ref('.info/serverTimeOffset').on('value', s => { offset = s.val() || 0; });
    })();
    return readyP;
  }
  const now = () => Date.now() + offset;

  /* ---------- 연습 모드 저장소 ---------- */
  const DK = 'xmas_demo_v1', subs = new Set();
  const dRead = () => { try { return JSON.parse(localStorage.getItem(DK)) || {}; } catch (e) { return {}; } };
  const dWrite = (fn) => { const d = dRead(); d.santas = d.santas || {}; d.alerts = d.alerts || {}; d.stats = d.stats || {}; fn(d); try { localStorage.setItem(DK, JSON.stringify(d)); } catch (e) {} subs.forEach(f => f(d)); };
  if (!LIVE) window.addEventListener('storage', e => { if (e.key === DK) { const d = dRead(); subs.forEach(f => f(d)); } });
  const dSub = (pick, cb) => { const f = d => cb(pick(d) || {}); subs.add(f); f(dRead()); return () => subs.delete(f); };
  let dUser = null; try { dUser = sessionStorage.getItem('xmas_demo_user'); } catch (e) {}
  const authCbs = new Set();

  return {
    LIVE, ready, now,

    /* 산타 위치 전체 구독 */
    onSantas(cb) {
      if (!LIVE) return dSub(d => d.santas, cb);
      const r = db.ref('santas'); const h = r.on('value', s => cb(s.val() || {})); return () => r.off('value', h);
    },
    /* 최근 알림 구독 (최신 limit개) */
    onAlerts(cb, limit = 20) {
      const sortObj = o => Object.entries(o || {}).map(([k, v]) => ({ key: k, ...v })).sort((a, b) => (b.ts || 0) - (a.ts || 0)).slice(0, limit);
      if (!LIVE) return dSub(d => d.alerts, o => cb(sortObj(o)));
      const r = db.ref('alerts').orderByChild('ts').limitToLast(limit); const h = r.on('value', s => cb(sortObj(s.val()))); return () => r.off('value', h);
    },
    onStats(cb) {
      if (!LIVE) return dSub(d => d.stats, cb);
      const r = db.ref('stats'); const h = r.on('value', s => cb(s.val() || {})); return () => r.off('value', h);
    },
    /* 손님 쪽: 알림 열어봄/인스타 누름 숫자 +1 */
    bump(key, field) {
      if (!LIVE) { dWrite(d => { const s = d.stats[key] = d.stats[key] || {}; s[field] = (s[field] || 0) + 1; }); return; }
      db.ref(`stats/${key}/${field}`).set(firebase.database.ServerValue.increment(1)).catch(() => {});
    },

    /* ---------- 관제실 · NPC (로그인 필요) ---------- */
    onAuth(cb) {
      if (!LIVE) { authCbs.add(cb); cb(dUser ? { email: dUser } : null); return; }
      auth.onAuthStateChanged(u => cb(u));
    },
    async login(email, pw) {
      if (!LIVE) { dUser = email || 'demo'; try { sessionStorage.setItem('xmas_demo_user', dUser); } catch (e) {} authCbs.forEach(f => f({ email: dUser })); return; }
      await auth.signInWithEmailAndPassword(email, pw);
    },
    async logout() {
      if (!LIVE) { dUser = null; try { sessionStorage.removeItem('xmas_demo_user'); } catch (e) {} authCbs.forEach(f => f(null)); return; }
      await auth.signOut();
    },
    /* NPC: 내 위치 보내기 */
    sendPos(id, p) {
      const v = { lat: +p.lat.toFixed(6), lng: +p.lng.toFixed(6), acc: Math.round(p.acc), on: true, src: 'web' };
      if (p.bat != null) v.bat = p.bat;
      if (!LIVE) { dWrite(d => { d.santas[id] = { ...(d.santas[id] || {}), ...v, ts: Date.now() }; }); return Promise.resolve(); }
      return db.ref('santas/' + id).update({ ...v, ts: firebase.database.ServerValue.TIMESTAMP });
    },
    /* NPC: 창 닫히면 자동으로 '꺼짐' 표시 */
    armDisconnect(id) { if (LIVE) db.ref('santas/' + id).onDisconnect().update({ on: false }); },
    cancelDisconnect(id) { if (LIVE) db.ref('santas/' + id).onDisconnect().cancel(); },
    setOff(id) {
      if (!LIVE) { dWrite(d => { if (d.santas[id]) d.santas[id].on = false; }); return Promise.resolve(); }
      return db.ref('santas/' + id).update({ on: false });
    },
    /* 관제실: 손님 지도에서 숨기기/보이기 */
    setHidden(id, hidden) {
      if (!LIVE) { dWrite(d => { d.santas[id] = { ...(d.santas[id] || {}), hidden }; }); return Promise.resolve(); }
      return db.ref('santas/' + id).update({ hidden });
    },
    /* 관제실: 알림 보내기 */
    sendAlert(a) {
      const v = { title: a.title, msg: a.msg || '', link: a.link || '', santa: a.santa || '' };
      if (!LIVE) { const k = 'd' + Date.now().toString(36); dWrite(d => { d.alerts[k] = { ...v, ts: Date.now() }; }); return Promise.resolve(k); }
      const r = db.ref('alerts').push(); return r.set({ ...v, ts: firebase.database.ServerValue.TIMESTAMP }).then(() => r.key);
    },
    deleteAlert(key) {
      if (!LIVE) { dWrite(d => { delete d.alerts[key]; delete d.stats[key]; }); return Promise.resolve(); }
      return db.ref().update({ ['alerts/' + key]: null, ['stats/' + key]: null });
    },
    demoReset() { try { localStorage.removeItem(DK); } catch (e) {} subs.forEach(f => f({})); },
  };
})();

/* 'n분 전' 표시 */
function agoText(ms) {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 10) return '방금';
  if (s < 60) return s + '초 전';
  const m = Math.floor(s / 60); if (m < 60) return m + '분 전';
  const h = Math.floor(m / 60); if (h < 24) return h + '시간 전';
  return Math.floor(h / 24) + '일 전';
}
/* 산타 상태: live / stale / off */
function santaState(v, now) {
  if (!v || !v.ts || v.lat == null) return 'off';
  const age = now - v.ts;
  if (v.on === false && age > 60 * 1000) return 'off';
  if (age <= SANTA_LIVE_MS && v.on !== false) return 'live';
  if (age <= SANTA_STALE_MS) return 'stale';
  return 'off';
}
function escHTML(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function safeLink(u) { u = String(u || '').trim(); return /^https:\/\//i.test(u) ? u : ''; }
