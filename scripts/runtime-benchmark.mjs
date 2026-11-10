import { chromium, expect } from "@playwright/test";
import { writeFileSync } from "node:fs";
const browser = await chromium.launch({ headless: true });
const results = [];
for (let round = 0; round < 4; round++)
  for (const runtime of round % 2 ? ["redact", "react"] : ["react", "redact"])
    for (const workload of ["Home ratio", "Compare"]) {
      const port = runtime === "react" ? 4201 : 4202;
      const context = await browser.newContext({
        viewport: { width: 1440, height: 900 },
        reducedMotion: "reduce",
      });
      const page = await context.newPage();
      await page.addInitScript(() => {
        localStorage.setItem("PARAGLIDE_LOCALE", "en");
        localStorage.setItem("bt-theme", "light");
        window.__events = [];
        window.__tasks = [];
        new PerformanceObserver((l) =>
          window.__events.push(
            ...l.getEntries().map((e) => ({ duration: e.duration, id: e.interactionId })),
          ),
        ).observe({ type: "event", buffered: true, durationThreshold: 16 });
        new PerformanceObserver((l) =>
          window.__tasks.push(...l.getEntries().map((e) => e.duration)),
        ).observe({ type: "longtask", buffered: true });
      });
      await page.goto(`http://localhost:${port}/`);
      await page.getByRole("tab", { name: workload, exact: true }).click();
      await expect(page.getByRole("tabpanel", { name: workload, exact: true })).toBeVisible();
      if (workload === "Home ratio")
        await expect(
          page.getByRole("tabpanel", { name: workload }).locator("svg").first(),
        ).toBeVisible();
      const input = page.getByLabel(
        workload === "Compare" ? "B: gross annual salary" : "Gross annual salary (€)",
        { exact: true },
      );
      await input.fill("75000");
      await page.waitForTimeout(300);
      await page.evaluate(() => {
        window.__events = [];
        window.__tasks = [];
      });
      for (const value of [
        "80000",
        "95000",
        "65000",
        "120000",
        "75000",
        "85000",
        "90000",
        "78000",
      ]) {
        await input.click();
        await page.keyboard.press("ControlOrMeta+A");
        await page.keyboard.type(value, { delay: 35 });
        await page.keyboard.press("Tab");
        await page.evaluate(
          () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))),
        );
      }
      await page.waitForTimeout(300);
      const metrics = await page.evaluate(() => ({
        events: window.__events,
        longTasks: window.__tasks,
      }));
      const byId = new Map();
      for (const e of metrics.events)
        if (e.id) byId.set(e.id, Math.max(byId.get(e.id) ?? 0, e.duration));
      const durations = [...byId.values()].sort((a, b) => a - b);
      const result = {
        round,
        runtime,
        workload,
        observedInteractions: durations.length,
        p95: durations.length ? durations[Math.ceil(durations.length * 0.95) - 1] : null,
        max: durations.at(-1) ?? null,
        longTasks: metrics.longTasks.length,
        longTaskMax: Math.max(0, ...metrics.longTasks),
      };
      results.push(result);
      console.log(JSON.stringify(result));
      await context.close();
    }
await browser.close();
writeFileSync(
  "/tmp/redact-runtime-benchmark.json",
  JSON.stringify(
    {
      description:
        "Bordertax production builds, same checkout and dependencies; Chromium desktop, 8 salary edits each; 4 alternating rounds; Event Timing threshold 16ms, lab measurements only",
      results,
    },
    null,
    2,
  ),
);
