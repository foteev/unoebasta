// Native checkbox controls shared by all filter groups.
function filterOption(page, group, value) {
  return page.locator(`[data-multi-filter="${group}"][value="${value}"]`);
}
async function selectFilter(page, group, values = []) {
  const details = page.locator(`[data-multi="${group}"]`);
  if (!(await details.evaluate(el => el.open))) await details.locator('summary').click();
  await filterOption(page, group, 'all').click();
  for (const value of values) await filterOption(page, group, value).click();
  if (await details.evaluate(el => el.open)) await details.locator('summary').click();
}
// The language menu in the header: the site's language and the languages the reader reads.
async function openLangMenu(page) {
  if (await page.locator('#lang-menu').isHidden()) await page.locator('#lang-btn').click();
  await page.locator('#lang-menu').waitFor({ state: 'visible' });
}
async function siteLang(page, lang) {
  await openLangMenu(page);
  await page.locator(`#lang-menu [data-lang="${lang}"]`).click();
  await page.waitForFunction(l => document.documentElement.lang === l && document.querySelector('#lang-cur').textContent === l.toUpperCase(), lang);
  await page.keyboard.press('Escape');
  await page.locator('#lang-menu').waitFor({ state: 'hidden' });
}
async function readLang(page, lang) {
  await openLangMenu(page);
  await page.locator(`#lang-menu [data-readlang="${lang}"]`).click();
}
module.exports = { filterOption, selectFilter, openLangMenu, siteLang, readLang };
