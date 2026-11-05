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
module.exports = { filterOption, selectFilter };
