/* ============================================================
   산타요정 캐릭터 설정  ※ 지금은 임시 이름이에요. 캐릭터 정해지면 여기만 바꾸면 돼요.
   id    : 영어/숫자 (한 번 정하면 바꾸지 마세요. NPC 폰과 관제실이 이 값으로 연결돼요)
   name  : 앱에 보이는 이름
   color : 지도 표시 색
   tag   : 한 줄 소개
   desc  : 자세한 소개 (산타 목록에서 보여요)
   ============================================================ */
const SANTAS = [
  { id: 'santa1', name: '루돌프 요정', color: '#D7263D', tag: '빨간 코로 길을 밝히는 요정',      desc: '캐릭터 설정이 정해지면 여기에 소개를 적어주세요.' },
  { id: 'santa2', name: '눈꽃 요정',   color: '#2E86DE', tag: '골목마다 눈꽃을 뿌리는 요정',      desc: '캐릭터 설정이 정해지면 여기에 소개를 적어주세요.' },
  { id: 'santa3', name: '선물 요정',   color: '#1F8A4C', tag: '착한 손님에게 선물을 숨겨두는 요정', desc: '캐릭터 설정이 정해지면 여기에 소개를 적어주세요.' },
  { id: 'santa4', name: '쿠키 요정',   color: '#C77D2B', tag: '달콤한 냄새를 따라다니는 요정',     desc: '캐릭터 설정이 정해지면 여기에 소개를 적어주세요.' },
  { id: 'santa5', name: '종소리 요정', color: '#8E44AD', tag: '딸랑딸랑 종소리로 신호를 주는 요정',  desc: '캐릭터 설정이 정해지면 여기에 소개를 적어주세요.' },
];
const SANTA_BY_ID = Object.fromEntries(SANTAS.map(s => [s.id, s]));

/* 산타 아이콘 (캐릭터 색 동그라미 안에 🎅). grey = 몇 분 전 위치 / 쉬는 중 */
function santaSVG(color, grey, size) {
  size = size || 46;
  const ring = grey ? '#8A8F96' : color, bw = Math.max(2, Math.round(size / 13));
  return `<span class="santaIc" aria-hidden="true" style="display:inline-flex;flex:0 0 auto;align-items:center;justify-content:center;width:${size}px;height:${size}px;border-radius:50%;background:#fff;border:${bw}px solid ${ring};box-sizing:border-box;${grey ? 'filter:grayscale(1);opacity:.85;' : ''}"><span style="font-size:${Math.round(size * 0.58)}px;line-height:1">🎅</span></span>`;
}
/* 이름 뒤 조사: 받침 있으면 a, 없으면 b (예: 요정이 / 산타가) */
function josa(word, a, b) {
  const c = String(word).trim().slice(-1).charCodeAt(0);
  if (c < 0xAC00 || c > 0xD7A3) return word + b;
  return word + (((c - 0xAC00) % 28) ? a : b);
}

/* 크리스마스 장식 방울 아이콘 (제휴 매장 표시) */
function ornSVG(color, star) {
  const id = 'g' + color.replace('#', '') + (star ? 's' : '');
  return `<svg class="orn" viewBox="-24 -34 48 64" aria-hidden="true">
  <defs><radialGradient id="${id}" cx="35%" cy="32%" r="70%"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset=".28" stop-color="${color}"/><stop offset="1" stop-color="${shade(color, -0.45)}"/></radialGradient></defs>
  <ellipse cx="0" cy="27" rx="13" ry="3.5" fill="#000" opacity=".28"/>
  <path d="M-3.5,-27 a3.5,3.5 0 1,1 7,0" fill="none" stroke="#E8C468" stroke-width="2.2"/>
  <rect x="-6.5" y="-26" width="13" height="7" rx="1.6" fill="#E8C468" stroke="#B8902F" stroke-width="1"/>
  <circle cx="0" cy="0" r="20" fill="url(#${id})" stroke="rgba(0,0,0,.25)" stroke-width="1"/>
  <path d="M-19,-3 Q0,6 19,-3" fill="none" stroke="#fff" stroke-opacity=".75" stroke-width="2.4"/>
  <path d="M-17,8 Q0,16 17,8" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="1.8"/>
  ${star ? '<path d="M0,-12 l3.5,7.2 7.9,1.1 -5.7,5.6 1.4,7.9 -7.1,-3.8 -7.1,3.8 1.4,-7.9 -5.7,-5.6 7.9,-1.1z" fill="#FFE17A" stroke="#B8902F" stroke-width="1"/>' : ''}
</svg>`;
}
function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const f = v => Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k);
  return '#' + [f(r), f(g), f(b)].map(v => v.toString(16).padStart(2, '0')).join('');
}
