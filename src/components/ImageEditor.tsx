"use client";

import { ChangeEvent, DragEvent, useCallback, useEffect, useRef, useState } from "react";
import {
  ACCEPTED_TYPES, DEFAULT_EDITOR_STATE, EditorState, ExportFormat, cropForAspect,
  createHistory, mimeForFormat, pushHistory, redo, undo, validateImageFile,
} from "../lib/editor";
import styles from "./ImageEditor.module.css";

type History = ReturnType<typeof createHistory>;
type IconName = "upload" | "undo" | "redo" | "reset" | "rotate" | "flip" | "download" | "compare" | "crop" | "sun" | "contrast" | "droplet" | "blur" | "spark" | "close" | "lock";

function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, string> = {
    upload: "M12 16V4m0 0L7 9m5-5 5 5M4 16v3h16v-3", undo: "M9 7 4 12l5 5M4 12h10a5 5 0 0 1 5 5",
    redo: "m15 7 5 5-5 5m5-5H10a5 5 0 0 0-5 5", reset: "M4 12a8 8 0 1 0 2.3-5.6L4 9m0-5v5h5",
    rotate: "M5 8a8 8 0 1 1 0 8M5 8V3m0 5h5", flip: "M12 4v16M5 6h4v12H5zm10 0h4v12h-4z",
    download: "M12 4v11m0 0 4-4m-4 4-4-4M5 19h14", compare: "M4 5h7v14H4zm9 0h7v14h-7z",
    crop: "M6 3v15h15M3 6h15V3M18 21v-3h3", sun: "M12 3v2m0 14v2M3 12h2m14 0h2m-3.5-5.5 1.5-1.5M6 18l1.5-1.5m0-9L6 6m12 12-1.5-1.5M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8",
    contrast: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm0 0v18", droplet: "M12 3s6 6 6 11a6 6 0 0 1-12 0c0-5 6-11 6-11z",
    blur: "M5 6h14M3 12h18M5 18h14", spark: "m12 3 1.2 5.8L19 10l-5.8 1.2L12 17l-1.2-5.8L5 10l5.8-1.2L12 3z",
    close: "M5 5l14 14M19 5 5 19", lock: "M7 10V7a5 5 0 0 1 10 0v3M5 10h14v10H5z",
  };
  return <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true"><path d={paths[name]} /></svg>;
}

const toolLabels: { key: keyof Pick<EditorState, "brightness" | "contrast" | "saturation" | "blur" | "grayscale" | "sepia">; label: string; icon: IconName; min: number; max: number; unit: string }[] = [
  { key: "brightness", label: "Brightness", icon: "sun", min: 0, max: 200, unit: "%" },
  { key: "contrast", label: "Contrast", icon: "contrast", min: 0, max: 200, unit: "%" },
  { key: "saturation", label: "Saturation", icon: "droplet", min: 0, max: 200, unit: "%" },
  { key: "blur", label: "Blur", icon: "blur", min: 0, max: 20, unit: "px" },
  { key: "grayscale", label: "Grayscale", icon: "contrast", min: 0, max: 100, unit: "%" },
  { key: "sepia", label: "Sepia", icon: "spark", min: 0, max: 100, unit: "%" },
];

export default function ImageEditor() {
  const [history, setHistory] = useState<History>(() => createHistory());
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [fileName, setFileName] = useState("");
  const [objectUrl, setObjectUrl] = useState("");
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [compare, setCompare] = useState(false);
  const [format, setFormat] = useState<ExportFormat>("png");
  const [quality, setQuality] = useState(92);
  const [exporting, setExporting] = useState(false);
  const [renderVersion, setRenderVersion] = useState(0);
  const exportImageRef = useRef<(skipCompare?: boolean) => void>(() => undefined);
  const fileInput = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const loadRequest = useRef(0);
  const pendingUrl = useRef<string | null>(null);
  const compareExport = useRef<{ signature: string; image: HTMLImageElement } | null>(null);
  const renderedSignature = useRef("");
  const present = history.present;

  const loadFile = useCallback((file: File) => {
    setError(""); setStatus("");
    const requestId = ++loadRequest.current;
    if (pendingUrl.current) {
      URL.revokeObjectURL(pendingUrl.current);
      pendingUrl.current = null;
    }
    const issue = validateImageFile(file);
    if (issue) { setLoading(false); setError(issue); return; }
    setLoading(true);
    const url = URL.createObjectURL(file);
    pendingUrl.current = url;
    const nextImage = new window.Image();
    const clearPendingUrl = () => {
      if (pendingUrl.current === url) pendingUrl.current = null;
    };
    const cancelPendingUrl = () => {
      clearPendingUrl();
      URL.revokeObjectURL(url);
    };
    nextImage.onload = () => {
      if (requestId !== loadRequest.current) {
        cancelPendingUrl();
        return;
      }
      clearPendingUrl();
      setObjectUrl((currentUrl) => {
        if (currentUrl) URL.revokeObjectURL(currentUrl);
        return url;
      });
      setImage(nextImage); setFileName(file.name.replace(/\.[^.]+$/, ""));
      setHistory(createHistory()); setLoading(false); setStatus(`Loaded ${file.name}`);
    };
    nextImage.onerror = () => {
      cancelPendingUrl();
      if (requestId !== loadRequest.current) return;
      setLoading(false);
      setError("This file could not be decoded as an image. Try another file.");
    };
    nextImage.src = url;
  }, []);

  useEffect(() => () => {
    loadRequest.current += 1;
    if (pendingUrl.current) URL.revokeObjectURL(pendingUrl.current);
    pendingUrl.current = null;
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }, [objectUrl]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey)) return;
      if (event.key.toLowerCase() === "z") {
        event.preventDefault();
        setHistory(event.shiftKey ? redo : undo);
      } else if (event.key.toLowerCase() === "y") {
        event.preventDefault();
        setHistory(redo);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const update = (patch: Partial<EditorState>) => setHistory((current) => pushHistory(current, { ...current.present, ...patch }));
  const updateCrop = (key: "x" | "y" | "width" | "height", value: number) => {
    const crop = { ...present.crop, [key]: value };
    crop.width = Math.min(crop.width, 1 - crop.x); crop.height = Math.min(crop.height, 1 - crop.y);
    crop.x = Math.min(Math.max(0, crop.x), 1 - crop.width); crop.y = Math.min(Math.max(0, crop.y), 1 - crop.height);
    update({ crop, cropMode: "free" });
  };
  const reset = () => setHistory((current) => pushHistory(current, DEFAULT_EDITOR_STATE));
  const handleInput = (event: ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (file) loadFile(file); event.target.value = ""; };
  const handleDrop = (event: DragEvent<HTMLDivElement>) => { event.preventDefault(); setDragging(false); const file = event.dataTransfer.files[0]; if (file) loadFile(file); };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;
    const renderState = compare ? DEFAULT_EDITOR_STATE : present;
    const { crop } = renderState;
    const sourceW = image.naturalWidth;
    const sourceH = image.naturalHeight;
    const cropW = Math.max(1, Math.round(sourceW * crop.width));
    const cropH = Math.max(1, Math.round(sourceH * crop.height));
    const rotated = renderState.rotation === 90 || renderState.rotation === 270;
    const width = rotated ? cropH : cropW;
    const height = rotated ? cropW : cropH;
    if (![sourceW, sourceH, width, height].every(Number.isSafeInteger) || width > 16384 || height > 16384) {
      compareExport.current = null;
      setExporting(false);
      setError("This image is too large to render in this browser. Try a smaller image.");
      return;
    }
    try {
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas rendering is unavailable");
      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.rotate((renderState.rotation * Math.PI) / 180);
      ctx.scale(renderState.flipX ? -1 : 1, renderState.flipY ? -1 : 1);
      ctx.filter = `brightness(${renderState.brightness}%) contrast(${renderState.contrast}%) saturate(${renderState.saturation}%) blur(${renderState.blur}px) grayscale(${renderState.grayscale}%) sepia(${renderState.sepia}%)`;
      ctx.drawImage(image, sourceW * crop.x, sourceH * crop.y, cropW, cropH, -cropW / 2, -cropH / 2, cropW, cropH);
      ctx.restore();
      setError("");
      setRenderVersion((version) => version + 1);
    } catch {
      compareExport.current = null;
      setExporting(false);
      setError("This image could not be rendered. Try a smaller image or another browser.");
    }
  }, [image, present, compare]);

  const exportImage = async (skipCompare = false) => {
    const request = compareExport.current;
    if (exporting && (!skipCompare || !request)) return;
    if (compare && !skipCompare && image) {
      const signature = JSON.stringify({ image: image.src, state: present });
      compareExport.current = { signature, image };
      setExporting(true);
      setCompare(false);
      return;
    }
    if (!image || !canvasRef.current) {
      compareExport.current = null;
      setExporting(false);
      setError("Import an image before exporting.");
      return;
    }
    compareExport.current = null;
    setExporting(true);
    setError("");
    const canvas = canvasRef.current;
    const exportCanvas = format === "jpeg" ? document.createElement("canvas") : canvas;
    if (format === "jpeg") {
      exportCanvas.width = canvas.width;
      exportCanvas.height = canvas.height;
      const exportContext = exportCanvas.getContext("2d");
      if (!exportContext) throw new Error("Export is unavailable in this browser. Try PNG or another browser.");
      exportContext.fillStyle = "#ffffff";
      exportContext.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
      exportContext.drawImage(canvas, 0, 0);
    }
    const mime = mimeForFormat(format);
    const downloadName = `${fileName || "imedit-export"}.${format === "jpeg" ? "jpg" : format}`;
    try {
      const blob = await new Promise<Blob | null>((resolve) => {
        exportCanvas.toBlob(resolve, mime, quality / 100);
      });
      if (!blob || (format === "webp" && blob.type !== "image/webp")) {
        setError(format === "webp" ? "WebP export is not supported by this browser. Choose PNG or JPEG instead." : "Export failed in this browser. Try PNG or a smaller image.");
        return;
      }
      const link = document.createElement("a");
      link.download = downloadName;
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
      setStatus(`Exported ${downloadName}`);
    } catch {
      setError("Export failed in this browser. Try PNG or a smaller image.");
    } finally {
      setExporting(false);
    }
  };

  exportImageRef.current = exportImage;
  useEffect(() => {
    const request = compareExport.current;
    if (!request || compare || !image || request.image !== image) return;
    const signature = JSON.stringify({ image: image.src, state: present });
    if (request.signature === signature) exportImageRef.current(true);
  }, [renderVersion, compare, image, present]);

  return (
    <main className={styles.app}>
      <header className={styles.header}><div className={styles.brand}><span className={styles.mark}>im</span><span>imedit</span><small>LOCAL STUDIO</small></div><div className={styles.headerActions}><button className={styles.iconButton} onClick={() => setHistory(undo)} disabled={!history.past.length} aria-label="Undo last change" title="Undo (Ctrl+Z)"><Icon name="undo" /></button><button className={styles.iconButton} onClick={() => setHistory(redo)} disabled={!history.future.length} aria-label="Redo last change" title="Redo (Ctrl+Shift+Z)"><Icon name="redo" /></button><button className={styles.textButton} onClick={reset} disabled={!image}><Icon name="reset" /> Reset</button><button className={styles.exportButton} onClick={() => exportImage()} disabled={!image || exporting}><Icon name="download" /> {exporting ? "Preparing…" : "Export"}</button></div></header>
      <div className={styles.workspace}>
        <aside className={styles.sidebar} aria-label="Editing controls">
          <div className={styles.panelHeading}><div><span className={styles.eyebrow}>TOOLS</span><h1>Make it yours.</h1></div><span className={styles.step}>01</span></div>
          {!image ? <div className={styles.sidebarHint}>Import an image to unlock your editing controls.</div> : <>
            <section className={styles.controlSection}><h2>Transform</h2><div className={styles.actionGrid}><button onClick={() => update({ rotation: ((present.rotation + 90) % 360) as EditorState["rotation"] })} aria-label="Rotate 90 degrees"><Icon name="rotate" /><span>Rotate</span></button><button onClick={() => update({ flipX: !present.flipX })} aria-pressed={present.flipX}><Icon name="flip" /><span>Flip H</span></button><button onClick={() => update({ flipY: !present.flipY })} aria-pressed={present.flipY}><Icon name="flip" /><span>Flip V</span></button><button onClick={() => setCompare(!compare)} aria-pressed={compare}><Icon name="compare" /><span>Compare</span></button></div></section>
            <section className={styles.controlSection}><div className={styles.sectionTitle}><h2>Crop</h2><Icon name="crop" /></div><label className={styles.selectLabel}>Aspect ratio<select value={present.cropMode} onChange={(e) => { const mode = e.target.value as EditorState["cropMode"]; update({ cropMode: mode, crop: cropForAspect(mode, image.naturalWidth, image.naturalHeight) }); }}><option value="free">Freeform</option><option value="1:1">Square · 1:1</option><option value="4:5">Portrait · 4:5</option><option value="16:9">Landscape · 16:9</option></select></label>{present.cropMode === "free" && <div className={styles.cropGrid}>{(["x", "y", "width", "height"] as const).map((key) => <label key={key}>{key === "x" ? "Left" : key === "y" ? "Top" : key === "width" ? "Width" : "Height"}<input type="number" min="0" max="100" value={Math.round(present.crop[key] * 100)} onChange={(e) => updateCrop(key, Math.min(100, Math.max(0, Number(e.target.value) || 0)) / 100)} /><span>%</span></label>)}</div>}</section>
            <section className={styles.controlSection}><h2>Adjust</h2>{toolLabels.map((tool) => <label className={styles.sliderRow} key={tool.key}><span><Icon name={tool.icon} />{tool.label}<b>{present[tool.key]}{tool.unit}</b></span><input type="range" min={tool.min} max={tool.max} value={present[tool.key]} onChange={(e) => update({ [tool.key]: Number(e.target.value) } as Partial<EditorState>)} /></label>)}</section>
          </>}
          <div className={styles.privacy}><span className={styles.lock}><Icon name="lock" /></span><div><strong>Private by design</strong><p>Your image never leaves this browser.</p></div></div>
        </aside>
        <section className={styles.stage} aria-label="Image work area">
          <div className={styles.stageTop}><span>CANVAS <i>{image ? `${image.naturalWidth} × ${image.naturalHeight}` : "READY"}</i></span><span className={styles.stageMode}>{compare ? "BEFORE / AFTER" : "EDITING"}</span></div>
          <div className={`${styles.canvasArea} ${dragging ? styles.dragActive : ""}`} role="region" tabIndex={0} aria-label="Image dropzone. Press Enter or Space to choose an image." onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileInput.current?.click(); } }} onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={handleDrop}>
            {loading ? <div className={styles.emptyState}><div className={styles.spinner} /><h2>Reading your image</h2><p>Preparing a local canvas…</p></div> : image ? <div className={styles.canvasWrap}><canvas ref={canvasRef} aria-label="Edited image preview" />{compare && <div className={styles.compareBadge}>ORIGINAL</div>}</div> : <div className={styles.emptyState}><div className={styles.uploadGlyph}><Icon name="upload" /></div><h2>Start with an image</h2><p>Drop a JPG, PNG, WebP, or GIF here.<br />Everything stays on your device.</p><button className={styles.importButton} onClick={() => fileInput.current?.click()}><Icon name="upload" /> Choose image</button><span className={styles.fileNote}>Maximum file size · 25 MB</span></div>}
            {dragging && <div className={styles.dropOverlay}><Icon name="upload" /><strong>Release to import</strong></div>}
          </div>
          <div className={styles.stageFooter}><span>{image ? fileName : "No image loaded"}</span><span className={styles.formatNote}>LOCAL PROCESSING · NO UPLOAD</span></div>
        </section>
      </div>
      <section className={styles.exportBar} aria-label="Export settings"><div><span className={styles.eyebrow}>OUTPUT</span><strong>Export your edit</strong><small>Choose a format and quality for your local download.</small></div><label>Format<select value={format} onChange={(e) => setFormat(e.target.value as ExportFormat)}><option value="png">PNG · Lossless</option><option value="jpeg">JPEG · Smaller file</option><option value="webp">WebP · Modern</option></select></label><label className={styles.quality}>Quality <b>{quality}%</b><input type="range" min="10" max="100" value={quality} onChange={(e) => setQuality(Number(e.target.value))} disabled={format === "png"} /></label><button className={styles.exportButton} onClick={() => exportImage()} disabled={!image || exporting}><Icon name="download" /> {exporting ? "Preparing…" : `Download ${format.toUpperCase()}`}</button></section>
      <input ref={fileInput} className={styles.visuallyHidden} type="file" accept={ACCEPTED_TYPES.join(",")} onChange={handleInput} />
      {(error || status) && <div className={`${styles.toast} ${error ? styles.toastError : ""}`} role={error ? "alert" : "status"}><span>{error || status}</span><button onClick={() => { setError(""); setStatus(""); }} aria-label="Dismiss message"><Icon name="close" /></button></div>}
    </main>
  );
}
