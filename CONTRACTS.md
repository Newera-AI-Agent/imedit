# CONTRACTS

AUTO-GENERATED after every successful file write. Do not edit by hand - your edits will be overwritten.

This is the authoritative list of what exists in this project. If a symbol is not listed here and not in a file you have read during this run, IT DOES NOT EXIST. Do not reference it. Read the file or write the symbol first.

## Dependencies (package.json)

- `@types/node` `^20`
- `@types/react` `^19`
- `@types/react-dom` `^19`
- `eslint` `^9`
- `eslint-config-next` `16.3.4`
- `next` `16.3.4`
- `react` `19.2.8`
- `react-dom` `19.2.8`
- `typescript` `^5`
- `vitest` `^4.1.11`

Scripts: `dev`, `build`, `start`, `lint`, `test`

## Files and public API

### `eslint.config.mjs` - 19 lines
- exports: (nothing public)

### `next-env.d.ts` - 8 lines
- imports: `.next/types/routes.d.ts`, `.next/types/root-params.d.ts`
- exports: (nothing public)

### `next.config.ts` - 8 lines
- exports: (nothing public)

### `src/app/globals.css` - 10 lines
- exports: (nothing public)

### `src/app/layout.tsx` - 16 lines
- imports: `src/app/globals.css`
- `RootLayout` (function)
- `metadata` (const): description, title
- default export: `RootLayout`

### `src/app/page.module.css` - 151 lines
- exports: (nothing public)

### `src/app/page.tsx` - 6 lines
- imports: `src/components/ImageEditor.tsx`
- `Home` (function)
- default export: `Home`

### `src/components/ImageEditor.module.css` - 129 lines
- exports: (nothing public)

### `src/components/ImageEditor.tsx` - 131 lines
- imports: `src/components/ImageEditor.module.css`
- `ImageEditor` (function)
- default export: `ImageEditor`

### `src/lib/editor.test.ts` - 29 lines
- imports: `src/lib/editor.ts`
- exports: (nothing public)

### `src/lib/editor.ts` - 79 lines
- `validateImageFile` (function)
- `createHistory` (function)
- `pushHistory` (function)
- `undo` (function)
- `redo` (function)
- `cropForAspect` (function)
- `mimeForFormat` (function)
- `DEFAULT_EDITOR_STATE` (const): blur, brightness, contrast, crop, cropMode, flipX, flipY, grayscale, rotation, saturation, sepia
- `HISTORY_LIMIT` (const)
- `MAX_FILE_BYTES` (const)
- `ACCEPTED_TYPES` (const)
- `CropMode` (type)
- `ExportFormat` (type)
- `EditorState` (type)

## Unresolved references

- `src/components/ImageEditor.tsx:4` imports `@/lib/editor` - **this file does not exist yet**
