# Contributing to Promptoo

Thanks for helping. Promptoo is a free, browser-only prompt builder for AI video and image tools, made by [Avan Labs](https://avanlabs.com). There is no build step and no backend, so a change is usually one small edit.

## Licence, and what you agree to

Promptoo is source-available under the [PolyForm Noncommercial License 1.0.0](LICENSE): free for personal and other noncommercial use, and commercial use needs permission from Avan Labs.

By sending a pull request you confirm that:
- the work is yours, or you have the right to submit it;
- it may be distributed under the same licence as the project; and
- you give Avan Labs the right to use your contribution in Promptoo, including in commercial licences that Avan Labs grants.

If you cannot agree to that, please open an issue instead of a pull request.

## Easy ways to help

| I want to... | Edit | Then |
|---|---|---|
| add a prompt example | `examples.js` | run `node tools/build-examples.js` (needs `npm i jsdom`) |
| add a checker rule (a bad combination) | `rules.js`: one line, `X(level, [group, [values]], [group, [values]], "message")` | open the tool and try the combination |
| add a camera move, angle or shot | `camera.js` | run `node tools/build-guides.js` |
| add a movement option | `motion.js` and `effects/motion.js` | |
| add a 3D effect | `effects/*.js`, see `effects/README.md` | open the large 3D view: it lists any pick with no effect |
| add a visual style | `styles.js` | |
| fix wording or a typo | any page | |

## Before you open a pull request

1. Open `app.html` in a browser (a double-click is enough) and try your change.
2. Run `node tools/check-site.js`. It must print `All site checks passed`.
3. If you changed pages that share the header or footer, run `python tools/stamp.py`.
4. Keep the pull request small and say what you changed and why.

## Guidelines

- **No new dependencies and no build step.** Everything must work when `app.html` is opened from disk.
- **No tracking, no analytics, no network calls** except the optional "Rewrite using AI" feature, which uses the visitor's own key.
- **Prompts must not contain** logos, brand names, real people, or readable text. Models cannot draw them reliably.
- **Examples must pass the checker with no warnings.** The example builder refuses ones that do not.
- **Plain language.** Short sentences, no jargon, no emoji in controls.

## Reporting a problem

Open an issue with what you did, what you expected and what happened. A screenshot or the browser console output helps. For anything security-related, please email through the [contact page](https://promptoo.avanlabs.com/contact) instead of opening a public issue.
