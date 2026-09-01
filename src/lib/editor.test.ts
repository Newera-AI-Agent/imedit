import { describe, expect, it } from "vitest";
import { DEFAULT_EDITOR_STATE, cropForAspect, createHistory, mimeForFormat, pushHistory, redo, undo, validateImageFile } from "./editor";

describe("editor helpers", () => {
  it("rejects unsupported and oversized files", () => {
    expect(validateImageFile(new File(["x"], "note.txt", { type: "text/plain" }))).toContain("JPG");
    expect(validateImageFile(new File([new Uint8Array(26 * 1024 * 1024)], "big.png", { type: "image/png" }))).toContain("25 MB");
    expect(validateImageFile(new File(["x"], "ok.png", { type: "image/png" }))).toBeNull();
  });
  it("bounds history and avoids duplicate entries", () => {
    let history = createHistory();
    history = pushHistory(history, { ...DEFAULT_EDITOR_STATE, brightness: 120 });
    expect(pushHistory(history, history.present)).toBe(history);
    expect(undo(history).present.brightness).toBe(100);
    expect(redo(undo(history)).present.brightness).toBe(120);
  });
  it("centers practical aspect crops", () => {
    const crop = cropForAspect("1:1", 1600, 900);
    expect(crop.width).toBeCloseTo(0.5625);
    expect(crop.x).toBeCloseTo(0.21875);
    expect(crop.height).toBe(1);
  });
  it("maps formats to browser MIME types", () => {
    expect(mimeForFormat("png")).toBe("image/png");
    expect(mimeForFormat("jpeg")).toBe("image/jpeg");
    expect(mimeForFormat("webp")).toBe("image/webp");
  });
});
