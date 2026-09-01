# imedit

A private, browser-only image editor built with Next.js and TypeScript. Import an image, make practical adjustments, compare the original, and download the result without sending pixels to a server.

## Local setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

- `npm run dev` — start the development server
- `npm run lint` — run ESLint
- `npm test` — run the focused Vitest suite
- `npm run build` — create a production Next.js build

## Architecture

- `src/components/ImageEditor.tsx` is the focused client boundary. It owns browser APIs, the file picker/drop zone, canvas rendering, controls, export, and status states.
- `src/lib/editor.ts` contains typed editor state, validation, crop math, bounded undo/redo history, and export MIME helpers. These pure helpers are covered by tests.
- `src/app/` contains the App Router entry point, metadata, and design tokens/reset styles.

The canvas applies crop, rotation, flips, CSS canvas filters, and export encoding to the actual output. History is capped at 30 states and duplicate updates are ignored.

## Privacy

Images are read with a local object URL and processed using the browser canvas API. There are no API routes, server actions, accounts, analytics, uploads, or external credentials. Object URLs are revoked when replaced or when the component unmounts. Export downloads are created locally by the browser.

Supported input types are JPG, PNG, WebP, and GIF, up to 25 MB. PNG export is lossless; JPEG and WebP use the selected quality where supported by the browser.
