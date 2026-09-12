import { useState, useEffect } from "react";

// Samples the image and averages only the VIVID foreground pixels —
// skips near-black/low-saturation background pixels, since our game
// banners all sit on dark canvases that would otherwise dominate
// the average and produce a muddy, dark accent color.
export function useDominantColor(src, fallback = "#f0b90b") {
  const [color, setColor] = useState(fallback);

  useEffect(() => {
    if (!src) return;

    const img = new Image();
    img.onload = () => {
      try {
        const size = 40;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);

        let r = 0, g = 0, b = 0, count = 0;

        for (let i = 0; i < data.length; i += 4) {
          const pr = data[i], pg = data[i + 1], pb = data[i + 2];
          const brightness = (pr + pg + pb) / 3;
          const max = Math.max(pr, pg, pb);
          const min = Math.min(pr, pg, pb);
          const saturation = max === 0 ? 0 : (max - min) / max;

          // Skip dark background pixels — only count vivid foreground artwork
          if (brightness < 45 || (saturation < 0.15 && brightness < 120)) continue;

          r += pr; g += pg; b += pb; count++;
        }

        if (count === 0) {
          setColor(fallback);
          return;
        }

        r = Math.round(r / count);
        g = Math.round(g / count);
        b = Math.round(b / count);

        const toHex = (v) => Math.min(255, v).toString(16).padStart(2, "0");
        setColor(`#${toHex(r)}${toHex(g)}${toHex(b)}`);
      } catch {
        setColor(fallback);
      }
    };
    img.onerror = () => setColor(fallback);
    img.src = src;
  }, [src, fallback]);

  return color;
}