const MANSE_ENDPOINT =
  "https://apis.data.go.kr/B090041/openapi/service/LrsrCldInfoService/getLunCalInfo";
const MANSE_SERVICE_KEY =
  "3134d72be9444fcbc44a7fc262a81438303524685143cc2791adaad168c3d707";

let userData = {};
let fortunePayload = null;
let fetchError = null;
let isLoading = true;
let canvasWidth = 720;
let canvasHeight = 520;
let symbolAssets = {};

// Translation Map for Hover Tooltip
const translationMap = {
  갑: "Gap (Yang Wood / Strong Growth)",
  을: "Eul (Yin Wood / Flexible)",
  병: "Byeong (Yang Fire / Radiant)",
  정: "Jeong (Yin Fire / Refined)",
  무: "Mu (Yang Earth / Solid)",
  기: "Gi (Yin Earth / Fertile)",
  경: "Gyeong (Yang Metal / Strong)",
  신: "Shin (Yin Metal / Polished)",
  임: "Im (Yang Water / Deep)",
  계: "Gye (Yin Water / Crisp)",
  자: "Ja (Rat / Intuition)",
  축: "Chuk (Ox / Calm)",
  인: "In (Tiger / Courage)",
  묘: "Myo (Rabbit / Harmony)",
  진: "Jin (Dragon / Change)",
  사: "Sa (Snake / Passion)",
  오: "Oh (Horse / Spotlight)",
  미: "Mi (Goat / Empathy)",
  신: "Shin (Monkey / Clarity)",
  유: "Yu (Rooster / Harvest)",
  술: "Sul (Dog / Protection)",
  해: "Hae (Pig / Inspiration)",
  일: "Sunday",
  월: "Monday",
  화: "Tuesday",
  수: "Wednesday",
  목: "Thursday",
  금: "Friday",
  토: "Saturday",
  "양/음 기호": "Yin/Yang Symbol",
  "오행 기호": "Five Elements Symbol",
};

const colorHexMap = {
  "Deep Green": "#006400",
  Burgundy: "#800020",
  Mustard: "#E1AD01",
  "Rose Gold": "#B76E79",
  Navy: "#000080",
  "Amber Glow": "#FFBF00",
  "Indigo Veil": "#4B0082",
  "Soft Coral": "#FF8B8B",
  "Forest Teal": "#008080",
  "Ivory Mist": "#FFFFF0",
  "Slate Blue": "#708090",
  "Rose Quartz": "#F7CAC9",
  "Burnt Sienna": "#E97451",
  "Moon Grey": "#A9A9A9",
  "Honey Gold": "#FFD700",
};

let currentTooltip = "";

const symbolAssetFiles = {
  plus: "Sol-Photoroom.png",
  minus: "moon-Photoroom.png",
  metal: "gold-Photoroom.png",
  earth: "sand-Photoroom.png",
  fire: "fire-Photoroom.png",
  water: "water-Photoroom.png",
  wood: "tree-Photoroom.png",
};

const headingFont = "Libre Baskerville";
const bodyFont = "Nanum Myeongjo";

function preload() {
  userData = getQueryParameters();
  symbolAssets = loadSymbolAssets();
}

function loadSymbolAssets() {
  const assets = {};
  Object.entries(symbolAssetFiles).forEach(([key, path]) => {
    assets[key] = loadImage(
      path,
      () => {},
      () => console.warn(path + " Load Failed")
    );
  });
  return assets;
}

function setup() {
  canvasWidth = constrain(windowWidth - 60, 360, 1020);
  canvasHeight = constrain(windowHeight - 80, 540, 980);
  createCanvas(canvasWidth, canvasHeight);
  textFont(bodyFont);
  textAlign(LEFT, TOP);
  fetchFortuneData();
}

function windowResized() {
  canvasWidth = constrain(windowWidth - 60, 360, 1020);
  canvasHeight = constrain(windowHeight - 80, 540, 980);
  resizeCanvas(canvasWidth, canvasHeight);
}

function draw() {
  background(243, 243, 243);
  currentTooltip = "";

  fill("#C04938");
  textSize(34);
  textFont(headingFont);
  text("YOUR SAZOO READING", 40, 30);
  textFont(bodyFont);

  const contentX = 40;
  const contentWidth = canvasWidth - contentX * 2;
  let displayY = 90;

  if (isLoading) {
    fill("#555");
    text("Loading fortune data...", contentX, displayY);
    return;
  }

  // Basic Information
  textSize(16);
  fill("#222222");
  text(`NAME : ${sanitizeValue(userData.name, "N/A")}`, contentX, displayY);
  displayY += 28;
  text(
    `BIRTHDAY : ${userData.year}-${userData.month}-${userData.date}`,
    contentX,
    displayY
  );
  displayY += 28;
  text(`GENDER : ${sanitizeValue(userData.gender, "N/A")}`, contentX, displayY);
  displayY += 36;

  // Divider Line (Shortened to 30%)
  stroke(192);
  const dividerWidth = contentWidth * 0.3;
  line(contentX, displayY, contentX + dividerWidth, displayY);
  noStroke();
  displayY += 24;

  const {
    lunar,
    summary,
    keyFocus,
    guidance,
    luckyColor,
    energyScore,
    symbols,
  } = fortunePayload;

  // Lunar Data & Hover Check
  fill("#363636");
  let lTxt = `LUNAR : ${lunar.lunYear}.${lunar.lunMonth}.${lunar.lunDay} (${lunar.lunIljin})`;
  text(lTxt, contentX, displayY);
  checkHover(
    lunar.lunIljin,
    contentX +
      textWidth(`LUNAR : ${lunar.lunYear}.${lunar.lunMonth}.${lunar.lunDay} (`),
    displayY
  );
  displayY += 26;

  let sTxt = `SECHA / WOLGEON : ${lunar.lunSecha} / ${lunar.lunWolgeon}`;
  text(sTxt, contentX, displayY);
  checkHover(
    lunar.lunSecha,
    contentX + textWidth(`SECHA / WOLGEON : `),
    displayY
  );
  checkHover(
    lunar.lunWolgeon,
    contentX + textWidth(`SECHA / WOLGEON : ${lunar.lunSecha} / `),
    displayY
  );
  displayY += 40;

  const layoutWide = canvasWidth >= 860;
  let textColumnWidth = layoutWide ? contentWidth * 0.55 : contentWidth;

  // Today's Message Section
  fill("#C04938");
  textSize(24);
  textFont(headingFont);
  text("TODAY'S MESSAGE", contentX, displayY);
  textFont(bodyFont);
  displayY += 45;

  let summaryHeight = drawWrappedText(
    summary,
    contentX,
    displayY,
    textColumnWidth,
    { fontSize: 17, lineSpacing: 1.5 }
  );
  displayY += summaryHeight + 25;

  // Visual Metrics (Color Swatch & Score Bar)
  displayY += renderFortuneVisuals(
    { keyFocus, guidance, luckyColor, energyScore },
    contentX,
    displayY,
    textColumnWidth
  );

  // Symbol Cards
  if (layoutWide) {
    drawSymbolShowcase(symbols, 90, {
      x: contentX + textColumnWidth + 40,
      availableWidth: contentWidth - textColumnWidth - 40,
      mode: "stack",
    });
  } else {
    drawSymbolShowcase(symbols, displayY + 20, {
      x: contentX,
      availableWidth: contentWidth,
      mode: "auto",
    });
  }

  // Tooltip Rendering
  if (currentTooltip !== "") {
    drawTooltip(currentTooltip, mouseX, mouseY);
    cursor(HAND);
  } else {
    cursor(ARROW);
  }
}

function drawSymbolCard(meta, x, y, width, height, caption) {
  push();
  fill(255, 248);
  noStroke();
  rect(x, y, width, height, 18);

  const padding = 20;
  const textAreaHeight = 100;
  const imageAreaHeight = height - textAreaHeight;
  const centerX = x + width / 2;
  const centerY = y + imageAreaHeight / 2 + 10;

  const img = symbolAssets[meta.assetKey];
  if (img) {
    let s = min(
      (width - padding * 2) / img.width,
      (imageAreaHeight - padding) / img.height
    );
    s *= 1.275; // Expanded 1.5x
    image(
      img,
      centerX - (img.width * s) / 2,
      centerY - (img.height * s) / 2,
      img.width * s,
      img.height * s
    );
  }

  // Symbol Overlay in the Center
  drawSymbolOverlay(
    meta.shape,
    centerX,
    centerY,
    min(width, imageAreaHeight) * 0.4
  );

  const tTop = y + height - 85;
  fill("#CF1818");
  textSize(13);
  text(caption, x + 20, tTop);
  checkHover(caption, x + 20, tTop);
  fill("#C04938");
  textSize(20);
  text(meta.title, x + 20, tTop + 24);
  fill("#444");
  textSize(13);
  text(meta.subtitle, x + 20, tTop + 46, width - 40);
  pop();
}

function drawSymbolOverlay(shape, cx, cy, sz) {
  push();
  fill("#C04938");
  noStroke();
  rectMode(CENTER);
  if (shape === "plus") {
    rect(cx, cy, sz, sz * 0.2);
    rect(cx, cy, sz * 0.2, sz);
  } else if (shape === "minus") {
    rect(cx, cy, sz, sz * 0.18);
  } else if (shape === "circle") {
    ellipse(cx, cy, sz, sz);
  } else if (shape === "square") {
    rect(cx, cy, sz, sz);
  } else if (shape === "triangle") {
    triangle(
      cx,
      cy - sz / 2,
      cx - sz / 2,
      cy + sz / 2,
      cx + sz / 2,
      cy + sz / 2
    );
  } else if (shape === "wave") {
    textAlign(CENTER, CENTER);
    textSize(sz * 1.2);
    text("~", cx, cy);
  } else if (shape === "line") {
    rect(cx, cy, sz * 0.2, sz);
  }
  pop();
}

function renderFortuneVisuals(details, x, y, width) {
  let startY = y;
  fill("#444");
  textSize(16);
  let h1 = drawWrappedText(`• Focus : ${details.keyFocus}`, x, y, width);
  y += h1 + 12;
  let h2 = drawWrappedText(`• Advice : ${details.guidance}`, x, y, width);
  y += h2 + 25;

  text("• Lucky Color : ", x, y);
  let lw = textWidth("• Lucky Color : ");
  let hex = colorHexMap[details.luckyColor] || "#CCC";
  push();
  stroke(200);
  fill(hex);
  rect(x + lw, y - 2, 22, 22, 4);
  noStroke();
  fill("#555");
  text(details.luckyColor, x + lw + 32, y);
  pop();
  y += 40;

  text(`• Energy Score : ${details.energyScore}%`, x, y);
  y += 24;
  let bw = min(width, 280);
  fill(225);
  noStroke();
  rect(x, y, bw, 10, 5);
  let sc =
    details.energyScore > 75
      ? "#C04938"
      : details.energyScore > 45
      ? "#E1AD01"
      : "#888";
  fill(sc);
  rect(x, y, (bw * details.energyScore) / 100, 10, 5);

  return y + 35 - startY;
}

function checkHover(txt, x, y) {
  let tw = textWidth(txt);
  if (mouseX > x && mouseX < x + tw && mouseY > y && mouseY < y + 18) {
    let m = [];
    for (let c of txt) if (translationMap[c]) m.push(translationMap[c]);
    if (translationMap[txt]) m = [translationMap[txt]];
    if (m.length > 0) currentTooltip = m.join(", ");
  }
}

function drawTooltip(msg, x, y) {
  push();
  textSize(14);
  let tw = textWidth(msg),
    p = 12;
  let rw = tw + p * 2,
    rh = 34;
  let tx = x - rw / 2,
    ty = y - rh - 15;
  fill(0, 30);
  rect(tx + 2, ty + 2, rw, rh, 4);
  fill("#C04938");
  rect(tx, ty, rw, rh, 4);
  triangle(x - 6, ty + rh, x + 6, ty + rh, x, ty + rh + 8);
  fill(255);
  textAlign(CENTER, CENTER);
  text(msg, x, ty + rh / 2);
  pop();
}

function drawSymbolShowcase(symbols = {}, startY, config = {}) {
  const { x, availableWidth, mode } = config;
  const single = mode === "stack" || availableWidth < 460;
  const cardW = single ? availableWidth : (availableWidth - 24) / 2;
  const cardH = 225;
  const pMeta = polaritySymbolMeta[symbols.polarity] || polaritySymbolMeta.yang;
  const eMeta = elementSymbolMeta[symbols.element] || elementSymbolMeta.earth;

  if (single) {
    drawSymbolCard(pMeta, x, startY, cardW, cardH, "Yang/Yin Symbol");
    drawSymbolCard(
      eMeta,
      x,
      startY + cardH + 24,
      cardW,
      cardH,
      "Five Elements Symbol"
    );
    return cardH * 2 + 24;
  } else {
    drawSymbolCard(pMeta, x, startY, cardW, cardH, "Yang/Yin Symbol");
    drawSymbolCard(
      eMeta,
      x + cardW + 24,
      startY,
      cardW,
      cardH,
      "Five Elements Symbol"
    );
    return cardH;
  }
}

function drawWrappedText(copy, x, y, width, opt = {}) {
  let fs = opt.fontSize || 16,
    ls = opt.lineSpacing || 1.4,
    lh = fs * ls;
  push();
  fill(opt.color || "#222222");
  textSize(fs);
  let lines = wrapText(String(copy), width);
  lines.forEach((l, i) => text(l, x, y + i * lh));
  pop();
  return lines.length * lh;
}

function wrapText(c, mw) {
  let words = c.split(" "),
    lines = [],
    cur = "";
  words.forEach((w) => {
    let cand = cur ? `${cur} ${w}` : w;
    if (textWidth(cand) <= mw) cur = cand;
    else {
      lines.push(cur);
      cur = w;
    }
  });
  if (cur) lines.push(cur);
  return lines;
}

async function fetchFortuneData() {
  isLoading = true;
  try {
    const url = new URL(MANSE_ENDPOINT);
    url.searchParams.set("solYear", userData.year);
    url.searchParams.set("solMonth", userData.month);
    url.searchParams.set("solDay", userData.date);
    url.searchParams.set("_type", "json");
    url.searchParams.set("ServiceKey", MANSE_SERVICE_KEY);
    const res = await fetch(url.toString());
    const data = await res.json();
    const item = data.response.body.items.item;
    const lunarItem = Array.isArray(item) ? item[0] : item;
    const norm = {
      lunYear: lunarItem.lunYear,
      lunMonth: String(lunarItem.lunMonth).padStart(2, "0"),
      lunDay: String(lunarItem.lunDay).padStart(2, "0"),
      lunIljin: lunarItem.lunIljin,
      lunSecha: lunarItem.lunSecha,
      lunWolgeon: lunarItem.lunWolgeon,
      solWeek: lunarItem.solWeek,
    };
    fortunePayload = { lunar: norm, ...craftFortune(norm) };
  } catch (e) {
    fetchError = e.message;
  } finally {
    isLoading = false;
  }
}

function craftFortune(lunar) {
  const stem = lunar.lunIljin.charAt(0);
  const branch = lunar.lunIljin.charAt(1);
  const element = heavenlyStemInsights[stem].element;
  const rng = createDailyRandomGenerator(`${userData.name}-${lunar.solWeek}`);

  const variables = {
    name: userData.name || "Today",
    elementDesc: heavenlyStemInsights[stem].description,
    branchMood: earthlyBranchInsights[branch].mood,
    weekdayMood: weekdayInsights[lunar.solWeek].mood,
  };

  return {
    summary: formatTemplate(pickRandom(dailySummaryTemplates, rng), variables),
    keyFocus: pickRandom(dailyFocusByElement[element], rng),
    guidance: pickRandom(dailyGuidanceFragments, rng),
    luckyColor: pickRandom(dailyColorPalette, rng),
    energyScore: Math.round(60 + rng() * 38),
    symbols: { polarity: stemPolarityMap[stem], element },
  };
}

function sanitizeValue(v, f) {
  return v && String(v).trim() !== "" ? v : f;
}
function createDailyRandomGenerator(k) {
  let s = 54321;
  return function () {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}
function pickRandom(l, r) {
  return l[Math.floor(r() * l.length)];
}
function formatTemplate(t, v) {
  return t.replace(/\{(\w+)\}/g, (_, k) => v[k] || "");
}
function getQueryParameters() {
  const p = {};
  location.search
    .substring(1)
    .split("&")
    .forEach((q) => {
      const pair = q.split("=");
      if (pair[0])
        p[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || "");
    });
  return p;
}

// Expanded English Templates for Today's Message
const dailySummaryTemplates = [
  "{name}, today the {elementDesc} energy harmonizes with the {branchMood} under the influence of {weekdayMood}. It's a day to observe closely and seize quiet opportunities.",
  "{name}, the dynamic flow of {elementDesc} meets the {branchMood} today. Embrace the rhythm of {weekdayMood} and allow yourself to be guided by unexpected inspiration.",
  "A sense of profound balance awaits you, {name}. The {elementDesc} blends seamlessly with the {branchMood}, while {weekdayMood} encourages you to maintain inner peace for greater results.",
  "{name}, your energy today is defined by the unique combination of {elementDesc} and {branchMood}. This is an ideal time to follow the pace of {weekdayMood} and connect deeply with those around you.",
  "Your journey today begins with the strength of {elementDesc} and deepens through the {branchMood}. Trust the direction suggested by {weekdayMood} and move forward at your own pace.",
];

const dailyGuidanceFragments = [
  "Trust your intuition.",
  "Focus on steady progress.",
  "Keep your goals clear.",
];
const dailyFocusByElement = {
  wood: ["New Projects", "Growth"],
  fire: ["Passion", "Visibility"],
  earth: ["Stability", "Routine"],
  metal: ["Organization", "Clarity"],
  water: ["Reflection", "Empathy"],
};
const dailyColorPalette = [
  "Amber Glow",
  "Indigo Veil",
  "Soft Coral",
  "Forest Teal",
  "Ivory Mist",
  "Slate Blue",
  "Rose Quartz",
  "Burnt Sienna",
  "Moon Grey",
  "Honey Gold",
];

// Detailed English Descriptions for Heavenly Stems
const heavenlyStemInsights = {
  갑: {
    element: "wood",
    description:
      "the vibrant vitality of Yang Wood, rising strong like a giant tree",
  },
  을: {
    element: "wood",
    description:
      "the flexible and resilient life force of Yin Wood, like a winding vine",
  },
  병: {
    element: "fire",
    description:
      "the radiant passion of Yang Fire, shining brightly like the morning sun",
  },
  정: {
    element: "fire",
    description:
      "the refined and focused warmth of Yin Fire, like a guiding lamp in the dark",
  },
  무: {
    element: "earth",
    description:
      "the vast and protective embrace of Yang Earth, solid as a grand mountain",
  },
  기: {
    element: "earth",
    description:
      "the nurturing and fertile energy of Yin Earth, like a garden that fosters life",
  },
  경: {
    element: "metal",
    description:
      "the strong and decisive will of Yang Metal, unyielding as raw iron",
  },
  신: {
    element: "metal",
    description:
      "the clear and sophisticated wisdom of Yin Metal, sharp as a polished jewel",
  },
  임: {
    element: "water",
    description:
      "the deep insight and vast potential of Yang Water, like the endless ocean",
  },
  계: {
    element: "water",
    description:
      "the gentle and adaptable intelligence of Yin Water, like a refreshing spring rain",
  },
};

const earthlyBranchInsights = {
  자: { mood: "insightful intuition" },
  축: { mood: "calm persistence" },
  인: { mood: "courageous action" },
  묘: { mood: "harmonious collaboration" },
  진: { mood: "dynamic change" },
  사: { mood: "wise passion" },
  오: { mood: "energetic spotlight" },
  미: { mood: "caring empathy" },
  신: { mood: "clever clarity" },
  유: { mood: "refined order" },
  술: { mood: "loyal stability" },
  해: { mood: "creative inspiration" },
};

const weekdayInsights = {
  일: { mood: "restful stillness" },
  월: { mood: "a fresh start" },
  화: { mood: "fiery momentum" },
  수: { mood: "fluid connection" },
  목: { mood: "upward growth" },
  금: { mood: "decisive closure" },
  토: { mood: "grounded stability" },
};

const elementSymbolMeta = {
  wood: {
    title: "WOOD",
    subtitle: "Growth & Flexibility",
    assetKey: "wood",
    shape: "line",
  },
  fire: {
    title: "FIRE",
    subtitle: "Passion & Expansion",
    assetKey: "fire",
    shape: "triangle",
  },
  earth: {
    title: "EARTH",
    subtitle: "Stability & Grounding",
    assetKey: "earth",
    shape: "square",
  },
  metal: {
    title: "METAL",
    subtitle: "Structure & Clarity",
    assetKey: "metal",
    shape: "circle",
  },
  water: {
    title: "WATER",
    subtitle: "Flow & Adaptability",
    assetKey: "water",
    shape: "wave",
  },
};

const polaritySymbolMeta = {
  yang: {
    title: "YANG (+)",
    subtitle: "Bright & Active",
    assetKey: "plus",
    shape: "plus",
  },
  yin: {
    title: "YIN (-)",
    subtitle: "Soft & Deep",
    assetKey: "minus",
    shape: "minus",
  },
};

const stemPolarityMap = {
  갑: "yang",
  을: "yin",
  병: "yang",
  정: "yin",
  무: "yang",
  기: "yin",
  경: "yang",
  신: "yin",
  임: "yang",
  계: "yin",
};
