// 카카오 로컬 API 프록시
// 브라우저는 이 함수만 호출하고, 실제 REST 키는 서버 환경변수에만 존재합니다.
// 허용된 3개 엔드포인트만 대신 호출합니다(임의 URL 프록시 금지 = 오픈 프록시 방지).

const ALLOWED = {
  address: "https://dapi.kakao.com/v2/local/search/address.json",
  keyword: "https://dapi.kakao.com/v2/local/search/keyword.json",
  category: "https://dapi.kakao.com/v2/local/search/category.json",
};

exports.handler = async (event) => {
  const params = { ...(event.queryStringParameters || {}) };
  const type = params.type;
  delete params.type;

  const upstream = ALLOWED[type];
  if (!upstream) {
    return json(400, { error: "invalid type", allowed: Object.keys(ALLOWED) });
  }

  const key = process.env.KAKAO_REST_KEY;
  if (!key) {
    return json(500, { error: "KAKAO_REST_KEY 환경변수가 설정되지 않았습니다." });
  }

  const qs = new URLSearchParams(params).toString();
  const url = upstream + (qs ? "?" + qs : "");

  try {
    const r = await fetch(url, {
      headers: { Authorization: "KakaoAK " + key },
    });
    const body = await r.text();
    return {
      statusCode: r.status,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store",
      },
      body,
    };
  } catch (e) {
    return json(502, { error: "카카오 upstream 호출 실패", detail: String(e) });
  }
};

function json(statusCode, obj) {
  return {
    statusCode,
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify(obj),
  };
}
