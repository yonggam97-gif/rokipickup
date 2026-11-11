/* ============================================================
   미리메리 크리스마스 — 기본 설정 (여기만 고치면 돼요)
   ============================================================ */

/* 행사 정보 */
const EVENT = {
  name: '미리메리 크리스마스',
  place: '서면 · 전포 골목',
  dates: '2026. 12. (날짜 확정 후 수정)',   // ← 행사 날짜 정해지면 바꿔주세요
  instagram: 'https://www.instagram.com/',  // ← 우리 인스타 계정 주소로 바꿔주세요
};

/* Firebase 설정 (실시간 위치·알림 서버)
   Firebase 콘솔 → 프로젝트 설정 → 내 앱(웹) → "SDK 설정 및 구성" 값을 그대로 붙여넣기.
   비워두면 '연습 모드'로 돌아가요 (가짜 산타가 움직이고, 같은 폰/PC 안에서만 알림이 오가요). */
const FIREBASE_CONFIG = {
  apiKey: '',
  authDomain: '',
  databaseURL: '',   // ← Realtime Database 주소 (https://...firebasedatabase.app) 꼭 필요
  projectId: '',
  appId: '',
};

/* 관제실·NPC 로그인 계정 (Firebase 콘솔 → Authentication 에서 만든 이메일)
   진짜 이메일이 아니어도 돼요. database.rules.json 의 이메일과 똑같아야 해요. */
const STAFF_EMAIL = 'staff@mirimerry.app';

/* 지도 그림의 실제 위치 범위 (귀신의집 지도와 같은 그림이라 그대로) */
const GEO_B = { N: 35.1651, S: 35.1437, W: 129.0498, E: 129.0752 };
const GEO_MPX = 0.8894;   /* 지도 1px = 실제 몇 m */

/* 산타 위치 표시 기준 */
const SANTA_LIVE_MS = 3 * 60 * 1000;    /* 3분 안에 받은 위치 = 실시간 */
const SANTA_STALE_MS = 10 * 60 * 1000;  /* 3~10분 = 회색 '마지막 위치', 10분 넘으면 숨김 */

/* 위도·경도 → 지도 그림 위 위치(0~1). 지도 밖이면 null */
function geoToXY(lat, lng) {
  const x = (lng - GEO_B.W) / (GEO_B.E - GEO_B.W), y = (GEO_B.N - lat) / (GEO_B.N - GEO_B.S);
  return (x >= 0 && x <= 1 && y >= 0 && y <= 1) ? { x, y } : null;
}
