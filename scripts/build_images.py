"""Generate responsive WebP versions of every image under images/,
plus a 1200px JPEG per image for link previews.

Reads masters from images/, writes resized copies to assets/img/ and a size
index to _data/images.json (used by _includes/picture.html for srcset and
width/height). Only images whose content changed are re-processed.

Usage: python scripts/build_images.py
"""
import hashlib, io, json, os, sys
from PIL import Image, ImageCms, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "images")
OUT = os.path.join(ROOT, "assets", "img")
INDEX = os.path.join(ROOT, "_data", "images.json")
WIDTHS = [320, 640, 1280, 1920, 2880]
SHARE_WIDTH = 1200  # JPEG used for link previews (og:image)
QUALITY = 90
EXTS = (".jpg", ".jpeg", ".png", ".webp", ".gif", ".tif", ".tiff")
SRGB = ImageCms.createProfile("sRGB")


def to_srgb(im):
    """Convert to sRGB (RGB or RGBA), honoring any embedded color profile."""
    im = ImageOps.exif_transpose(im)
    icc = im.info.get("icc_profile")
    has_alpha = im.mode in ("RGBA", "LA") or (im.mode == "P" and "transparency" in im.info)
    target = "RGBA" if has_alpha else "RGB"
    if icc:
        try:
            src = ImageCms.ImageCmsProfile(io.BytesIO(icc))
            if im.mode == "P":
                im = im.convert(target)
            return ImageCms.profileToProfile(im, src, SRGB, outputMode=target)
        except Exception:
            pass
    return im.convert(target)


def widths_for(w0):
    widths = [w for w in WIDTHS if w < w0]
    if w0 <= WIDTHS[-1]:
        widths.append(w0)
    return widths


def main():
    index = {}
    if os.path.exists(INDEX):
        with open(INDEX, encoding="utf-8") as f:
            index = json.load(f)
    seen = set()
    for dirpath, _, files in os.walk(SRC):
        for name in sorted(files):
            if not name.lower().endswith(EXTS):
                continue
            path = os.path.join(dirpath, name)
            rel = os.path.relpath(path, SRC).replace(os.sep, "/")
            seen.add(rel)
            with open(path, "rb") as fh:
                digest = hashlib.sha1(fh.read()).hexdigest()
            stem = os.path.splitext(rel)[0]
            entry = index.get(rel)
            if entry and entry.get("sha1") == digest and entry["widths"] == widths_for(entry["width"]) and all(
                os.path.exists(os.path.join(OUT, f"{stem}-{w}.webp")) for w in entry["widths"]
            ) and os.path.exists(os.path.join(OUT, f"{stem}-share.jpg")):
                continue
            im = to_srgb(Image.open(path))
            w0, h0 = im.size
            widths = widths_for(w0)
            os.makedirs(os.path.dirname(os.path.join(OUT, stem)), exist_ok=True)
            for w in widths:
                h = round(h0 * w / w0)
                out = im if w == w0 else im.resize((w, h), Image.LANCZOS)
                out.save(os.path.join(OUT, f"{stem}-{w}.webp"), "WEBP", quality=QUALITY, method=6)
            share = im.convert("RGBA")
            flat = Image.new("RGB", share.size, "white")
            flat.paste(share, mask=share.split()[3])
            if w0 > SHARE_WIDTH:
                flat = flat.resize((SHARE_WIDTH, round(h0 * SHARE_WIDTH / w0)), Image.LANCZOS)
            flat.save(os.path.join(OUT, f"{stem}-share.jpg"), "JPEG", quality=85, optimize=True, progressive=True)
            index[rel] = {"stem": stem, "width": w0, "height": h0, "widths": widths, "sha1": digest}
            print(f"{rel}: {w0}x{h0} -> {widths}", flush=True)
    for rel in list(index):
        if rel not in seen:
            del index[rel]
    os.makedirs(os.path.dirname(INDEX), exist_ok=True)
    with open(INDEX, "w", encoding="utf-8") as f:
        json.dump(index, f, indent=1, sort_keys=True)
    print(f"{len(index)} images indexed", flush=True)


if __name__ == "__main__":
    sys.exit(main())
