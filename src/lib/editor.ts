export type CropMode = "free" | "1:1" | "4:5" | "16:9";
export type ExportFormat = "png" | "jpeg" | "webp";

export type EditorState = {
  rotation: 0 | 90 | 180 | 270;
  flipX: boolean;
  flipY: boolean;
  brightness: number;
  contrast: number;
  saturation: number;
  blur: number;
  grayscale: number;
  sepia: number;
  cropMode: CropMode;
  crop: { x: number; y: number; width: number; height: number };
};

export const DEFAULT_EDITOR_STATE: EditorState = {
  rotation: 0,
  flipX: false,
  flipY: false,
  brightness: 100,
  contrast: 100,
  saturation: 100,
  blur: 0,
  grayscale: 0,
  sepia: 0,
  cropMode: "free",
  crop: { x: 0, y: 0, width: 1, height: 1 },
};

export const HISTORY_LIMIT = 30;
export const MAX_FILE_BYTES = 25 * 1024 * 1024;
export const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export function validateImageFile(file: File): string | null {
  // Some local files omit MIME metadata; let the browser's image decoder verify them.\n  if (file.type && !ACCEPTED_TYPES.includes(file.type)) return "Use a JPG, PNG, WebP, or GIF image.";
  if (file.size > MAX_FILE_BYTES) return "That image is larger than 25 MB. Choose a smaller file.";
  return null;
}

export function createHistory(initial = DEFAULT_EDITOR_STATE) {
  return { past: [] as EditorState[], present: initial, future: [] as EditorState[] };
}

export function pushHistory(history: ReturnType<typeof createHistory>, next: EditorState) {
  if (JSON.stringify(history.present) === JSON.stringify(next)) return history;
  const past = [...history.past, history.present].slice(-HISTORY_LIMIT);
  return { past, present: next, future: [] as EditorState[] };
}

export function undo(history: ReturnType<typeof createHistory>) {
  if (!history.past.length) return history;
  const previous = history.past[history.past.length - 1];
  return { past: history.past.slice(0, -1), present: previous, future: [history.present, ...history.future] };
}

export function redo(history: ReturnType<typeof createHistory>) {
  if (!history.future.length) return history;
  const next = history.future[0];
  return { past: [...history.past, history.present].slice(-HISTORY_LIMIT), present: next, future: history.future.slice(1) };
}

export function cropForAspect(mode: CropMode, width: number, height: number) {
  if (mode === "free") return { x: 0, y: 0, width: 1, height: 1 };
  const ratio = mode === "1:1" ? 1 : mode === "4:5" ? 4 / 5 : 16 / 9;
  const imageRatio = width / height;
  if (imageRatio > ratio) {
    const cropWidth = (height * ratio) / width;
    return { x: (1 - cropWidth) / 2, y: 0, width: cropWidth, height: 1 };
  }
  const cropHeight = (width / ratio) / height;
  return { x: 0, y: (1 - cropHeight) / 2, width: 1, height: cropHeight };
}

export function mimeForFormat(format: ExportFormat) {
  return format === "jpeg" ? "image/jpeg" : `image/${format}`;
}
