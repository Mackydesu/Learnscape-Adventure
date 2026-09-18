from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
BACKGROUND_DIR = ROOT / "assets" / "Backgrounds"
OUTPUT_DIR = ROOT / "assets" / "Shape UI" / "Parking"

SHAPES = [
    ("bakery", "star", 616, 629, 166, 109),
    ("bakery", "diamond", 916, 626, 174, 119),
    ("bakery", "rectangle", 1212, 652, 209, 71),
    ("bookstore", "circle", 749, 642, 137, 98),
    ("bookstore", "rectangle", 1017, 653, 194, 76),
    ("bookstore", "triangle", 1347, 644, 148, 87),
    ("toyshop", "rectangle", 564, 663, 219, 61),
    ("toyshop", "heart", 918, 649, 171, 94),
    ("toyshop", "square", 1253, 648, 171, 90),
]


def enclosed_shape_mask(crop: Image.Image) -> Image.Image:
    rgb = np.asarray(crop.convert("RGB"), dtype=np.int16)
    maximum = rgb.max(axis=2)
    minimum = rgb.min(axis=2)
    bright_outline = (
        (rgb[:, :, 0] > 205)
        & (rgb[:, :, 1] > 205)
        & (rgb[:, :, 2] > 190)
        & ((maximum - minimum) < 60)
    )

    boundary = Image.fromarray((bright_outline * 255).astype(np.uint8), mode="L")
    boundary = boundary.filter(ImageFilter.MaxFilter(5))
    blocked = np.asarray(boundary, dtype=np.uint8) > 0
    height, width = blocked.shape
    outside = np.zeros((height, width), dtype=bool)
    queue = deque()

    for x in range(width):
        if not blocked[0, x]:
            outside[0, x] = True
            queue.append((x, 0))
        if not blocked[height - 1, x]:
            outside[height - 1, x] = True
            queue.append((x, height - 1))
    for y in range(height):
        if not blocked[y, 0]:
            outside[y, 0] = True
            queue.append((0, y))
        if not blocked[y, width - 1]:
            outside[y, width - 1] = True
            queue.append((width - 1, y))

    while queue:
        x, y = queue.popleft()
        for next_x, next_y in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if (
                0 <= next_x < width
                and 0 <= next_y < height
                and not blocked[next_y, next_x]
                and not outside[next_y, next_x]
            ):
                outside[next_y, next_x] = True
                queue.append((next_x, next_y))

    alpha = Image.fromarray((~outside * 255).astype(np.uint8), mode="L")
    return alpha.filter(ImageFilter.GaussianBlur(0.55))


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    backgrounds = {}

    for background_name, shape_name, x, y, width, height in SHAPES:
        if background_name not in backgrounds:
            backgrounds[background_name] = Image.open(
                BACKGROUND_DIR / f"{background_name}.webp"
            ).convert("RGBA")

        crop = backgrounds[background_name].crop((x, y, x + width, y + height))
        crop.putalpha(enclosed_shape_mask(crop))
        output_path = OUTPUT_DIR / f"{background_name}-{shape_name}.webp"
        crop.save(output_path, "WEBP", lossless=True, method=6)
        print(f"{output_path.relative_to(ROOT)} {width}x{height}")


if __name__ == "__main__":
    main()
