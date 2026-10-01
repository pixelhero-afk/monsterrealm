const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// CRC32 table
const crcTable = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  crcTable[i] = c >>> 0;
}

function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

function decodePNG(buf) {
  const w = buf.readUInt32BE(16);
  const h = buf.readUInt32BE(20);
  const colorType = buf[25];
  let pos = 8;
  const idatChunks = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.slice(pos + 4, pos + 8).toString('ascii');
    if (type === 'IDAT') idatChunks.push(buf.slice(pos + 8, pos + 8 + len));
    pos += 12 + len;
  }
  const raw = zlib.inflateSync(Buffer.concat(idatChunks));
  const bpp = colorType === 6 ? 4 : 3;
  const stride = 1 + w * bpp;
  const data = Buffer.alloc(w * h * 4);
  let prevRow = Buffer.alloc(w * bpp);

  for (let y = 0; y < h; y++) {
    const filter = raw[y * stride];
    const row = Buffer.from(raw.slice(y * stride + 1, (y + 1) * stride));
    for (let x = 0; x < w * bpp; x++) {
      const a = x >= bpp ? row[x - bpp] : 0;
      const b = prevRow[x];
      const c = x >= bpp ? prevRow[x - bpp] : 0;
      if (filter === 1) row[x] = (row[x] + a) & 0xff;
      else if (filter === 2) row[x] = (row[x] + b) & 0xff;
      else if (filter === 3) row[x] = (row[x] + ((a + b) >> 1)) & 0xff;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        const pr = (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c);
        row[x] = (row[x] + pr) & 0xff;
      }
    }
    prevRow = row;
    for (let x = 0; x < w; x++) {
      const srcIdx = x * bpp;
      const dstIdx = (y * w + x) * 4;
      data[dstIdx] = row[srcIdx];
      data[dstIdx + 1] = row[srcIdx + 1];
      data[dstIdx + 2] = row[srcIdx + 2];
      data[dstIdx + 3] = bpp === 4 ? row[srcIdx + 3] : 255;
    }
  }
  return { w, h, data };
}

function encodePNG(w, h, rgba) {
  const stride = 1 + w * 4;
  const raw = Buffer.alloc(h * stride);
  for (let y = 0; y < h; y++) {
    raw[y * stride] = 0; // Filter None
    rgba.copy(raw, y * stride + 1, y * w * 4, (y + 1) * w * 4);
  }
  const compressed = zlib.deflateSync(raw, { level: 9 });

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  function makeChunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(8 + len + 4);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4, 4, 'ascii');
    data.copy(buf, 8);
    const crcVal = crc32(buf.slice(4, 8 + len));
    buf.writeUInt32BE(crcVal, 8 + len);
    return buf;
  }

  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));
  return Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]);
}

function removeBackground(w, h, data) {
  const total = w * h;
  const isBg = new Uint8Array(total);
  const queue = [];

  // Seed with image borders
  for (let x = 0; x < w; x++) {
    queue.push(x, 0, x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    queue.push(0, y, w - 1, y);
  }

  let head = 0;
  while (head < queue.length) {
    const x = queue[head++];
    const y = queue[head++];
    const idx = y * w + x;
    if (isBg[idx]) continue;

    const pIdx = idx * 4;
    const r = data[pIdx];
    const g = data[pIdx + 1];
    const b = data[pIdx + 2];

    const maxC = Math.max(r, g, b);
    const minC = Math.min(r, g, b);
    const diff = maxC - minC;

    // Background checkerboard / white / dark rules:
    // Saturation tolerance: checkerboard squares and solid backgrounds have diff <= 16
    // Also consider very high brightness (near white: r,g,b > 248 with diff <= 22)
    const isNeutral = diff <= 16;
    const isNearWhite = r > 246 && g > 246 && b > 246 && diff <= 20;

    if (!isNeutral && !isNearWhite) {
      continue;
    }

    isBg[idx] = 1;

    if (x > 0 && !isBg[idx - 1]) queue.push(x - 1, y);
    if (x < w - 1 && !isBg[idx + 1]) queue.push(x + 1, y);
    if (y > 0 && !isBg[idx - w]) queue.push(x, y - 1);
    if (y < h - 1 && !isBg[idx + w]) queue.push(x, y + 1);
  }

  // Create new RGBA buffer with true transparency
  const out = Buffer.from(data);

  // Mark all confirmed background pixels as completely transparent
  for (let i = 0; i < total; i++) {
    if (isBg[i]) {
      out[i * 4 + 3] = 0;
    }
  }

  // Defringe / edge smoothing:
  // For pixels adjacent to transparent background, check if they are anti-aliased edge artifacts
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = y * w + x;
      if (isBg[idx]) continue;

      // Check if neighboring transparent background
      const neighborsBg = isBg[idx - 1] || isBg[idx + 1] || isBg[idx - w] || isBg[idx + w];
      if (neighborsBg) {
        const pIdx = idx * 4;
        const r = out[pIdx], g = out[pIdx + 1], b = out[pIdx + 2];
        const diff = Math.max(r, g, b) - Math.min(r, g, b);

        // If very low saturation right at the boundary (e.g. gray anti-aliased transition),
        // soften the alpha to prevent harsh white/gray fringing
        if (diff <= 12) {
          out[pIdx + 3] = 0;
        } else if (diff <= 22) {
          out[pIdx + 3] = Math.min(out[pIdx + 3], Math.round(diff * 11));
        }
      }
    }
  }

  return out;
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const fullPath = path.join(dir, f);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (f.endsWith('.png')) {
      const buf = fs.readFileSync(fullPath);
      const { w, h, data } = decodePNG(buf);
      const transparentData = removeBackground(w, h, data);
      const outPng = encodePNG(w, h, transparentData);

      // Verify corners are now alpha = 0
      const cornerAlpha = transparentData[3];
      fs.writeFileSync(fullPath, outPng);
      console.log(`[Processed] ${fullPath} (${w}x${h}) -> saved transparent PNG (${outPng.length} bytes, corner alpha=${cornerAlpha})`);
    }
  }
}

const targetDir = path.join(process.cwd(), 'public', 'assets', 'characters');
console.log('Starting transparency conversion on:', targetDir);
processDirectory(targetDir);
console.log('Background transparency processing complete!');
