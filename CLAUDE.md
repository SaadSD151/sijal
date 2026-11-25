# Sijal — notes for working on this repo

- Build before committing: `node build.js` (writes `dist/`), then commit `src/` and `dist/` together. Pushing to `main` publishes the site.
- "What's new" (`LOG` in `src/i18n.js`): one update per day. If today's date already has an entry, add the new lines to it instead of adding a new version. The game also groups entries by date when showing them.
- Keep phone-only layout changes under `.mob` and computer-only ones under `#app:not(.mob)`.
- The owner (saadsd) speaks Saudi Arabic; answer in it, short and clear.
