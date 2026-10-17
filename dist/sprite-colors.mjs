// Match the roster's hue-rotate(115deg) saturate(1.3), without relying on
// CanvasRenderingContext2D.filter. Cache colored sheets for every frame/route.
const shinySheets = new WeakMap();
const angle = 115 * Math.PI / 180, cos = Math.cos(angle), sin = Math.sin(angle);
const hue = [
  [.213 + cos * .787 - sin * .213, .715 - cos * .715 - sin * .715, .072 - cos * .072 + sin * .928],
  [.213 - cos * .213 + sin * .143, .715 + cos * .285 + sin * .140, .072 - cos * .072 - sin * .283],
  [.213 - cos * .213 - sin * .787, .715 - cos * .715 + sin * .715, .072 + cos * .928 + sin * .072],
];
const clamp = value => Math.max(0, Math.min(255, value));
export function tintShinyPixels(pixels) {
  for (let i = 0; i < pixels.length; i += 4) {
    if (!pixels[i + 3]) continue;
    const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
    const rotated = hue.map(row => clamp(row[0] * r + row[1] * g + row[2] * b));
    const luminance = rotated[0] * .213 + rotated[1] * .715 + rotated[2] * .072;
    for (let channel = 0; channel < 3; channel++) pixels[i + channel] = clamp(luminance + (rotated[channel] - luminance) * 1.3);
  }
  return pixels;
}
export function spriteVariant(image, shiny = false) {
  if (!image || !shiny) return image;
  if (!shinySheets.has(image)) {
    const sheet = document.createElement('canvas');
    sheet.width = image.naturalWidth || image.width;
    sheet.height = image.naturalHeight || image.height;
    const context = sheet.getContext('2d');
    context.drawImage(image, 0, 0);
    const pixels = context.getImageData(0, 0, sheet.width, sheet.height);
    tintShinyPixels(pixels.data);
    context.putImageData(pixels, 0, 0);
    shinySheets.set(image, sheet);
  }
  return shinySheets.get(image);
}
