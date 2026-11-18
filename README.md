# DHY CLASSIFIED DATABASE

DHY (Dongmin Hates You) 세계관의 극비 수사 기록 전산망. 모든 인물·기관·사건 정보는 **가상 설정**이며, 창작자가 제공하거나 승인한 내용만 초기 데이터에 포함한다.

## 현재 구현

- Cloudflare Worker 기반 Next 호환 프론트엔드와 서버 API
- D1 영구 저장: 사용자, 세션, 인물/조직/사건 등 기록, 관계, 이력, 접속 기록, 설정
- R2 비공개 저장: 사진과 첨부파일, 기관 로고
- PBKDF2-SHA256(310,000회, 개별 무작위 솔트) 비밀번호 해시, 서버 세션(8시간), HttpOnly/Secure/SameSite 쿠키, 로그인 실패 제한, 접근 로그
- 서버에서 보안등급별 기록·문서 문단·첨부파일·장보미 비밀 페이지 접근 제어
- 상황실의 DB 연동 통계, 통합 검색, 인물 및 각 업무 모듈의 기록 등록/수정/삭제, 관계도, 관리자 계정 및 분류 체계 관리
- JSON 기록/관계 가져오기·내보내기

## 최초 접속

사이트는 소유자 전용 비공개 Site로 게시한다. 최초 접속 시 창작자가 관리자 아이디와 12자 이상의 비밀번호를 직접 정한다. 이 계정은 기술 운영 계정이며, 세계관 속 이동민 국장 계정으로 자동 간주하지 않는다. 최초 설정이 완료되면 승인된 11명과 기관 관련 기록이 D1에 생성된다. 12번째 인물은 이름이 정해질 때 관리자 화면의 **기록 추가**로 등록한다.

## 로컬 개발

```powershell
npm ci
npm run db:generate
npm run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_bizarre_wraith.sql
npm run dev
```

`node scripts/smoke-test.mjs`는 **빈 로컬 DB**에서만 실행한다. 임시 계정으로 인증, 접근 통제, 초기 데이터, 수정/삭제를 검증한다. 실제 배포 DB에는 연결하지 않는다.

## Cloudflare 배포 검증

`npm run build`만으로 배포 완료를 판단하지 않는다. GitHub에서 **프로젝트 루트**를 빌드하고 생성된 `dist/server/index.js`를 Worker 진입점으로, `dist/client`를 정적 자산으로 배포해야 한다. 원본 `app/page.tsx`를 Worker 스크립트로 직접 올리거나 `dist/server/index.js`만 단독 업로드하면 App Router 모듈 구성이 누락된다.

```powershell
npm ci
npm run build
npm run test:worker
npm run deploy:cloudflare
npm run test:live -- https://dhy.dongmin8109.workers.dev
```

`test:worker`는 격리된 로컬 Worker를 실행하여 페이지 기본 export, `/api/session`, D1 초기 계정 생성, R2 파일 왕복을 실제 HTTP 요청으로 확인한다. `deploy:cloudflare`는 빌드 결과의 Worker 진입점과 기존 운영 D1/R2 바인딩을 확인한 뒤 `dist/server/wrangler.json`을 명시하여 배포한다. Cloudflare GitHub 설정의 배포 명령을 `npm run deploy:cloudflare`로 변경해야 한다. `test:live`는 공개 배포 주소의 페이지와 API 응답을 확인한다. 운영 D1 데이터와 R2 파일을 초기화하거나 삭제하지 않는다. `node_modules.zip`, `node_modules`, `.wrangler`, `dist`는 GitHub 소스 업로드 대상이 아니다.

## 데이터 원칙

세계관 확정 정보는 [CANON.md](CANON.md)에 기록한다. 인물 사진은 현재 UI에서 `사진 기밀`로 표시한다. 창작자가 새로 제공한 박소민 사진 원본은 `pending-media/park.png`에 보관했으며 아직 공개 화면이나 DB에는 연결하지 않았다. 사건 세부 내용, 위험등급 분류 등 미제공 항목은 빈 값 또는 `미확인`으로 둔다. 관리번호는 세계관 내용이 아닌 전산 관리용 식별자다.

## 운영 참고

- JSON 내보내기는 첨부파일 **목록**을 포함하지만 R2 파일 원본 바이트는 포함하지 않는다. 파일 원본의 별도 백업이 필요하다.
- 관계도는 최근 기록 또는 검색 결과 100개와 연결된 기록을 서버에서 조회해 표시한다. 대규모 데이터에서는 검색어로 범위를 좁혀 탐색한다.
- 관리자 삭제는 소프트 삭제이며 수정 전 내용은 이력 테이블에 보존된다.
- 비밀 페이지 기준은 L7 이상이다. 공식 보안등급 명칭은 관리자 화면에서 변경할 수 있다.
