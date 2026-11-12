import { expect, test } from "@playwright/test";
import { expectNoAxeViolations, seedPreferences } from "./helpers";

test("exports inputs and imports them again", async ({ page }) => {
  await seedPreferences(page, "en", "light");
  await page.goto("/");
  const salary = page.getByLabel("Gross annual salary (€)");
  await salary.fill("85000");

  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export inputs" }).click();
  const file = await download;
  expect(file.suggestedFilename()).toMatch(/^bordertax-inputs-\d{4}\.json$/);
  const path = await file.path();

  await salary.fill("1000");
  await page.getByLabel("Import inputs").setInputFiles(path);
  await expect(salary).toHaveValue("85000");
  await expect(page.getByText(/Loaded the inputs for income year/)).toBeVisible();

  await page.getByLabel("Import inputs").setInputFiles({
    name: "bad.json",
    mimeType: "application/json",
    buffer: Buffer.from("{}"),
  });
  await expect(page.getByText("This is not a file exported from this calculator.")).toBeVisible();
  await expect(salary).toHaveValue("85000");
  await expectNoAxeViolations(page);
});
