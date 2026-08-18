// 기상청 단기예보(getVilageFcst) 프록시
// serviceKey는 서버 환경변수(DATA_GO_KR_KEY)에서만 붙입니다.

const UPSTREAM =
  "https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst";

exports.handler = async (event) => {
  return proxyDataGoKr(UPSTREAM, event.queryStringParameters || {});
};

async function proxyDataGoKr(upstream, incoming) {
  const key = process.env.DATA_GO_KR_KEY;
  if (!key) {
    return json(500, { error: "DATA_GO_KR_KEY 환경변수가 설정되지 않았습니다." });
  }

  // 클라이언트가 보낸 파라미터를 전달하되, serviceKey는 절대 클라이언트 값으로 받지 않습니다.
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(incoming)) {
    if (k === "serviceKey") continue;
    if (v != null && v !== "") usp.append(k, v);
  }

  // 공공데이터포털 키 인코딩 처리:
  //  - 이미 URL 인코딩된 키(Encoding 키, %XX 포함)면 그대로 붙이고,
  //  - 아니면(Decoding 키) 한 번만 인코딩합니다.
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
    return json(502, { error: "기상청 upstream 호출 실패", detail: String(e) });
  }
}

function json(statusCode, obj) {
  return {
    statusCode,
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify(obj),
  };
}
