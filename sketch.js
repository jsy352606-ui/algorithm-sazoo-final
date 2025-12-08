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

const symbolAssetFiles = {
  plus: "Sol-Photoroom.png",
  minus: "moon-Photoroom.png",
  metal: "gold-Photoroom.png",
  earth: "sand-Photoroom.png",
  fire: "fire-Photoroom.png",
  water: "water-Photoroom.png",
  wood: "tree-Photoroom.png",
};

const symbolImageDisplayMode = {
  plus: "cover",
};

const symbolImageScaleFactor = {
  plus: 0.7,
};

const headingFont = "Libre Baskerville";
const bodyFont = "Nanum Myeongjo";

function preload() {
  userData = getQueryParameters();
  symbolAssets = loadSymbolAssets();
  console.log("수신된 사용자 데이터:", userData);
}

function loadSymbolAssets() {
  const assets = {};
  Object.entries(symbolAssetFiles).forEach(([key, path]) => {
    try {
      assets[key] = loadImage(
        path,
        () => {},
        () => console.warn(`이미지 로드 실패: ${path}`)
      );
    } catch (error) {
      console.warn(`이미지 초기화 실패 (${key})`, error);
      assets[key] = null;
    }
  });
  return assets;
}

function setup() {
  canvasWidth = constrain(windowWidth - 60, 360, 1020);
  canvasHeight = constrain(windowHeight - 80, 540, 980);
  createCanvas(canvasWidth, canvasHeight);

  textFont(bodyFont);
  textAlign(LEFT, TOP);
  textSize(18);

  fetchFortuneData();
  noLoop();
}

function windowResized() {
  canvasWidth = constrain(windowWidth - 60, 360, 1020);
  canvasHeight = constrain(windowHeight - 80, 540, 980);
  resizeCanvas(canvasWidth, canvasHeight);
  redraw();
}

function draw() {
  background(243, 243, 243);
  fill("#C04938");
  textSize(34);
  textFont(headingFont);
  text("YOU SAZOO READING", 40, 30);
  textFont(bodyFont);

  const contentX = 40;
  const contentWidth = canvasWidth - contentX * 2;

  let displayY = 90;
  const infoStartY = displayY;
  textSize(16);
  fill("#222222");

  const birthInfo = `${sanitizeValue(userData.year, "YYYY")}-${sanitizeValue(
    userData.month,
    "MM"
  )}-${sanitizeValue(userData.date, "DD")}`;

  text(
    `NAME : ${sanitizeValue(userData.name, "정보 없음")}`,
    contentX,
    displayY
  );
  displayY += 28;
  text(`BIRTHDAY : ${birthInfo}`, contentX, displayY);
  displayY += 28;
  text(
    `GENDER : ${sanitizeValue(userData.gender, "정보 없음")}`,
    contentX,
    displayY
  );
  displayY += 36;

  stroke(192);
  const dividerWidth = contentWidth * (3 / 5);
  line(contentX, displayY, contentX + dividerWidth, displayY);
  noStroke();
  displayY += 24;

  if (isLoading) {
    fill("#555");
    text("만세력 정보를 불러오는 중입니다...", contentX, displayY);
    return;
  }

  if (fetchError) {
    fill("#a3001d");
    text(`⚠ ${fetchError}`, contentX, displayY, canvasWidth - 80);
    return;
  }

  if (!fortunePayload) {
    fill("#a3001d");
    text(
      "만세력 데이터가 비어 있습니다.",
      contentX,
      displayY,
      canvasWidth - 80
    );
    return;
  }

  const {
    lunar,
    summary,
    keyFocus,
    guidance,
    luckyColor,
    energyScore,
    symbols,
  } = fortunePayload;

  fill("#363636");
  text(
    `LUNAR : ${lunar.lunYear}.${lunar.lunMonth}.${lunar.lunDay} (${lunar.lunIljin})`,
    contentX,
    displayY
  );
  displayY += 26;
  text(
    `SECHA / WOLGEON : ${lunar.lunSecha} / ${lunar.lunWolgeon}`,
    contentX,
    displayY
  );
  displayY += 36;
  const sechaBottom = displayY;

  const layoutWide = canvasWidth >= 860;
  const columnGap = layoutWide ? 24 : 0;
  let floatCards = layoutWide;
  let cardsColumnWidth = floatCards ? Math.min(320, contentWidth * 0.38) : 0;
  let textColumnWidth = floatCards
    ? contentWidth - cardsColumnWidth - columnGap
    : contentWidth;

  if (floatCards && textColumnWidth < 360) {
    floatCards = false;
    cardsColumnWidth = 0;
    textColumnWidth = contentWidth;
  }

  let cardsBottom = sechaBottom;
  if (floatCards) {
    const cardsX = contentX + textColumnWidth + columnGap;
    const cardsHeight = drawSymbolShowcase(symbols, infoStartY, {
      x: cardsX,
      availableWidth: cardsColumnWidth,
      mode: "stack",
    });
    cardsBottom = infoStartY + cardsHeight;
  }

  displayY = sechaBottom + 16;

  fill("#C04938");
  textSize(24);
  textFont(headingFont);
  text("TODAY'S MESSAGE", contentX, displayY);
  textFont(bodyFont);
  displayY += 50;

  const summaryTop = displayY;
  const summaryHeight = drawWrappedText(
    summary,
    contentX,
    summaryTop,
    textColumnWidth,
    {
      fontSize: 17,
      lineSpacing: 1.5,
      color: "#222222",
    }
  );

  let detailStartY = summaryTop + summaryHeight + 22;

  if (floatCards) {
    const detailHeight = renderFortuneDetails(
      {
        keyFocus,
        guidance,
        luckyColor,
        energyScore,
      },
      contentX,
      detailStartY,
      textColumnWidth
    );

    displayY = detailStartY + detailHeight + 24;
  } else {
    const cardsHeight = drawSymbolShowcase(symbols, detailStartY, {
      x: contentX,
      availableWidth: textColumnWidth,
      mode: "auto",
    });

    detailStartY += cardsHeight + 26;
    const detailHeight = renderFortuneDetails(
      {
        keyFocus,
        guidance,
        luckyColor,
        energyScore,
      },
      contentX,
      detailStartY,
      textColumnWidth
    );

    displayY = detailStartY + detailHeight + 24;
  }
}

function drawSymbolShowcase(symbols = {}, startY, config = {}) {
  const { x = 40, availableWidth = canvasWidth - 80, mode = "auto" } = config;

  const safeWidth = Math.max(240, availableWidth);
  const spacing = 24;
  const singleColumn = mode === "stack" || safeWidth < 460;
  const cardWidth = singleColumn ? safeWidth : (safeWidth - spacing) / 2;
  const cardHeight = singleColumn ? 220 : 235;

  const polarityMeta =
    polaritySymbolMeta[symbols.polarity] || polaritySymbolMeta.yang;
  const elementMeta =
    elementSymbolMeta[symbols.element] || elementSymbolMeta.earth;

  if (singleColumn) {
    drawSymbolCard(
      polarityMeta,
      x,
      startY,
      cardWidth,
      cardHeight,
      "양/음 기호"
    );
    drawSymbolCard(
      elementMeta,
      x,
      startY + cardHeight + spacing,
      cardWidth,
      cardHeight,
      "오행 기호"
    );
    return cardHeight * 2 + spacing;
  }

  drawSymbolCard(polarityMeta, x, startY, cardWidth, cardHeight, "양/음 기호");
  drawSymbolCard(
    elementMeta,
    x + cardWidth + spacing,
    startY,
    cardWidth,
    cardHeight,
    "오행 기호"
  );
  return cardHeight;
}

function drawSymbolCard(meta, x, y, width, height, caption) {
  push();
  fill(255, 248);
  noStroke();
  rect(x, y, width, height, 18);

  const padding = 20;
  const textBlockHeight = 110;
  const imageHeight = height - textBlockHeight;
  const viewportWidth = width - padding * 2;
  const viewportHeight = imageHeight;
  const img = symbolAssets[meta.assetKey];

  if (img) {
    const mode = symbolImageDisplayMode[meta.assetKey] || "contain";
    const scale =
      mode === "cover"
        ? Math.max(viewportWidth / img.width, viewportHeight / img.height)
        : Math.min(viewportWidth / img.width, viewportHeight / img.height);
    const scaled = scale * (symbolImageScaleFactor[meta.assetKey] || 1);
    const renderWidth = img.width * scaled;
    const renderHeight = img.height * scaled;
    const offsetX = (viewportWidth - renderWidth) / 2;
    const offsetY = (viewportHeight - renderHeight) / 2;
    image(
      img,
      x + padding + offsetX,
      y + padding + offsetY,
      renderWidth,
      renderHeight
    );
  } else {
    fill("#f1e9e5");
    rect(x + padding, y + padding, viewportWidth, imageHeight, 12);
  }

  const overlayBase = Math.min(viewportWidth, viewportHeight);
  const overlaySize = overlayBase / 2;

  drawSymbolOverlay(
    meta.shape,
    x + width / 2,
    y + padding + imageHeight / 2,
    overlaySize
  );

  const textTop = y + height - textBlockHeight + 18;
  const lineGap = 26;

  fill("#CF1818");
  textSize(14);
  text(caption, x + padding, textTop);

  fill("#C04938");
  textSize(20);
  text(meta.title, x + padding, textTop + lineGap);

  fill("#444");
  textSize(14);
  text(meta.subtitle, x + padding, textTop + lineGap * 2, width - padding * 2);

  pop();
}

function drawSymbolOverlay(shape, centerX, centerY, size) {
  push();
  fill("#EC302C");
  noStroke();

  switch (shape) {
    case "plus": {
      const thickness = size * 0.2;
      rect(centerX - size / 2, centerY - thickness / 2, size, thickness);
      rect(centerX - thickness / 2, centerY - size / 2, thickness, size);
      break;
    }
    case "minus": {
      const thickness = size * 0.18;
      rect(centerX - size / 2, centerY - thickness / 2, size, thickness);
      break;
    }
    case "circle": {
      ellipse(centerX, centerY, size, size);
      break;
    }
    case "square": {
      rectMode(CENTER);
      rect(centerX, centerY, size, size);
      break;
    }
    case "triangle": {
      const half = size / 2;
      triangle(
        centerX,
        centerY - half,
        centerX - half,
        centerY + half,
        centerX + half,
        centerY + half
      );
      break;
    }
    case "wave": {
      textAlign(CENTER, CENTER);
      textSize(size);
      text("~", centerX, centerY);
      break;
    }
    case "line": {
      const thickness = size * 0.18;
      rect(centerX - thickness / 2, centerY - size / 2, thickness, size);
      break;
    }
    default:
      break;
  }

  pop();
}

function renderFortuneDetails(details, x, y, width) {
  const spacing = 16;
  let cursor = y;
  const entries = [
    `• Key Focus : ${details.keyFocus}`,
    `• Guidance : ${details.guidance}`,
    `• Lucky Color : ${details.luckyColor}  |  EN. SCORE : ${details.energyScore}/100`,
  ];

  entries.forEach((line, index) => {
    const blockHeight = drawWrappedText(line, x, cursor, width, {
      fontSize: 16,
      lineSpacing: 1.4,
      color: "#444444",
    });
    cursor += blockHeight;
    if (index < entries.length - 1) {
      cursor += spacing;
    }
  });

  return cursor - y;
}

function drawWrappedText(copy, x, y, width, options = {}) {
  const { fontSize = 16, lineSpacing = 1.4, color = "#222222" } = options;

  const textContent = (copy || "").trim();
  if (textContent === "") return 0;

  const lineHeight = fontSize * lineSpacing;

  push();
  fill(color);
  textSize(fontSize);
  const lines = wrapText(textContent, width);
  lines.forEach((line, idx) => {
    text(line, x, y + idx * lineHeight);
  });
  pop();

  return lines.length * lineHeight;
}

function wrapText(copy, maxWidth) {
  if (maxWidth <= 0) return [copy];
  const words = copy.replace(/\s+/g, " ").split(" ");
  const lines = [];
  let currentLine = "";

  words.forEach((word) => {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (textWidth(candidate) <= maxWidth || currentLine === "") {
      currentLine = candidate;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

async function fetchFortuneData() {
  const normalizedDate = normalizeDate(
    userData.year,
    userData.month,
    userData.date
  );

  if (!normalizedDate.isValid) {
    fetchError = "유효한 생년월일 정보를 입력해주세요.";
    isLoading = false;
    redraw();
    return;
  }

  isLoading = true;
  const url = new URL(MANSE_ENDPOINT);
  url.searchParams.set("solYear", normalizedDate.year);
  url.searchParams.set("solMonth", normalizedDate.month);
  url.searchParams.set("solDay", normalizedDate.day);
  url.searchParams.set("_type", "json");
  url.searchParams.set("ServiceKey", MANSE_SERVICE_KEY);

  try {
    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error("만세력 API 호출에 실패했습니다.");
    }

    const payload = await response.json();
    const header = payload?.response?.header;

    if (header?.resultCode !== "00") {
      throw new Error(header?.resultMsg || "API 오류가 발생했습니다.");
    }

    const rawItem = payload?.response?.body?.items?.item;
    const lunarItem = Array.isArray(rawItem) ? rawItem[0] : rawItem;

    if (!lunarItem) {
      throw new Error("만세력 데이터가 존재하지 않습니다.");
    }

    const normalizedLunar = normalizeLunarItem(lunarItem);
    fortunePayload = {
      lunar: normalizedLunar,
      ...craftFortune(normalizedLunar),
    };
    fetchError = null;
  } catch (error) {
    console.error(error);
    fetchError = error.message || "알 수 없는 오류가 발생했습니다.";
    fortunePayload = null;
  } finally {
    isLoading = false;
    redraw();
  }
}

function craftFortune(lunar) {
  const stem = extractStem(lunar.lunIljin);
  const branch = extractBranch(lunar.lunIljin);
  const weekday = lunar.solWeek;

  const stemInsight = heavenlyStemInsights[stem] || fallbackStemInsight;
  const branchInsight = earthlyBranchInsights[branch] || fallbackBranchInsight;
  const weekdayInsight = weekdayInsights[weekday] || fallbackWeekdayInsight;

  const elementKey = stemInsight.element;
  const polarity = stemPolarityMap[stem] || "yang";
  const rng = createDailyRandomGenerator(
    `${sanitizeValue(userData.name, "guest")}-${lunar.solWeek}`
  );

  const summaryTemplate =
    pickRandom(dailySummaryTemplates, rng) ||
    "{name}, {elementDesc} meets {branchMood}, letting {weekdayMood} guide you.";
  const subjectName = userData.name ? userData.name : "Today";
  const summary = formatTemplate(summaryTemplate, {
    name: subjectName,
    elementDesc: stemInsight.description,
    branchMood: branchInsight.mood,
    weekdayMood: weekdayInsight.mood,
  });

  const focusOptions =
    dailyFocusByElement[elementKey] || dailyFocusByElement.default;
  const keyFocus =
    pickRandom(focusOptions, rng) ||
    focusByElement[elementKey] ||
    "균형 있는 흐름 유지";

  const guidanceFragment =
    pickRandom(dailyGuidanceFragments, rng) || weekdayInsight.guidance;
  const guidance = `${guidanceFragment} ${branchInsight.guidance}`.trim();

  const luckyColor =
    pickRandom(dailyColorPalette, rng) ||
    luckyColorByElement[elementKey] ||
    "아이보리";

  const energyScore = Math.round(60 + rng() * 40);

  return {
    summary,
    keyFocus,
    guidance,
    luckyColor,
    energyScore,
    symbols: {
      polarity,
      element: elementKey,
    },
  };
}

function computeEnergyScore(stem, branch, weekday) {
  const base =
    (stem.charCodeAt?.(0) || 65) +
    (branch.charCodeAt?.(0) || 67) +
    (weekday?.charCodeAt?.(0) || 70);

  const hash = (userData.name || "guest")
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);

  return Math.round(((base + hash) % 40) + 60); // 60 ~ 99
}

function normalizeLunarItem(item) {
  return {
    lunYear: String(item.lunYear || ""),
    lunMonth: padTwo(item.lunMonth),
    lunDay: padTwo(item.lunDay),
    lunIljin: item.lunIljin || "-",
    lunSecha: item.lunSecha || "-",
    lunWolgeon: item.lunWolgeon || "-",
    solWeek: item.solWeek || "-",
  };
}

function normalizeDate(year, month, day) {
  const sanitizedYear = (year || "").replace(/[^0-9]/g, "");
  const sanitizedMonth = (month || "").replace(/[^0-9]/g, "");
  const sanitizedDay = (day || "").replace(/[^0-9]/g, "");

  if (
    sanitizedYear.length !== 4 ||
    sanitizedMonth.length === 0 ||
    sanitizedDay.length === 0
  ) {
    return { isValid: false };
  }

  return {
    isValid: true,
    year: sanitizedYear,
    month: padTwo(sanitizedMonth),
    day: padTwo(sanitizedDay),
  };
}

function padTwo(value) {
  return String(value || "")
    .padStart(2, "0")
    .substring(0, 2);
}

function sanitizeValue(value, fallback) {
  if (value === undefined || value === null) return fallback;
  const stringValue = String(value).trim();
  return stringValue === "" ? fallback : stringValue;
}

function hashString(input = "") {
  let hash = 1779033703 ^ input.length;
  for (let i = 0; i < input.length; i++) {
    hash = Math.imul(hash ^ input.charCodeAt(i), 3432918353);
    hash = (hash << 13) | (hash >>> 19);
  }
  return hash >>> 0;
}

function createDailyRandomGenerator(key = "") {
  const now = new Date();
  const dateStamp = `${now.getUTCFullYear()}-${String(
    now.getUTCMonth() + 1
  ).padStart(2, "0")}-${String(now.getUTCDate()).padStart(2, "0")}`;
  let seed = hashString(`${dateStamp}-${key}`);
  return function () {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickRandom(list, rng, fallback = null) {
  if (!Array.isArray(list) || list.length === 0) return fallback;
  const index = Math.floor(rng() * list.length);
  return list[index] ?? fallback;
}

function formatTemplate(template, variables) {
  return template.replace(/\{(\w+)\}/g, (_, token) => variables[token] || "");
}

function getQueryParameters() {
  const params = {};
  const queryString = window.location.search.substring(1);
  const queries = queryString.split("&");

  for (let i = 0; i < queries.length; i++) {
    const pair = queries[i].split("=");
    if (!pair[0]) continue;
    params[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || "");
  }
  return params;
}

function extractStem(iljin = "") {
  return iljin.charAt(0) || "";
}

function extractBranch(iljin = "") {
  return iljin.charAt(1) || "";
}

const heavenlyStemInsights = {
  갑: {
    element: "wood",
    description: "vibrant Wood energy",
    color: "Emerald",
  },
  을: { element: "wood", description: "flexible Wood energy", color: "Sage" },
  병: {
    element: "fire",
    description: "radiant Fire energy",
    color: "Burgundy",
  },
  정: { element: "fire", description: "refined Fire energy", color: "Coral" },
  무: {
    element: "earth",
    description: "grounded Earth energy",
    color: "Mustard",
  },
  기: { element: "earth", description: "gentle Earth energy", color: "Sand" },
  경: {
    element: "metal",
    description: "precise Metal energy",
    color: "Silver",
  },
  신: { element: "metal", description: "clear Metal energy", color: "White" },
  임: { element: "water", description: "deep Water energy", color: "Navy" },
  계: { element: "water", description: "crisp Water energy", color: "Sky" },
};

const earthlyBranchInsights = {
  자: {
    mood: "intuition and insight",
    guidance: "Trust your instincts and watch the flow.",
  },
  축: {
    mood: "calm persistence",
    guidance: "Steady steps, even slow ones, still get you ahead.",
  },
  인: {
    mood: "courage and expansion",
    guidance: "Stay open to new proposals and allies.",
  },
  묘: {
    mood: "flexibility and harmony",
    guidance: "Collaborate while keeping your own tone.",
  },
  진: {
    mood: "waves of change",
    guidance: "Have a plan B for sudden shifts.",
  },
  사: {
    mood: "speed and passion",
    guidance: "Decide quickly and trim emotional waste.",
  },
  오: {
    mood: "expression and spotlight",
    guidance: "Speak sincerely but mind your delivery.",
  },
  미: {
    mood: "balance and empathy",
    guidance: "Listening with care opens the path.",
  },
  신: {
    mood: "intuition and clarity",
    guidance: "Check both data and gut feelings.",
  },
  유: {
    mood: "harvest and refinement",
    guidance: "Organize unfinished matters to flip the odds.",
  },
  술: {
    mood: "stability and protection",
    guidance: "Honor your routine yet finish boldly.",
  },
  해: {
    mood: "inspiration and rest",
    guidance: "If you're drained, give yourself recovery time.",
  },
};

const weekdayInsights = {
  일: {
    mood: "a wave of new beginnings",
    guidance: "Step forward without hesitation.",
  },
  월: {
    mood: "inner alignment",
    guidance: "Polish your plans and emotions.",
  },
  화: {
    mood: "fiery momentum",
    guidance: "When focus hits, push ahead.",
  },
  수: {
    mood: "communication and connection",
    guidance: "Conversations reveal the clue.",
  },
  목: {
    mood: "growth and learning",
    guidance: "Invest in learning; returns come quickly.",
  },
  금: {
    mood: "closure and harvest",
    guidance: "Finishing now prepares the next stage.",
  },
  토: {
    mood: "stability and rest",
    guidance: "Slow down and reset body and mind.",
  },
};

const focusByElement = {
  wood: "Lean into growth and fresh learning.",
  fire: "Showcase expression and leadership.",
  earth: "Prioritize building a steady foundation.",
  metal: "Precision and organization bring rewards.",
  water: "Use intuition and empathy when you communicate.",
};

const luckyColorByElement = {
  wood: "Deep Green",
  fire: "Burgundy",
  earth: "Mustard",
  metal: "Rose Gold",
  water: "Navy",
};

const dailySummaryTemplates = [
  "{name}, {elementDesc} blends with {branchMood}, so let {weekdayMood} be your pace-setter.",
  "{name}, when {elementDesc} meets {branchMood}, you’re invited to ride the wave of {weekdayMood}.",
  "{name}, today hums with {elementDesc} while {branchMood} lingers; trust the quiet clues of {weekdayMood}.",
];

const dailyGuidanceFragments = [
  "Sketch the next step before you act.",
  "Pause for one grounding breath before replies.",
  "Share one honest sentence that you’ve been holding back.",
  "Let a short walk reset your focus.",
  "Tidy one corner of your workspace to clear the mind.",
];

const dailyFocusByElement = {
  wood: [
    "Nurture the conversation that scares you a little.",
    "Outline a fresh idea even if it feels rough.",
  ],
  fire: [
    "Lead with warmth but leave room for silence.",
    "Channel your spark into one bold invitation.",
  ],
  earth: [
    "Protect the routine that keeps you steady.",
    "Edit a plan until it feels grounded.",
  ],
  metal: [
    "Declutter your commitments and guard your clarity.",
    "Document one system so others can follow it.",
  ],
  water: [
    "Listen for the emotion beneath the words.",
    "Allow a quiet check-in to guide your direction.",
  ],
  default: ["Choose the action that brings calm momentum."],
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

const elementSymbolMeta = {
  wood: {
    title: "WOOD / TREE",
    subtitle: "Growth, Flexibility, Upward flow",
    assetKey: "wood",
    shape: "line",
  },
  fire: {
    title: "FIRE",
    subtitle: "Passion, Expansion, Warmth",
    assetKey: "fire",
    shape: "triangle",
  },
  earth: {
    title: "EARTH",
    subtitle: "Stability, Grounding, Realism",
    assetKey: "earth",
    shape: "square",
  },
  metal: {
    title: "METAL / GOLD",
    subtitle: "Structure, Clarity, Decisiveness",
    assetKey: "metal",
    shape: "circle",
  },
  water: {
    title: "WATER",
    subtitle: "Intuition, Circulation, Adaptability",
    assetKey: "water",
    shape: "wave",
  },
};

const polaritySymbolMeta = {
  yang: {
    title: "YANG (+)",
    subtitle: "Bright · Outgoing · Driving",
    assetKey: "plus",
    shape: "plus",
  },
  yin: {
    title: "YIN (-)",
    subtitle: "Soft · Inward · Focused",
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

const fallbackStemInsight = {
  element: "earth",
  description: "steady, balanced energy",
};

const fallbackBranchInsight = {
  mood: "a calm undercurrent",
  guidance: "Stay with your current pace.",
};

const fallbackWeekdayInsight = {
  mood: "daily stability",
  guidance: "Take a breath and review the small steps.",
};
