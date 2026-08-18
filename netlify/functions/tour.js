// 한국관광공사 TourAPI(locationBasedList2) 프록시
// serviceKey는 서버 환경변수(DATA_GO_KR_KEY)에서만 붙입니다.

const UPSTREAM =
  "https://apis.data.go.kr/B551011/KorService2/locationBasedList2";

exports.handler = async (event) => {
  return proxyDataGoKr(UPSTREAM, event.queryStringParameters || {});
};

async function proxyDataGoKr(upstream, incoming) {
  const key = process.env.DATA_GO_KR_KEY;
  if (!key) {
    return json(500, { error: "DATA_GO_KR_KEY 환경변수가 설정되지 않았습니다." });
  }

  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(incoming)) {
    if (k === "serviceKey") continue;
    if (v != null && v !== "") usp.append(k, v);
  }

  const alreadyEncoded = /%[0-9A-Fa-f]{2}/.test(key);
  const serviceKey = alreadyEncoded ? key : encodeURIComponent(key);
  const url = `${upstream}?${usp.toString()}&serviceKey=${serviceKey}`;

  try {
    const r = await fetch(url);
    const body = await r.text();
    return {
      statusCode: r.status,
      headers: {
        "content-type": r.headers.get("content-type") || "application/json; charset=utf-8",
        "cache-control": "no-store",
      },
      body,
    };
  } catch (e) {
    return json(502, { error: "TourAPI upstream 호출 실패", detail: String(e) });
  }
}

function json(statusCode, obj) {
  return {
    statusCode,
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify(obj),
  };
}
