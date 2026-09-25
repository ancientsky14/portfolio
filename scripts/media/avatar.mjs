/**
 * The rail portrait, in both themes — Jan, 2026-09-25.
 *
 *   public/avatar.webp       black hoodie, light theme
 *   public/avatar-dark.webp  white hoodie, dark theme
 *
 * The two are stacked in the rail and the mobile bar and crossfaded by
 * `.dark` (design/tokens.css), so they must line up pixel for pixel: both
 * come out of the one `frame()` below, and the script refuses two sources of
 * different sizes. The sources are two remove.bg cutouts of the same shot —
 * same pose, only the hoodie differs.
 *
 *   node scripts/media/avatar.mjs
 *
 * The cutouts and the original photos stay in gitignored tmp-shots/; never
 * commit them. AVATAR_LIGHT / AVATAR_DARK override the paths. sharp is
 * Next's own dependency, not one of the site's.
 */

import fs from "node:fs";
import sharp from "sharp";

const LIGHT = process.env.AVATAR_LIGHT ?? "tmp-shots/portfolio_img-removebg-2026-09-25.png";
const DARK = process.env.AVATAR_DARK ?? "tmp-shots/portfolio_img-white-removebg-2026-09-25.png";

// Framing, in source pixels (the cutouts are 433×577). Matched to what the
// `.avatar-mark` crop in design/tokens.css assumes: hair ~6%, eyes ~36%,
// chin ~60%, face centred — source landmarks hair top y=62, eyes y=228,
// chin y=356, face centre x=222. The cutout is narrower than the square, so
// its side edges are feathered to transparent and padded; copying the edge
// pixels outward instead streaked the shoulders.
const FEATHER = 70;
const PAD_L = 48;
const PAD_R = 59;
const CROP_TOP = 30;
const SIDE = 540;
const OUT = 512;

const smooth = (t) => {
  t = Math.min(1, Math.max(0, t));
  return t * t * (3 - 2 * t);
};

async function frame(src) {
  const { data, info } = await sharp(src)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const k = Math.min(smooth(x / FEATHER), smooth((w - 1 - x) / FEATHER));
      const i = (y * w + x) * 4 + 3;
      data[i] = Math.round(data[i] * k);
    }
  }
  // sharp runs extract before extend inside one pipeline, so two passes.
  const wide = await sharp(data, { raw: { width: w, height: h, channels: 4 } })
    .extend({ left: PAD_L, right: PAD_R, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  const webp = await sharp(wide)
    .extract({ left: 0, top: CROP_TOP, width: SIDE, height: SIDE })
    .resize(OUT, OUT, { kernel: "lanczos3" })
    .webp({ quality: 84, alphaQuality: 90, effort: 6 })
    .toBuffer();
  return { webp, w, h };
}

const [light, dark] = await Promise.all([frame(LIGHT), frame(DARK)]);
if (light.w !== dark.w || light.h !== dark.h) {
  throw new Error(
    `sources differ: ${light.w}×${light.h} vs ${dark.w}×${dark.h} — the themes would not line up`,
  );
}

fs.writeFileSync("public/avatar.webp", light.webp);
fs.writeFileSync("public/avatar-dark.webp", dark.webp);
console.log(`avatar.webp ${light.webp.length} B · avatar-dark.webp ${dark.webp.length} B`);
