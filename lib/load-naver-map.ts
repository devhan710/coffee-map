export function loadNaverMapScript(clientId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.naver?.maps) {
      resolve();
      return;
    }

    const existing = document.getElementById("naver-maps-sdk");
    if (existing instanceof HTMLScriptElement) {
      existing.addEventListener(
        "load",
        () => {
          if (window.naver?.maps) resolve();
          else reject(new Error("naver maps missing"));
        },
        { once: true },
      );
      existing.addEventListener("error", () => reject(new Error("script error")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.id = "naver-maps-sdk";
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${encodeURIComponent(clientId)}`;
    script.async = true;
    script.onload = () => {
      if (window.naver?.maps) resolve();
      else reject(new Error("naver maps missing"));
    };
    script.onerror = () => reject(new Error("script error"));
    document.head.appendChild(script);
  });
}
