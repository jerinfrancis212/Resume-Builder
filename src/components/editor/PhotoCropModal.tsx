import { useCallback, useEffect, useRef, useState } from 'react';
import { Crop, RotateCcw, RotateCw, ZoomIn, ZoomOut } from 'lucide-react';
import type { PhotoCropState } from '@/types/resume';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/controls';

const VIEWPORT = 280;
const OUTPUT_SIZE = 440;

interface PhotoCropModalProps {
  /** Original uncropped image URL / data URL to crop. When null, the modal is closed. */
  imageSrc: string | null;
  /** Optional saved crop coordinates to restore when re-editing an existing photo. */
  initialCrop?: PhotoCropState;
  onCancel: () => void;
  onConfirm: (croppedDataUrl: string, cropState: PhotoCropState) => void;
}

/**
 * Interactive square/circle profile photo cropper with drag-to-pan, zoom, and 90° rotation.
 * Always crops from the uncropped source so users can zoom back out to original size anytime,
 * and applies full-bleed edge clamping so no white edges ever appear on the CV PDF.
 */
export function PhotoCropModal({ imageSrc, initialCrop, onCancel, onConfirm }: PhotoCropModalProps) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragging = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);

  const computeClamp = useCallback((el: HTMLImageElement, x: number, y: number, z: number, rot: number) => {
    const sw = rot % 180 !== 0;
    const w = sw ? el.naturalHeight : el.naturalWidth;
    const h = sw ? el.naturalWidth : el.naturalHeight;
    const bs = Math.max(VIEWPORT / w, VIEWPORT / h);
    // Keep a 1px safety margin inside the image bounds so sub-pixel rounding never exposes background edges
    const maxX = Math.max(0, Math.floor((w * bs * z - VIEWPORT) / 2));
    const maxY = Math.max(0, Math.floor((h * bs * z - VIEWPORT) / 2));
    return {
      x: Math.min(maxX, Math.max(-maxX, x)),
      y: Math.min(maxY, Math.max(-maxY, y)),
    };
  }, []);

  // Load image when source changes
  useEffect(() => {
    if (!imageSrc) {
      setImg(null);
      return;
    }
    let alive = true;
    const el = new Image();
    el.onload = () => {
      if (!alive) return;
      const initZoom = initialCrop ? Math.min(3, Math.max(1, initialCrop.zoom)) : 1;
      const initRot = initialCrop ? initialCrop.rotation % 360 : 0;
      const initOff = initialCrop
        ? computeClamp(el, initialCrop.x, initialCrop.y, initZoom, initRot)
        : { x: 0, y: 0 };
      setImg(el);
      setZoom(initZoom);
      setRotation(initRot);
      setOffset(initOff);
    };
    el.src = imageSrc;
    return () => {
      alive = false;
    };
  }, [imageSrc, initialCrop, computeClamp]);

  // Effective natural dimensions accounting for 90°/270° rotation
  const swapped = rotation % 180 !== 0;
  const natW = img ? (swapped ? img.naturalHeight : img.naturalWidth) : 1;
  const natH = img ? (swapped ? img.naturalWidth : img.naturalHeight) : 1;
  // Base scale so the image always covers 100% of the 280x280 viewport at zoom=1
  const baseScale = Math.max(VIEWPORT / natW, VIEWPORT / natH);
  const displayW = natW * baseScale * zoom;
  const displayH = natH * baseScale * zoom;

  const clampOffset = useCallback(
    (x: number, y: number, z = zoom, rot = rotation) => {
      if (!img) return { x: 0, y: 0 };
      return computeClamp(img, x, y, z, rot);
    },
    [img, zoom, rotation, computeClamp],
  );

  const handleZoomChange = (nextZoom: number) => {
    const z = Math.min(3, Math.max(1, Number(nextZoom.toFixed(2))));
    setZoom(z);
    setOffset((prev) => clampOffset(prev.x, prev.y, z, rotation));
  };

  const handleRotate = () => {
    const nextRot = (rotation + 90) % 360;
    setRotation(nextRot);
    setOffset((prev) => clampOffset(prev.x, prev.y, zoom, nextRot));
  };

  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setOffset({ x: 0, y: 0 });
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragging.current = { startX: e.clientX, startY: e.clientY, origX: offset.x, origY: offset.y };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    const dx = e.clientX - dragging.current.startX;
    const dy = e.clientY - dragging.current.startY;
    setOffset(clampOffset(dragging.current.origX + dx, dragging.current.origY + dy));
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragging.current) {
      e.currentTarget.releasePointerCapture(e.pointerId);
      dragging.current = null;
    }
  };

  const onWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.1 : -0.1;
    handleZoomChange(zoom + delta);
  };

  const handleSave = () => {
    if (!img) return;
    const canvas = document.createElement('canvas');
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const ratio = OUTPUT_SIZE / VIEWPORT;
    const safeOffset = clampOffset(offset.x, offset.y, zoom, rotation);

    ctx.save();
    ctx.translate(OUTPUT_SIZE / 2 + safeOffset.x * ratio, OUTPUT_SIZE / 2 + safeOffset.y * ratio);
    ctx.rotate((rotation * Math.PI) / 180);
    // Add 2px bleed to prevent any sub-pixel edge artifacts around the canvas perimeter
    const drawScale = baseScale * zoom * ratio;
    const w = Math.ceil(img.naturalWidth * drawScale) + 2;
    const h = Math.ceil(img.naturalHeight * drawScale) + 2;
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    ctx.restore();

    onConfirm(canvas.toDataURL('image/jpeg', 0.92), {
      zoom,
      rotation,
      x: safeOffset.x,
      y: safeOffset.y,
    });
  };

  return (
    <Dialog open={imageSrc !== null} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crop className="h-4 w-4 text-primary" />
            Crop Profile Photo
          </DialogTitle>
          <DialogDescription>
            Drag to reposition and use the slider to zoom. Click Reset anytime to return to the original photo size.
          </DialogDescription>
        </DialogHeader>

        {/* Interactive Crop Viewport */}
        <div className="flex flex-col items-center gap-4 py-1">
          <div
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onWheel={onWheel}
            style={{ width: VIEWPORT, height: VIEWPORT }}
            className="relative overflow-hidden rounded-xl border border-border bg-slate-900 select-none touch-none cursor-grab active:cursor-grabbing shadow-soft"
          >
            {img && (
              <img
                src={imageSrc!}
                alt="Crop preview"
                draggable={false}
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  width: swapped ? displayH : displayW,
                  height: swapped ? displayW : displayH,
                  maxWidth: 'none',
                  transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) rotate(${rotation}deg)`,
                  transformOrigin: 'center center',
                }}
              />
            )}

            {/* Subtle circular + rule-of-thirds overlay */}
            <div
              className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-white/85"
              style={{ boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.38)' }}
            />
            <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-25">
              <div className="border-r border-b border-white" />
              <div className="border-r border-b border-white" />
              <div className="border-b border-white" />
              <div className="border-r border-b border-white" />
              <div className="border-r border-b border-white" />
              <div className="border-b border-white" />
              <div className="border-r border-white" />
              <div className="border-r border-white" />
              <div />
            </div>
          </div>

          {/* Zoom & Rotate Controls */}
          <div className="w-full space-y-3">
            <div className="flex items-center gap-3">
              <ZoomOut className="h-4 w-4 text-muted-foreground shrink-0" />
              <Slider
                min={1}
                max={3}
                step={0.05}
                value={[zoom]}
                onValueChange={([v]) => handleZoomChange(v)}
                aria-label="Zoom"
              />
              <ZoomIn className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="w-10 text-right font-mono text-xs text-muted-foreground">{Math.round(zoom * 100)}%</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Button type="button" variant="outline" size="sm" onClick={handleRotate}>
                  <RotateCw className="h-3.5 w-3.5" />
                  Rotate 90°
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={handleReset} className="text-muted-foreground">
                  <RotateCcw className="h-3.5 w-3.5" />
                  Original Size
                </Button>
              </div>
              <span className="text-[11px] text-muted-foreground">Drag to pan</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={!img}>
            Apply Photo
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
