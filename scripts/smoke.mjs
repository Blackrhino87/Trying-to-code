/* Real-browser smoke test at iPhone size: log a session, hard-reload the
   page (the force-close-Safari case), and confirm the data is still there.
   jsdom can't tell us this — it has no layout, no storage persistence
   across page loads, and no service worker. */
import { chromium, devices } from "playwright";

const BASE = process.env.SMOKE_URL || "http://localhost:4173";
const errors = [];

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
});
const context = await browser.newContext({ ...devices["iPhone 13"] });
const page = await context.newPage();

page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
page.on("console", (m) => m.type() === "error" && errors.push("console: " + m.text()));

const check = (name, ok, extra = "") => {
  console.log(`${ok ? "  ✓" : "  ✗ FAIL:"} ${name}${ok || !extra ? "" : " — " + extra}`);
  if (!ok) process.exitCode = 1;
};

/* isVisible() samples the DOM once, which races React's re-render.
   Wait for the element instead. */
const visible = (locator) =>
  locator
    .first()
    .waitFor({ state: "visible", timeout: 5000 })
    .then(() => true)
    .catch(() => false);

await page.goto(BASE, { waitUntil: "networkidle" });

check("app renders", await visible(page.getByRole("heading")));
check("week strip present", (await page.getByText("Mon", { exact: true }).count()) > 0);

// Log a Session A workout
await page.getByRole("button", { name: "Session A" }).click();
const nums = page.locator("input[type=number]");
await nums.nth(0).fill("32.5");
await nums.nth(1).fill("5");
await nums.nth(2).fill("8");
await page.getByRole("button", { name: "7", exact: true }).first().click();
await page.locator('input[placeholder="65"]').fill("68");
check("session load shown (7 × 68)", await visible(page.getByText("476")));
await page.getByRole("button", { name: "Log session" }).click();
await page.waitForTimeout(300);

const afterSave = await page.evaluate(() => localStorage.getItem("fight-camp-v1"));
check("written to localStorage", JSON.parse(afterSave).sessions.length === 1);

// Force-close and reopen
await page.reload({ waitUntil: "networkidle" });
await page.getByRole("button", { name: "Session A" }).click();
check(
  "session survives a reload",
  await visible(page.getByText("Last top set: 32.5kg × 5"))
);

// Charts render for real (Recharts needs actual layout)
await page.getByRole("button", { name: "Progress" }).click();
await page.waitForTimeout(600);
check("progress charts render", (await page.locator("svg.recharts-surface").count()) > 0);

// Nothing overflows the phone viewport
const overflow = await page.evaluate(
  () => document.documentElement.scrollWidth - document.documentElement.clientWidth
);
check("no horizontal overflow on iPhone", overflow <= 0, `${overflow}px wider than the screen`);

await page.getByRole("button", { name: "Program" }).click();
check("program reference renders", await visible(page.getByText("Loading rules")));

// PWA installability
const manifestHref = await page.locator('link[rel="manifest"]').getAttribute("href");
check("manifest linked", Boolean(manifestHref), String(manifestHref));
if (manifestHref) {
  const res = await page.request.get(new URL(manifestHref, BASE).href);
  const m = await res.json();
  check("manifest is standalone with icons", m.display === "standalone" && m.icons.length > 0);
}
const appleIcon = await page.locator('link[rel="apple-touch-icon"]').count();
check("apple-touch-icon present", appleIcon === 1);

check("no runtime errors", errors.length === 0, errors.join(" | "));

await browser.close();
console.log(process.exitCode ? "\nSMOKE FAILED" : "\nSmoke test passed");
