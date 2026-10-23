# 01 · Leftover data between requests

Companion code for **Decoded #01–#03: PHP2Shell**, the 14-year-old PHP flaw that AI helped find in October 2026.

## Run it (Node 18+, no installs)

```bash
npm start        # buggy: Subhadeep sees Akshat's private note
npm run fixed    # fixed: the worker starts clean every time
```

## What it shows

Servers reuse the same **worker** for many visitors, because starting fresh each time is slow. In this demo:

1. Akshat saves a private note, but his request **crashes halfway** (like running out of memory).
2. The crash skips the clean-up step, so his note stays in the shared worker.
3. Subhadeep visits next, and the server shows him **Akshat's note**.

The fix is one idea: **reset the worker at the start of every request**, whatever happened before.

## Documented vs Our build

- **Documented:** PHP2Shell (CVE-2026-109618/109619) comes from PHP leaving memory in a broken or "stale" state when a request ends abnormally, which a later request on the same worker can use. Fixed in PHP 8.5.12, 8.4.27, 8.3.36 and 8.2.35. Sources: [BleepingComputer](https://www.bleepingcomputer.com/news/security/php-ships-emergency-patches-for-critical-php2shell-flaws/), [Help Net Security](https://www.helpnetsecurity.com/2026/10/21/php2shell-php-vulnerabilities-patched-cve-2026-109618-cve-2026-109619/).
- **Our build:** this is a JavaScript simplification of the *bug class* only. The real flaw is deep inside PHP's memory handling and far more complex. This code is **not** an exploit and does not touch PHP.

## If you run a PHP site

Update PHP to a fixed version and restart your PHP workers. That's the real fix.

## Slides

- [Decoded #01 carousel (PDF)](slides/decoded-01.pdf)
- [Decoded #03 carousel (PDF)](slides/decoded-03.pdf)
