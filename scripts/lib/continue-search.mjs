import { dirname, join } from 'node:path';
import { writeJson } from './http.mjs';
import { runSearch } from './search.mjs';
import { LANGS } from './catalog.mjs';
import { PROVIDERS } from './providers.mjs';
import { mergeResearch, importState, saveResearch, buildPlan, candidateFromLead } from './research.mjs';

export const CONTINUE_PROVIDERS = ['clarkesworld', 'escapepod', 'podcastle', 'pseudopod', 'google'];

export async function continueSearch({ catalog, state, statePath, research = catalog.research, researchDir, http,
  langs = LANGS, kind = 'all', limit = 50, providers = CONTINUE_PROVIDERS, qids = [], forms = [], refresh = false,
  registry = PROVIDERS, now = () => new Date().toISOString(), onCheck = () => {}, reportPath = join(dirname(statePath), 'report.json') }) {
  if (!langs.length || new Set(langs).size !== langs.length || langs.some(l => !LANGS.includes(l))) throw new Error('Choose distinct supported languages');
  if (!Number.isInteger(limit) || limit < 1 || limit > 500) throw new Error('Limit must be 1..500 work/language targets in total');
  if (!['all', 'full', 'audio', 'fragment'].includes(kind) || !providers.length || providers.some(p => !registry[p])) throw new Error('Invalid kind or providers');
  mergeResearch(research, state.research);
  const restored = [];
  for (const lead of research.leads.filter(l => l.status === 'candidate' && l.type === 'investigate' && l.target.url && ['full', 'audio', 'fragment'].includes(l.kind))) {
    if (!catalog.works.some(w => w.qid === lead.qid) || Object.values(state.candidates).some(c => c.qid === lead.qid && c.lang === lead.lang && c.url === lead.target.url && (c.requested_kind || c.proposed_kind) === lead.kind)) continue;
    restored.push(candidateFromLead(research, catalog, state, lead.id, { restore: true }).id);
  }
  const start = (state.continuation?.next_language || 0) % langs.length;
  const order = [...langs.slice(start), ...langs.slice(0, start)], paused = new Set(), checks = [];
  const previousCandidates = new Set(Object.keys(state.candidates));
  const report = { version: 1, status: 'running', started_at: now(), languages: langs, kind, limit, providers,
    by_language: {}, paused_sources: [], summary: {}, restored_candidate_ids: restored, new_candidate_ids: [], pending_candidate_ids: [] };
  const save = () => {
    report.summary = Object.values(report.by_language).reduce((a, s) => {
      for (const [key, value] of Object.entries(s)) a[key] = (a[key] || 0) + value;
      return a;
    }, {});
    report.outcomes = checks.reduce((a, c) => (a[c.status] = (a[c.status] || 0) + 1, a), {});
    report.new_candidate_ids = Object.keys(state.candidates).filter(id => !previousCandidates.has(id));
    report.pending_candidate_ids = Object.values(state.candidates).filter(c => c.review.status === 'pending').map(c => c.id);
    state.continuation = { next_language: start, report };
    writeJson(statePath, state); writeJson(reportPath, report);
    if (researchDir) saveResearch(researchDir, research);
  };
  save();
  try {
    let remaining = limit;
    for (let i = 0; i < order.length && remaining; i++) {
      const lang = order[i], quota = Math.ceil(remaining / (order.length - i));
      const summary = await runSearch({ catalog, state, statePath, research, researchDir, http, lang, kind, providers, qids, forms,
        limit: quota, refresh, registry, now, pausedProviders: paused,
        onProviderError: (provider, error) => {
          paused.add(provider);
          report.paused_sources.push({ provider, status: error.code === 'CONFIGURATION_REQUIRED' ? 'configuration_required' : 'unavailable',
            reason: error.message, at: now(), next_action: 'Retry this source on the next invocation; other sources continue.' });
        }, onCheck: c => { checks.push(c); onCheck(c); } });
      report.by_language[lang] = summary; remaining -= summary.works;
      // Candidate URLs/publications belong in the versioned registry, even before approval.
      importState(research, state, catalog, 'continuation checkpoint');
      const ids = new Set([...(state.research?.leads || []).map(l => l.id), ...Object.values(state.candidates).flatMap(c => c.lead_ids || [])]);
      state.research = { ...(state.research || { version: 1, checks: [] }), leads: research.leads.filter(l => ids.has(l.id)) };
      save();
    }
    const selected = { ...catalog, works: catalog.works.filter(w => (!qids.length || qids.includes(w.qid)) && (!forms.length || forms.includes(w.form))) };
    const plan = buildPlan(selected, research, { langs, kind, limit, now: now() });
    writeJson(join(dirname(statePath), 'plan.json'), plan);
    report.follow_up_tasks = plan.tasks.length;
    report.status = report.paused_sources.length ? 'completed_with_issues' : 'completed';
    report.finished_at = now(); save();
    state.continuation.next_language = (start + 1) % langs.length;
    writeJson(statePath, state);
    return report;
  } catch (error) {
    report.status = 'failed'; report.error = error.message; report.finished_at = now(); save(); throw error;
  }
}
