import { readFileSync } from 'node:fs';
import { sourceUrlKey } from './csv.mjs';

export const SOURCE_REVIEWS = JSON.parse(readFileSync(new URL('../../data/source-reviews.json', import.meta.url), 'utf8')).sources;
export function sourceReview(row, reviews = SOURCE_REVIEWS) {
  return reviews.find(r => r.qid === row.qid && r.lang === (row.lang || 'en') && sourceUrlKey(r.url) === sourceUrlKey(row.url));
}
export function assertSourceScope(rows, reviews = SOURCE_REVIEWS) {
  for (const row of rows) {
    if (!row.url || row.kind === 'none') continue;
    const review = sourceReview(row, reviews);
    if (review && ((review.allowed_kinds && !review.allowed_kinds.includes(row.kind)) || review.excluded_kinds?.includes(row.kind))) {
      throw new Error(`${row.qid}: source review excludes ${row.kind} at ${row.url}: ${review.reason} See docs/link-audit-2026-11-04.md; a maintainer must review new evidence before re-enabling it.`);
    }
  }
}
