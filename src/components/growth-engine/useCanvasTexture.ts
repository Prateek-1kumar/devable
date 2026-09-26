import { useCallback, useEffect, useMemo } from "react";
import { CanvasTexture, SRGBColorSpace, type Texture } from "three";
import { useThree } from "@react-three/fiber";

type Draw = (ctx: CanvasRenderingContext2D, width: number, height: number) => void;

const upload = (texture: Texture) => {
  texture.needsUpdate = true;
};

/**
 * A 2D-canvas texture for crisp text and glyphs on 3D faces, drawn in the
 * page's own fonts. `draw` must be stable (module-level or useCallback);
 * call `paint()` to redraw when what it reads changes.
 */
export function useCanvasTexture(width: number, height: number, draw: Draw) {
  const invalidate = useThree((s) => s.invalidate);

  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const t = new CanvasTexture(canvas);
    t.colorSpace = SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  }, [width, height]);

  const paint = useCallback(() => {
    const ctx = (texture.image as HTMLCanvasElement).getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    draw(ctx, width, height);
    upload(texture);
    invalidate();
  }, [texture, width, height, draw, invalidate]);

  useEffect(() => {
    paint();
    // Repaint once web fonts are ready so text never sticks in a fallback face.
    document.fonts.ready.then(paint);
  }, [paint]);

  useEffect(() => () => texture.dispose(), [texture]);

  return { texture, paint };
}
