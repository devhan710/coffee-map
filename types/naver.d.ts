export {};

declare global {
  interface Window {
    naver: typeof naver;
    navermap_authFailure?: () => void;
  }
}
