/* ============================================================
   2단계: Traccar Client 앱 → 이 함수 → Realtime Database /santas/{id}
   - 화면이 꺼져도 위치를 보내려면 NPC 폰에 'Traccar Client' 앱을 쓰고
     앱의 서버 주소를 이 함수 주소로 넣어요. (Firebase Blaze 요금제 필요)
   - Traccar 앱의 '기기 ID(Device identifier)' = santas.js 의 id (예: santa1)
   - 서버 주소 끝에 ?key=비밀번호 를 붙여요. 비밀번호는 배포할 때 정해요.
   ============================================================ */
const { onRequest } = require('firebase-functions/v2/https');
const { defineString } = require('firebase-functions/params');
const admin = require('firebase-admin');
admin.initializeApp();

const TRACCAR_KEY = defineString('TRACCAR_KEY');
const SANTA_IDS = ['santa1', 'santa2', 'santa3', 'santa4', 'santa5'];   // santas.js 와 똑같이

exports.traccar = onRequest({ region: 'asia-northeast3', cors: false }, async (req, res) => {
  const q = { ...(req.query || {}) };
  if (q.key !== TRACCAR_KEY.value()) { res.status(403).send('bad key'); return; }

  // 옛 방식(OsmAnd): ?id=&lat=&lon=&accuracy=&batt=  /  새 방식: JSON 본문
  let id = q.id || q.deviceid, lat = q.lat, lng = q.lon, acc = q.accuracy, bat = q.batt;
  const b = (req.body && typeof req.body === 'object') ? req.body : {};
  if (b.location && b.location.coords) {
    id = b.device_id || b.deviceId || id;
    lat = b.location.coords.latitude; lng = b.location.coords.longitude; acc = b.location.coords.accuracy;
    if (b.location.battery && b.location.battery.level != null) bat = Math.round(b.location.battery.level * 100);
  }
  lat = Number(lat); lng = Number(lng); acc = Number(acc) || 30;
  if (!SANTA_IDS.includes(id) || !isFinite(lat) || !isFinite(lng)) { res.status(400).send('bad data'); return; }

  const v = { lat: +lat.toFixed(6), lng: +lng.toFixed(6), acc: Math.round(acc), on: true, src: 'traccar', ts: admin.database.ServerValue.TIMESTAMP };
  if (bat != null && isFinite(Number(bat))) v.bat = Math.round(Number(bat));
  await admin.database().ref('santas/' + id).update(v);
  res.status(200).send('ok');
});
