"use client";

import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";

type Result = {
  sourceUrl: string;
  outputUrl: string;
  sourceName: string;
  sourceBytes: number;
  outputBytes: number;
  sourceWidth: number;
  sourceHeight: number;
  outputWidth: number;
  outputHeight: number;
};

const MAX_DIMENSION = 1600;
const WEBP_QUALITY = 0.82;
const ACCEPTED = new Set(["image/jpeg", "image/png", "image/webp"]);

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function outputDimensions(width: number, height: number) {
  const longest = Math.max(width, height);
  if (longest <= MAX_DIMENSION) return { width, height };
  const scale = MAX_DIMENSION / longest;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

async function canvasToWebp(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error("This browser could not encode the local result.")),
      "image/webp",
      WEBP_QUALITY,
    );
  });
}

export default function LocalImageTransform() {
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const urls = useRef<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => {
    for (const url of urls.current) URL.revokeObjectURL(url);
  }, []);

  const replaceUrls = (next: string[]) => {
    for (const url of urls.current) URL.revokeObjectURL(url);
    urls.current = next;
  };

  const processFile = async (file: File) => {
    setError(null);
    if (!ACCEPTED.has(file.type)) {
      setError("Choose a JPEG, PNG, or WebP image for this demo.");
      return;
    }

    setWorking(true);
    try {
      const bitmap = await createImageBitmap(file);
      const target = outputDimensions(bitmap.width, bitmap.height);
      const canvas = document.createElement("canvas");
      canvas.width = target.width;
      canvas.height = target.height;
      const context = canvas.getContext("2d", { alpha: true });
      if (!context) throw new Error("Canvas processing is unavailable in this browser.");

      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.drawImage(bitmap, 0, 0, target.width, target.height);
      bitmap.close();

      const output = await canvasToWebp(canvas);
      const sourceUrl = URL.createObjectURL(file);
      const outputUrl = URL.createObjectURL(output);
      replaceUrls([sourceUrl, outputUrl]);
      setResult({
        sourceUrl,
        outputUrl,
        sourceName: file.name,
        sourceBytes: file.size,
        outputBytes: output.size,
        sourceWidth: canvas.width === target.width ? Math.round(target.width / Math.min(1, MAX_DIMENSION / Math.max(target.width, target.height))) : target.width,
        sourceHeight: canvas.height === target.height ? Math.round(target.height / Math.min(1, MAX_DIMENSION / Math.max(target.width, target.height))) : target.height,
        outputWidth: target.width,
        outputHeight: target.height,
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The local transform failed on this device.");
    } finally {
      setWorking(false);
    }
  };

  const processWithDimensions = async (file: File) => {
    setError(null);
    if (!ACCEPTED.has(file.type)) {
      setError("Choose a JPEG, PNG, or WebP image for this demo.");
      return;
    }

    setWorking(true);
    try {
      const bitmap = await createImageBitmap(file);
      const sourceWidth = bitmap.width;
      const sourceHeight = bitmap.height;
      const target = outputDimensions(sourceWidth, sourceHeight);
      const canvas = document.createElement("canvas");
      canvas.width = target.width;
      canvas.height = target.height;
      const context = canvas.getContext("2d", { alpha: true });
      if (!context) {
        bitmap.close();
        throw new Error("Canvas processing is unavailable in this browser.");
      }

      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.drawImage(bitmap, 0, 0, target.width, target.height);
      bitmap.close();

      const output = await canvasToWebp(canvas);
      const sourceUrl = URL.createObjectURL(file);
      const outputUrl = URL.createObjectURL(output);
      replaceUrls([sourceUrl, outputUrl]);
      setResult({
        sourceUrl,
        outputUrl,
        sourceName: file.name,
        sourceBytes: file.size,
        outputBytes: output.size,
        sourceWidth,
        sourceHeight,
        outputWidth: target.width,
        outputHeight: target.height,
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The local transform failed on this device.");
    } finally {
      setWorking(false);
    }
  };

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) void processWithDimensions(file);
    event.target.value = "";
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) void processWithDimensions(file);
  };

  return (
    <div className="zu-demo">
      <div
        className="zu-drop"
        onDragOver={(event) => event.preventDefault()}
        onDrop={onDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={onChange}
          className="zu-input"
          aria-label="Choose an image to transform locally"
        />
        <p className="zu-demo-label">DEVICE SIDE</p>
        <button type="button" onClick={() => inputRef.current?.click()} disabled={working}>
          {working ? "Transforming here…" : result ? "Choose another image" : "Choose an image"}
        </button>
        <p>JPEG, PNG, or WebP. The demo resizes only when needed and encodes a WebP result in this tab.</p>
      </div>

      <div className="zu-demo-boundary" aria-hidden="true">
        <span />
        <strong>THE BOUNDARY</strong>
      </div>

      <div className="zu-outside" aria-live="polite">
        <p className="zu-demo-label">OUTSIDE</p>
        <p className="zu-outside-statement">Nothing from this demo needs to cross.</p>
      </div>

      {error && <p className="zu-demo-error" role="alert">{error}</p>}

      {result && (
        <div className="zu-result">
          <figure>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={result.sourceUrl} alt="Local source preview" />
            <figcaption>
              <span>Original</span>
              <span>{result.sourceWidth} × {result.sourceHeight}</span>
              <span>{formatBytes(result.sourceBytes)}</span>
            </figcaption>
          </figure>

          <figure>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={result.outputUrl} alt="Locally transformed preview" />
            <figcaption>
              <span>Local result</span>
              <span>{result.outputWidth} × {result.outputHeight}</span>
              <span>{formatBytes(result.outputBytes)}</span>
            </figcaption>
          </figure>

          <a href={result.outputUrl} download="zeroupload-local-result.webp">
            Save local result <span aria-hidden="true">↓</span>
          </a>
        </div>
      )}

      <p className="zu-demo-truth">This demonstration processes the selected image in your browser. The demo does not send the file to a server.</p>
    </div>
  );
}
