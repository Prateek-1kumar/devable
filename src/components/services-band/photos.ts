import { useEffect } from "react";

// Photos for printed faces: loaded once, shared by every texture; textures repaint as they arrive.

type Ctx = CanvasRenderingContext2D;

const photos = new Map<string, HTMLImageElement>();
export function photo(src: string) {
  let img = photos.get(src);
  if (!img) {
    img = new Image();
    img.src = src;
    photos.set(src, img);
  }
  return img;
}
export function usePhotos(srcs: string[], paint: () => void) {
  useEffect(() => {
    const pending = srcs.map(photo).filter((img) => !img.complete);
    pending.forEach((img) =>
      img.addEventListener("load", paint, { once: true }),
    );
    return () =>
      pending.forEach((img) => img.removeEventListener("load", paint));
  }, [srcs, paint]);
}
export function drawPhoto(
  ctx: Ctx,
  src: string,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const img = photo(src);
  if (!img.complete || !img.naturalWidth) {
    ctx.fillStyle = "#e4e2db";
    ctx.fillRect(x, y, w, h);
    return;
  }
  const s = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  ctx.drawImage(
    img,
    x + (w - img.naturalWidth * s) / 2,
    y + (h - img.naturalHeight * s) / 2,
    img.naturalWidth * s,
    img.naturalHeight * s,
  );
}
export function face(ctx: Ctx, src: string, cx: number, cy: number, r: number) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  drawPhoto(ctx, src, cx - r, cy - r, r * 2, r * 2);
  ctx.restore();
}

