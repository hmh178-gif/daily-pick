# 오늘 하루, 어디서 뭐 할까 🌤️

주소와 시간을 입력하면 그 지역의 날씨를 조회해 **오늘 할 만한 활동**과
**반경 3km 내 갈 만한 곳**(공원·관광지·문화시설·레포츠·카페·맛집)을 추천하는
단일 페이지 웹앱입니다.

- 기상청 단기예보 API
- 카카오 로컬 API (주소·키워드·카테고리 검색)
- 한국관광공사 TourAPI
- 지도: OpenStreetMap / 카카오맵

## 보안 설계 — 왜 프록시를 쓰나

이 앱은 정적 페이지지만, API 키를 **브라우저에 절대 노출하지 않도록** 설계했습니다.
브라우저는 같은 도메인의 `/api/*`만 호출하고, 실제 키는
**Netlify Functions(서버) 환경변수**에만 존재합니다.

```
브라우저(index.html)
      │  fetch("/api/kakao?..."), "/api/vilage?...", "/api/tour?..."
      ▼
Netlify Functions (서버, 키 보관)
      │  Authorization: KakaoAK <KAKAO_REST_KEY>
      │  ?serviceKey=<DATA_GO_KR_KEY>
      ▼
카카오 로컬 API · 기상청 API · TourAPI
```

순수 클라이언트 코드에서는 어떤 방식으로도 키를 숨길 수 없기 때문에,
키가 필요한 호출을 서버 함수가 대신 수행하는 구조를 택했습니다.
또한 함수는 **정해진 엔드포인트만** 대신 호출하도록 화이트리스트를 두어
오픈 프록시로 악용되는 것을 막았습니다.

## 폴더 구조

```
.
├─ public/
│   └─ index.html            # 프런트엔드 (키 없음)
├─ netlify/
│   └─ functions/
│       ├─ kakao.js          # 카카오 주소/키워드/카테고리 프록시
│       ├─ vilage.js         # 기상청 단기예보 프록시
│       └─ tour.js           # 한국관광공사 TourAPI 프록시
├─ netlify.toml              # 빌드/배포 설정 + /api 리다이렉트
├─ .env.example              # 환경변수 형식 예시 (실제 키 없음)
├─ .gitignore
└─ package.json
```

## 로컬 실행

Node 18 이상이 필요합니다.

```bash
# 1) Netlify CLI 설치 (최초 1회)
npm install -g netlify-cli

# 2) 환경변수 파일 준비
cp .env.example .env
#   .env 를 열어 실제 키를 채웁니다. (.env 는 커밋되지 않습니다)

# 3) 로컬 개발 서버 실행 (함수 + /api 리다이렉트까지 그대로 동작)
netlify dev
```

브라우저에서 표시된 로컬 주소(예: `http://localhost:8888`)로 접속합니다.

## 배포 (Netlify)

1. 이 저장소를 GitHub에 올립니다. (`.env` 는 `.gitignore` 로 제외됨)
2. Netlify에서 **Add new site → Import from GitHub** 로 이 저장소를 연결합니다.
   빌드 설정은 `netlify.toml` 이 자동으로 적용합니다.
3. **Site settings → Environment variables** 에 아래 두 값을 등록합니다.
   - `KAKAO_REST_KEY`
   - `DATA_GO_KR_KEY`
4. 배포 후 사이트 주소로 접속해 동작을 확인합니다.

> 환경변수를 추가/변경한 뒤에는 재배포(또는 "Clear cache and deploy")를 해야
> 함수에 반영됩니다.

## 환경변수

| 이름 | 용도 |
|------|------|
| `KAKAO_REST_KEY` | 카카오 로컬 API REST 키 |
| `DATA_GO_KR_KEY` | 공공데이터포털 키 (기상청 + TourAPI 공용) |

`DATA_GO_KR_KEY` 는 공공데이터포털에서 재발급 시 제공되는 **Decoding 키**를
넣는 것을 권장합니다. (함수가 인코딩을 자동 판별해 처리합니다.)
