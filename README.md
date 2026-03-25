# Slash Snippet Auto-Opener

Chrome extension that opens the snippet panel when you press `/`.

## What it does

- Detects the `/` keystroke.
- Finds the snippet trigger in the current page.
- Opens the snippet panel.
- Focuses the snippet search field when it appears.

## Project structure

```text
src/
  background/
  content/
  types/
  utils/
dist/
```

## Local development

Requirements:

- Node.js 18+
- npm

Commands:

```bash
npm install
npm run type-check
npm run build
```

For watch mode:

```bash
npm run dev
```

## Load in Chrome

1. Open `chrome://extensions/`.
2. Enable Developer mode.
3. Click Load unpacked.
4. Select this folder.

Chrome will load:

- `dist/content/content.js`
- `dist/background/service-worker.js`

## Basic customization

Main settings live in `src/utils/constants.ts`.

- `TRIGGER_KEY`: shortcut key.
- `BUTTON_SELECTORS`: selectors used to find the snippet button.
- `SEARCH_FIELD_SELECTORS`: selectors used to focus the snippet search field.
- `DEBOUNCE_DELAY`: debounce between triggers.
- `DEBUG_MODE`: verbose console logs.

## Troubleshooting

- If `/` does nothing, open DevTools and review logs with the `[SlashSnippet]` prefix.
- If the panel does not open, inspect the real snippet button and update `BUTTON_SELECTORS`.
- If the panel opens but the search field is not focused, inspect the real field and update `SEARCH_FIELD_SELECTORS`.

## Author

- Ingeniero de Sistemas y Computacion, Hermes Castro
- Website: https://hermescastro.com
- GitHub: https://github.com/IngHermesCastro
