#!/usr/bin/env node
/**
 * TechZone product artwork generator.
 * Creates premium local SVGs in client/public/images/products/ so the store
 * never depends on a fragile external image host.
 * Run: node scripts/generate-images.js
 */
const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, '..', 'client', 'public', 'images', 'products');

const CYAN = '#22d3ee';
const VIOLET = '#a78bfa';
const BLUE = '#60a5fa';

let uid = 0;
const nid = () => `gz${++uid}`;

const makeScene = () => {
  const defs = [];
  const els = [];
  return {
    defs,
    els,
    glow(cx, cy, rx, ry, color, op = 0.5) {
      const id = nid();
      defs.push(
        `<radialGradient id="${id}"><stop offset="0" stop-color="${color}" stop-opacity="${op}"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient>`
      );
      els.push(`<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#${id})"/>`);
    },
    rect(x, y, w, h, rx, fill, extra = '') {
      els.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" ${extra}/>`);
    },
    line(x1, y1, x2, y2, stroke, w = 3, extra = '') {
      els.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${w}" ${extra}/>`);
    },
    circle(cx, cy, r, fill, extra = '') {
      els.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" ${extra}/>`);
    },
    ellipse(cx, cy, rx, ry, fill, extra = '') {
      els.push(`<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" ${extra}/>`);
    },
    path(d, fill = 'none', stroke = '', w = 0, extra = '') {
      const st = stroke ? ` stroke="${stroke}" stroke-width="${w}" stroke-linecap="round"` : '';
      els.push(`<path d="${d}" fill="${fill}"${st} ${extra}/>`);
    },
    gridKeys(x, y, w, h, cols, rows, fill, gap = 6) {
      const kw = (w - (cols - 1) * gap) / cols;
      const kh = (h - (rows - 1) * gap) / rows;
      let out = '';
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++)
          out += `<rect x="${(x + c * (kw + gap)).toFixed(1)}" y="${(y + r * (kh + gap)).toFixed(1)}" width="${kw.toFixed(1)}" height="${kh.toFixed(1)}" rx="4" fill="${fill}"/>`;
      els.push(out);
    },
  };
};

// ---------- device drawings ----------

const laptop = (s, { accent = CYAN } = {}) => {
  const w = 440, h = 280, x = 400 - w / 2, y = 130;
  s.glow(400, 470, 300, 90, accent);
  s.rect(x, y, w, h, 14, 'url(#gScreen)', `stroke="${accent}" stroke-opacity="0.65" stroke-width="2.5"`);
  s.line(x + 44, y + h - 66, x + w - 60, y + h - 34, accent, 2, 'stroke-opacity="0.7"');
  s.circle(x + w - 34, y + 30, 5, accent, 'opacity="0.8"');
  s.rect(x + 30, y + h + 8, w - 60, 26, 8, 'url(#gMetal)', `stroke="${accent}" stroke-opacity="0.35"`);
  s.rect(x + 60, y + h + 13, w - 120, 6, 3, accent, 'opacity="0.35"');
};

const keyboard = (s, { accent = CYAN, tkl = false } = {}) => {
  const w = tkl ? 420 : 490, x = 400 - w / 2, y = 295;
  s.glow(400, y + 80, w * 0.62, 95, accent);
  s.rect(x, y, w, 140, 14, 'url(#gMetal)', `stroke="${accent}" stroke-opacity="0.6" stroke-width="2"`);
  s.gridKeys(x + 16, y + 16, w - 32, 82, tkl ? 14 : 16, 4, 'url(#gScreen)');
  s.rect(x + 16, y + 104, w - 32, 20, 6, accent, 'opacity="0.3"');
};

const mouse = (s, { accent = CYAN } = {}) => {
  s.glow(400, 430, 220, 160, accent);
  s.ellipse(400, 420, 122, 152, 'url(#gMetal)', `stroke="${accent}" stroke-opacity="0.6" stroke-width="2"`);
  s.line(400, 372, 400, 548, '#0b0e1a', 3);
  s.rect(390, 314, 20, 50, 10, accent, 'opacity="0.9"');
  s.ellipse(400, 300, 60, 26, accent, 'opacity="0.14"');
};

const headset = (s, { accent = CYAN } = {}) => {
  s.glow(400, 400, 260, 210, accent);
  s.path('M 245 430 A 155 155 0 0 1 555 430', 'none', '#2a3352', 34);
  s.path('M 245 430 A 155 155 0 0 1 555 430', 'none', accent, 7, 'opacity="0.75"');
  s.ellipse(250, 445, 44, 68, 'url(#gMetal)', `stroke="${accent}" stroke-opacity="0.55" stroke-width="2"`);
  s.ellipse(550, 445, 44, 68, 'url(#gMetal)', `stroke="${accent}" stroke-opacity="0.55" stroke-width="2"`);
  s.ellipse(250, 445, 22, 46, accent, 'opacity="0.32"');
  s.ellipse(550, 445, 22, 46, accent, 'opacity="0.32"');
  s.path('M 252 512 Q 268 585 348 590', 'none', '#2a3352', 10);
  s.circle(352, 590, 11, accent, 'opacity="0.85"');
};

const earbuds = (s, { accent = CYAN } = {}) => {
  s.glow(400, 430, 235, 175, accent);
  s.circle(330, 295, 40, 'url(#gMetal)', `stroke="${accent}" stroke-opacity="0.6" stroke-width="2"`);
  s.circle(470, 295, 40, 'url(#gMetal)', `stroke="${accent}" stroke-opacity="0.6" stroke-width="2"`);
  s.circle(330, 295, 15, accent, 'opacity="0.5"');
  s.circle(470, 295, 15, accent, 'opacity="0.5"');
  s.rect(322, 328, 16, 66, 8, 'url(#gMetal)', `stroke="#2a3352"`);
  s.rect(462, 328, 16, 66, 8, 'url(#gMetal)', `stroke="#2a3352"`);
  s.rect(280, 400, 240, 128, 30, 'url(#gMetal)', `stroke="${accent}" stroke-opacity="0.55" stroke-width="2"`);
  s.rect(280, 430, 240, 5, 2.5, accent, 'opacity="0.4"');
  s.circle(400, 478, 7, accent);
};

const monitor = (s, { accent = CYAN, ratio = 1.6 } = {}) => {
  const w = 500, h = Math.round(500 / ratio), x = 150, y = Math.round(300 - h / 2);
  s.glow(400, y + h / 2, 300, 170, accent);
  s.rect(x, y, w, h, 12, 'url(#gScreen)', `stroke="${accent}" stroke-opacity="0.65" stroke-width="2.5"`);
  s.line(x + 50, y + h - 56, x + w - 90, y + h - 26, accent, 2, 'stroke-opacity="0.7"');
  s.circle(x + w - 30, y + 26, 5, accent, 'opacity="0.8"');
  s.rect(385, y + h + 8, 30, 46, 6, 'url(#gMetal)');
  s.rect(310, y + h + 54, 180, 12, 6, 'url(#gMetal)', `stroke="#2a3352"`);
};

const controller = (s, { accent = CYAN } = {}) => {
  s.glow(400, 420, 265, 170, accent);
  s.ellipse(400, 420, 188, 108, 'url(#gMetal)', `stroke="${accent}" stroke-opacity="0.5" stroke-width="2"`);
  s.circle(262, 452, 58, 'url(#gMetal)');
  s.circle(538, 452, 58, 'url(#gMetal)');
  s.circle(336, 392, 26, '#10152a', `stroke="${accent}" stroke-opacity="0.6" stroke-width="2"`);
  s.circle(336, 392, 10, accent, 'opacity="0.55"');
  s.circle(464, 452, 26, '#10152a', `stroke="${accent}" stroke-opacity="0.6" stroke-width="2"`);
  s.circle(464, 452, 10, accent, 'opacity="0.55"');
  s.rect(344, 448, 56, 15, 4, accent, 'opacity="0.5"');
  s.rect(364.5, 427.5, 15, 56, 4, accent, 'opacity="0.5"');
  s.circle(492, 388, 9, accent, 'opacity="0.9"');
  s.circle(492, 356, 9, accent, 'opacity="0.9"');
  s.circle(476, 372, 9, accent, 'opacity="0.9"');
  s.circle(508, 372, 9, accent, 'opacity="0.9"');
};

const speaker = (s, { accent = CYAN } = {}) => {
  s.glow(400, 420, 225, 210, accent);
  s.rect(310, 255, 180, 305, 40, 'url(#gMetal)', `stroke="${accent}" stroke-opacity="0.55" stroke-width="2"`);
  for (let i = 0; i < 5; i++) s.line(332, 330 + i * 26, 468, 330 + i * 26, accent, 3, 'opacity="0.14"');
  s.ellipse(400, 262, 88, 15, 'url(#gScreen)', `stroke="${accent}" stroke-opacity="0.5" stroke-width="2"`);
  s.circle(400, 545, 7, accent);
};

const mic = (s, { accent = CYAN } = {}) => {
  s.glow(400, 380, 225, 190, accent);
  s.ellipse(400, 355, 82, 102, 'url(#gMetal)', `stroke="${accent}" stroke-opacity="0.6" stroke-width="2.5"`);
  for (let i = 0; i < 4; i++) s.line(356 + i * 30, 285, 356 + i * 30, 425, accent, 2, 'opacity="0.18"');
  s.ellipse(400, 470, 96, 18, 'none', `stroke="${accent}" stroke-width="6" stroke-opacity="0.55"`);
  s.rect(392, 490, 16, 68, 8, 'url(#gMetal)');
  s.ellipse(400, 572, 92, 15, 'url(#gMetal)', `stroke="#2a3352"`);
  s.circle(400, 432, 8, accent);
};

const ssd = (s, { accent = CYAN, nvme = false } = {}) => {
  s.glow(400, 420, 250, 160, accent);
  if (nvme) {
    s.rect(225, 345, 350, 115, 10, 'url(#gMetal)', `stroke="${accent}" stroke-opacity="0.6" stroke-width="2"`);
    s.gridKeys(255, 372, 210, 62, 3, 2, 'url(#gScreen)', 10);
    s.rect(480, 372, 62, 62, 8, accent, 'opacity="0.2"');
    s.rect(225, 345, 350, 8, 4, accent, 'opacity="0.45"');
  } else {
    s.rect(235, 300, 330, 205, 18, 'url(#gMetal)', `stroke="${accent}" stroke-opacity="0.6" stroke-width="2"`);
    s.rect(265, 340, 170, 12, 6, accent, 'opacity="0.35"');
    s.rect(265, 370, 120, 12, 6, accent, 'opacity="0.2"');
    s.circle(525, 460, 8, accent);
    s.rect(505, 330, 36, 14, 7, '#94a3b8', 'opacity="0.7"');
  }
};

const ram = (s, { accent = CYAN } = {}) => {
  s.glow(400, 415, 265, 145, accent);
  s.rect(215, 340, 370, 118, 8, 'url(#gMetal)', `stroke="${accent}" stroke-opacity="0.6" stroke-width="2"`);
  s.gridKeys(248, 366, 236, 68, 4, 2, 'url(#gScreen)', 9);
  s.rect(215, 340, 370, 10, 5, accent, 'opacity="0.45"');
  s.gridKeys(232, 452, 336, 9, 20, 1, accent, 4);
};

const charger = (s, { accent = CYAN } = {}) => {
  s.glow(400, 415, 210, 165, accent);
  s.rect(300, 290, 200, 225, 26, 'url(#gMetal)', `stroke="${accent}" stroke-opacity="0.6" stroke-width="2"`);
  s.rect(336, 336, 36, 13, 6, accent, 'opacity="0.85"');
  s.rect(388, 336, 36, 13, 6, '#94a3b8', 'opacity="0.7"');
  s.rect(440, 336, 26, 13, 6, '#94a3b8', 'opacity="0.7"');
  s.path('M 412 378 L 378 442 L 402 442 L 388 494 L 430 424 L 404 424 Z', accent);
  s.path('M 500 420 C 578 420 578 522 502 522', 'none', '#2a3352', 11);
};

const hub = (s, { accent = CYAN } = {}) => {
  s.glow(400, 410, 255, 145, accent);
  s.rect(230, 345, 340, 128, 22, 'url(#gMetal)', `stroke="${accent}" stroke-opacity="0.6" stroke-width="2"`);
  for (let i = 0; i < 4; i++) s.rect(262 + i * 70, 380, 46, 13, 6, accent, 'opacity="0.7"');
  s.rect(262, 432, 74, 9, 4, '#94a3b8', 'opacity="0.6"');
  s.rect(262, 402, 74, 9, 4, accent, 'opacity="0.3"');
  s.path('M 570 392 C 648 392 648 306 566 306', 'none', '#2a3352', 11);
  s.rect(550, 298, 26, 17, 5, accent, 'opacity="0.65"');
};

const adapter = (s, { accent = CYAN } = {}) => {
  s.glow(400, 415, 230, 145, accent);
  s.rect(270, 335, 260, 155, 20, 'url(#gMetal)', `stroke="${accent}" stroke-opacity="0.6" stroke-width="2"`);
  s.rect(300, 372, 62, 17, 4, accent, 'opacity="0.75"');
  s.rect(300, 412, 62, 17, 4, '#94a3b8', 'opacity="0.6"');
  s.rect(392, 372, 42, 17, 4, '#94a3b8', 'opacity="0.6"');
  s.rect(392, 412, 42, 17, 4, '#94a3b8', 'opacity="0.6"');
  s.rect(464, 372, 42, 17, 4, accent, 'opacity="0.45"');
  s.path('M 530 412 C 588 412 588 352 534 352', 'none', '#2a3352', 10);
};

const cable = (s, { accent = CYAN } = {}) => {
  s.glow(400, 425, 245, 160, accent);
  const d = 'M 262 425 C 262 322 538 322 538 425 C 538 505 336 505 336 432 C 336 368 472 368 472 430';
  s.path(d, 'none', '#2a3352', 17);
  s.path(d, 'none', accent, 5, 'opacity="0.7"');
  s.rect(226, 408, 42, 32, 9, 'url(#gMetal)', `stroke="${accent}" stroke-opacity="0.6" stroke-width="2"`);
  s.rect(216, 416, 12, 16, 4, accent, 'opacity="0.85"');
  s.rect(532, 412, 42, 32, 9, 'url(#gMetal)', `stroke="${accent}" stroke-opacity="0.6" stroke-width="2"`);
  s.rect(572, 420, 12, 16, 4, accent, 'opacity="0.85"');
};

const webcam = (s, { accent = CYAN } = {}) => {
  s.glow(400, 370, 205, 185, accent);
  s.circle(400, 355, 112, 'url(#gMetal)', `stroke="${accent}" stroke-opacity="0.55" stroke-width="2.5"`);
  s.circle(400, 355, 64, '#0b0e1a', `stroke="${accent}" stroke-opacity="0.7" stroke-width="3"`);
  s.circle(400, 355, 34, 'url(#gScreen)');
  s.circle(382, 336, 10, accent, 'opacity="0.8"');
  s.circle(474, 292, 7, accent);
  s.rect(330, 468, 140, 26, 10, 'url(#gMetal)', 'stroke="#2a3352"');
  s.rect(352, 494, 96, 10, 5, 'url(#gMetal)');
};

const stand = (s, { accent = CYAN } = {}) => {
  s.glow(400, 450, 245, 155, accent);
  s.rect(283, 258, 234, 42, 8, 'url(#gScreen)', `stroke="${accent}" stroke-opacity="0.5" stroke-width="2"`);
  s.rect(283, 296, 234, 4, 2, accent, 'opacity="0.45"');
  s.rect(258, 300, 284, 15, 7, 'url(#gMetal)', `stroke="${accent}" stroke-opacity="0.5" stroke-width="2"`);
  s.line(302, 315, 344, 502, '#2a3352', 18);
  s.line(498, 315, 456, 502, '#2a3352', 18);
  s.rect(300, 502, 200, 14, 7, 'url(#gMetal)', `stroke="#2a3352"`);
};

const pad = (s, { accent = CYAN } = {}) => {
  s.glow(400, 430, 305, 125, accent);
  s.rect(158, 342, 484, 178, 18, 'url(#gMetal)', `stroke="${accent}" stroke-opacity="0.5" stroke-width="2"`);
  s.rect(158, 342, 484, 6, 3, accent, 'opacity="0.5"');
  s.rect(174, 356, 452, 150, 12, 'none', `stroke="${accent}" stroke-opacity="0.22" stroke-dasharray="10 8"`);
  s.ellipse(400, 430, 46, 62, 'url(#gScreen)', `stroke="${accent}" stroke-opacity="0.5" stroke-width="2"`);
};

// ---------- jobs ----------

const jobs = [
  ['phantom-x-laptop', (s) => laptop(s, { accent: CYAN })],
  ['core-gaming-laptop', (s) => laptop(s, { accent: VIOLET })],
  ['vega-creator-laptop', (s) => laptop(s, { accent: VIOLET })],
  ['probook-15', (s) => laptop(s, { accent: BLUE })],
  ['rgb-mechanical-keyboard', (s) => keyboard(s, { accent: CYAN })],
  ['tkl-mechanical-keyboard', (s) => keyboard(s, { accent: VIOLET, tkl: true })],
  ['wireless-gaming-mouse', (s) => mouse(s, { accent: CYAN })],
  ['gaming-headset', (s) => headset(s, { accent: VIOLET })],
  ['anc-headphones', (s) => headset(s, { accent: CYAN })],
  ['wireless-earbuds', (s) => earbuds(s, { accent: CYAN })],
  ['streaming-microphone', (s) => mic(s, { accent: VIOLET })],
  ['bluetooth-speaker', (s) => speaker(s, { accent: CYAN })],
  ['monitor-27-144hz', (s) => monitor(s, { accent: CYAN })],
  ['monitor-24-office', (s) => monitor(s, { accent: BLUE })],
  ['monitor-34-ultrawide', (s) => monitor(s, { accent: VIOLET, ratio: 2.39 })],
  ['gaming-controller', (s) => controller(s, { accent: VIOLET })],
  ['gaming-mousepad-xl', (s) => pad(s, { accent: CYAN })],
  ['gan-charger-100w', (s) => charger(s, { accent: CYAN })],
  ['usbc-hub-8in1', (s) => hub(s, { accent: CYAN })],
  ['multiport-adapter', (s) => adapter(s, { accent: VIOLET })],
  ['usbc-cable-2m', (s) => cable(s, { accent: CYAN })],
  ['webcam-fhd', (s) => webcam(s, { accent: BLUE })],
  ['laptop-stand', (s) => stand(s, { accent: CYAN })],
  ['external-ssd-1tb', (s) => ssd(s, { accent: CYAN })],
  ['nvme-ssd-2tb', (s) => ssd(s, { accent: VIOLET, nvme: true })],
  ['ddr5-ram-16gb', (s) => ram(s, { accent: CYAN })],
];

const buildSvg = (draw) => {
  uid = 0;
  const s = makeScene();
  draw(s);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800">
<defs>
<linearGradient id="gBg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d101f"/><stop offset="1" stop-color="#070910"/></linearGradient>
<linearGradient id="gScreen" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#141a30"/><stop offset="1" stop-color="#0a0d1c"/></linearGradient>
<linearGradient id="gMetal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#262e4a"/><stop offset="1" stop-color="#141a2e"/></linearGradient>
${s.defs.join('\n')}
</defs>
<rect width="800" height="800" fill="url(#gBg)"/>
${s.els.join('\n')}
</svg>`;
};

const run = () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  for (const [slug, draw] of jobs) {
    fs.writeFileSync(path.join(OUT_DIR, `${slug}.svg`), buildSvg(draw));
  }
  console.log(`✔ Wrote ${jobs.length} product images → ${OUT_DIR}`);

  // Favicon
  const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
<rect width="64" height="64" rx="14" fill="#0b0e1a"/>
<path d="M32 6 L54 18 V46 L32 58 L10 46 V18 Z" fill="none" stroke="#22d3ee" stroke-width="3"/>
<path d="M22 22 H42" stroke="#22d3ee" stroke-width="5" stroke-linecap="round"/>
<path d="M32 24 V44" stroke="#a78bfa" stroke-width="5" stroke-linecap="round"/>
</svg>`;
  const pubDir = path.join(__dirname, '..', 'client', 'public');
  fs.mkdirSync(pubDir, { recursive: true });
  fs.writeFileSync(path.join(pubDir, 'favicon.svg'), favicon);
  console.log('✔ Wrote favicon.svg');
};

run();
