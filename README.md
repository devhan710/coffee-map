# 아바라

카페에 가기 전에 후기를 뒤치지 않고, 그 카페 대표 메뉴를 한 화면에서 보는 서비스.

## 스택

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS 4

## 실행

```bash
npm install
npm run dev
```

[http://localhost:3000](http://localhost:3000) 에서 확인합니다.

환경 변수가 필요하면 `.env.example`을 복사해 `.env.local`을 만듭니다. 검색은 로컬 JSON만으로 되고, 지도는 `NEXT_PUBLIC_NAVER_MAP_CLIENT_ID`가 필요합니다. NCP 콘솔 Web 서비스 URL은 포트 없이 `http://localhost`만 등록하세요.
