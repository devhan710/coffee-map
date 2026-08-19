import { chromium } from "playwright-core";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url));
const assets = path.join(dir, "assets");
const url = "https://vanilla-latte-map.vercel.app/";

await mkdir(assets, { recursive: true });

const browser = await chromium.launch({
  channel: "chrome",
  headless: true,
});

const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  locale: "ko-KR",
  userAgent:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
});

const page = await context.newPage();

async function settle(ms = 2500) {
  await page.waitForTimeout(ms);
}

async function shot(name) {
  await page.screenshot({
    path: path.join(assets, name),
    type: "png",
  });
  console.log("saved", name);
}

await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
await settle(4000);
await shot("01-map.png");

await page.goto(`${url}?cafe=hebe`, {
  waitUntil: "domcontentloaded",
  timeout: 60000,
});
await settle(3500);
await shot("02-cafe.png");

await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
await settle(2500);
const search = page.locator("#cafe-search");
await search.click();
await settle(500);
await search.fill("헤베");
await settle(900);
await shot("03-search.png");

await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
await settle(2500);
const login = page.getByRole("button", { name: "로그인" });
await login.click();
await settle(800);
await shot("04-login.png");

await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
await settle(2500);
const latte = page.getByRole("button", { name: "라떼" });
if (await latte.count()) {
  await latte.click();
  await settle(1400);
  await shot("05-filter.png");
}

await browser.close();
