# Security

unoebasta is one static page. It has no server, no accounts and no keys; readers’ data stays in their browser. Still, mistakes happen: a script that leaks data, a link that carries more than it should, a dependency gone bad.

**To report a problem,** please use [private vulnerability reporting](https://github.com/foteev/unoebasta/security/advisories/new) rather than a public issue. You will get an answer within a few days.

**Secrets.** This repository must never contain keys, tokens or personal data. `npm run check:secrets` runs on every pull request. If you find a secret in the code or in the history, report it privately; whoever owns it must revoke it.
