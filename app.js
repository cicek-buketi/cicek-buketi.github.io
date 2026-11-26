/* ==========================================================================
   Gece Buketi — Kişiye Özel Çiçek Buketi Mantığı, SVG Üretici & Yıldız Tuvali
   ========================================================================== */

(() => {
  "use strict";

  const FLOWER_DEFAULTS = {
    gece: "turkuaz",
    papatya: "beyaz",
    gul: "kirmizi",
    lale: "mor",
    sakura: "pembe",
    orkide: "pembe",
    zambak: "beyaz",
    lavanta: "mor",
    nilufer: "turkuaz",
    ortanca: "turkuaz",
    karanfil: "kirmizi",
    karisik: "pembe",
  };

  // Karışık bukette 5 dal için seçilen özel çiçek karması (alt-sol, alt-sağ, sol, sağ, orta)
  const MIXED_BOUQUET_TYPES = ["lale", "sakura", "zambak", "papatya", "gul"];

  const VALID_FLOWERS = new Set(Object.keys(FLOWER_DEFAULTS));
  const VALID_THEMES = new Set([
    "turkuaz",
    "kirmizi",
    "pembe",
    "mor",
    "altin",
    "beyaz",
    "safir",
    "mercan",
    "zumrut",
    "fusya",
    "bordo",
    "buz",
  ]);

  const THEME_LABELS = {
    turkuaz: "Gece Turkuazı",
    kirmizi: "Aşk Kırmızısı",
    pembe: "Pembe Rüya",
    mor: "Mor Lavanta",
    altin: "Altın Işıltı",
    beyaz: "Saf Beyaz",
    safir: "Safir Mavi",
    mercan: "Mercan Günbatımı",
    zumrut: "Zümrüt Yeşili",
    fusya: "Neon Fuşya",
    bordo: "Kadife Bordo",
    buz: "Buz Mavisi",
  };

  let svgUidCounter = 0;

  /* ========================================================================
     UTF-8 Güvenli Base64URL Kodlama / Çözme (GitHub Pages için %100 statik)
     ======================================================================== */
  function encodePayload(data) {
    const clean = {
      t: (data.title || "").trim().slice(0, 70) || "Seni Seviyorum",
      f: VALID_FLOWERS.has(data.flower) ? data.flower : "gece",
      c: VALID_THEMES.has(data.theme) ? data.theme : "turkuaz",
      m: (data.message || "").trim().slice(0, 700),
      s: (data.sender || "").trim().slice(0, 40),
    };
    const json = JSON.stringify(clean);
    const bytes = new TextEncoder().encode(json);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }

  function decodePayload(encoded) {
    try {
      if (!encoded || encoded.length > 4000) return null;
      let base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
      while (base64.length % 4) base64 += "=";
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const json = new TextDecoder().decode(bytes);
      const raw = JSON.parse(json);
      if (!raw || typeof raw !== "object") return null;
      return {
        title: typeof raw.t === "string" && raw.t.trim() ? raw.t.trim().slice(0, 70) : "Seni Seviyorum",
        flower: VALID_FLOWERS.has(raw.f) ? raw.f : "gece",
        theme: VALID_THEMES.has(raw.c) ? raw.c : "turkuaz",
        message: typeof raw.m === "string" ? raw.m.trim().slice(0, 700) : "",
        sender: typeof raw.s === "string" ? raw.s.trim().slice(0, 40) : "",
      };
    } catch {
      return null;
    }
  }

  function getGiftParamFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get("d");
    if (fromQuery) return fromQuery;
    const hash = window.location.hash || "";
    if (hash.startsWith("#d=")) return hash.slice(3);
    return null;
  }

  function buildShareUrl(data) {
    const encoded = encodePayload(data);
    const base = window.location.href.split("?")[0].split("#")[0];
    return `${base}?d=${encoded}`;
  }

  /* ========================================================================
     5 Farklı Çiçek Türü İçin Vektör Çiçek Başı Çizicileri
     ======================================================================== */
  function renderFlowerHead(flowerType, uid, delaySec) {
    const halo = `<circle cx="0" cy="0" r="54" fill="url(#${uid}-halo)" opacity="0.72" />`;

    if (flowerType === "papatya") {
      // Papatya: 14 zarif ince yaprak (2 katman) + sıcak altın göbek
      const backPetals = [];
      const frontPetals = [];
      for (let i = 0; i < 7; i++) {
        const a1 = i * (360 / 7) + 12;
        const a2 = a1 + 360 / 14;
        backPetals.push(
          `<ellipse cx="0" cy="-24" rx="6.2" ry="19.5" fill="url(#${uid}-petal-soft)" opacity="0.82" transform="rotate(${a1.toFixed(1)})" />`
        );
        frontPetals.push(
          `<ellipse cx="0" cy="-25" rx="6.6" ry="21" fill="url(#${uid}-petal)" stroke="var(--petal-rim)" stroke-opacity="0.35" stroke-width="0.6" transform="rotate(${a2.toFixed(1)})" />`
        );
      }
      return `
        ${halo}
        <g>${backPetals.join("")}</g>
        <g class="petal-inner-layer" style="transform-origin:0px 0px;--delay:${delaySec}s">
          ${frontPetals.join("")}
          <circle cx="0" cy="0" r="13.5" fill="url(#${uid}-daisy-core)" />
          <circle cx="-3" cy="-3.5" r="4.8" fill="#fffbeb" opacity="0.55" />
          <g fill="#b45309" opacity="0.38">
            <circle cx="4" cy="3" r="1.1"/><circle cx="-4" cy="4" r="1"/><circle cx="5" cy="-3" r="1"/>
            <circle cx="0" cy="5.5" r="1"/><circle cx="-5.5" cy="-1" r="1"/><circle cx="1.5" cy="-5" r="0.9"/>
          </g>
        </g>
      `;
    }

    if (flowerType === "gul") {
      // Gül: İç içe 3 katmanlı kadife yapraklar ve parlak kenarlar
      const outer = [];
      const mid = [];
      for (let i = 0; i < 5; i++) {
        const deg = i * 72;
        outer.push(
          `<path d="M 0 6 C -22 2 -28 -24 -12 -36 C -2 -43 10 -41 18 -32 C 28 -20 22 4 0 6 Z"
            fill="url(#${uid}-petal-deep)" stroke="var(--petal-rim)" stroke-opacity="0.28" stroke-width="0.9"
            transform="rotate(${deg})" />`
        );
        mid.push(
          `<path d="M 0 4 C -16 1 -20 -18 -8 -26 C 0 -31 10 -29 14 -21 C 20 -11 15 3 0 4 Z"
            fill="url(#${uid}-petal)" stroke="var(--petal-rim)" stroke-opacity="0.48" stroke-width="0.85"
            transform="rotate(${deg + 36})" />`
        );
      }
      return `
        ${halo}
        <g>${outer.join("")}</g>
        <g class="petal-inner-layer" style="transform-origin:0px 0px;--delay:${delaySec}s">
          ${mid.join("")}
          <circle cx="0" cy="-1" r="13" fill="url(#${uid}-petal-soft)" />
          <path d="M 0 -9 C 7 -9 11 -4 9 3 C 7 9 -2 11 -7 6 C -11 1 -9 -7 -2 -8 C 4 -9 6 -4 4 1 C 2 4 -3 4 -4 0 C -5 -3 -1 -5 1 -2"
            fill="none" stroke="var(--petal-rim)" stroke-width="2.1" stroke-linecap="round" opacity="0.9" />
          <circle cx="0" cy="-1" r="3.4" fill="url(#${uid}-core)" opacity="0.85" />
        </g>
      `;
    }

    if (flowerType === "lale") {
      // Lale: Yukarı kavisli kadeh formu, içten parlayan sıcak ışık
      return `
        <g transform="translate(0, 12)">
          <circle cx="0" cy="-22" r="50" fill="url(#${uid}-halo)" opacity="0.68" />
          <!-- Arka taç yapraklar -->
          <path d="M -2 0 C -28 -6 -34 -38 -16 -52 C -4 -42 0 -22 -2 0 Z" fill="url(#${uid}-petal-deep)" opacity="0.9" />
          <path d="M 2 0 C 28 -6 34 -38 16 -52 C 4 -42 0 -22 2 0 Z" fill="url(#${uid}-petal-deep)" opacity="0.9" />
          <!-- İç ışık parıltısı -->
          <ellipse cx="0" cy="-34" rx="13" ry="16" fill="url(#${uid}-core)" opacity="0.58" />
          <!-- Yan kavisli yapraklar -->
          <g class="petal-inner-layer" style="transform-origin:0px 0px;--delay:${delaySec}s">
            <path d="M 0 3 C -26 1 -35 -28 -22 -49 C -10 -44 -2 -26 0 3 Z"
              fill="url(#${uid}-petal)" stroke="var(--petal-rim)" stroke-opacity="0.38" stroke-width="0.9" />
            <path d="M 0 3 C 26 1 35 -28 22 -49 C 10 -44 2 -26 0 3 Z"
              fill="url(#${uid}-petal)" stroke="var(--petal-rim)" stroke-opacity="0.38" stroke-width="0.9" />
            <!-- Ön merkez yaprak -->
            <path d="M 0 5 C -18 2 -20 -26 0 -54 C 20 -26 18 2 0 5 Z"
              fill="url(#${uid}-petal-soft)" stroke="var(--petal-rim)" stroke-opacity="0.55" stroke-width="1" />
            <path d="M 0 -46 C -4 -28 -3 -12 0 1" fill="none" stroke="var(--petal-rim)" stroke-opacity="0.35" stroke-width="1.2" />
          </g>
        </g>
      `;
    }

    if (flowerType === "sakura") {
      // Sakura: 5 çentikli narin kiraz çiçeği yaprağı + ışıldayan ince stamenler
      const petals = [];
      const stamens = [];
      for (let i = 0; i < 5; i++) {
        const deg = i * 72;
        petals.push(
          `<path d="M 0 0 C -11 -10 -17 -26 -8 -39 C -4 -43 -1 -41 0 -35 C 1 -41 4 -43 8 -39 C 17 -26 11 -10 0 0 Z"
            fill="url(#${uid}-petal)" stroke="var(--petal-rim)" stroke-opacity="0.45" stroke-width="0.75"
            transform="rotate(${deg})" />`
        );
      }
      for (let i = 0; i < 10; i++) {
        const deg = i * 36 + 18;
        const len = i % 2 === 0 ? 15 : 11.5;
        stamens.push(
          `<g transform="rotate(${deg})">
            <line x1="0" y1="0" x2="0" y2="-${len}" stroke="var(--petal-rim)" stroke-width="0.85" opacity="0.72" />
            <circle cx="0" cy="-${len}" r="1.65" fill="var(--pollen-color)" />
          </g>`
        );
      }
      return `
        ${halo}
        <g>${petals.join("")}</g>
        <g class="petal-inner-layer" style="transform-origin:0px 0px;--delay:${delaySec}s">
          <circle cx="0" cy="0" r="8.5" fill="url(#${uid}-petal-deep)" opacity="0.65" />
          ${stamens.join("")}
          <circle cx="0" cy="0" r="4.5" fill="url(#${uid}-core)" />
        </g>
      `;
    }

    if (flowerType === "orkide") {
      // Orkide: Kelebek kanadı formunda egzotik yan yapraklar, 3 ince çanak yaprak ve benekli parlak dudak
      return `
        ${halo}
        <!-- 3 dış çanak yaprak -->
        <g>
          <path d="M 0 2 C -11 -10 -12 -32 0 -46 C 12 -32 11 -10 0 2 Z"
            fill="url(#${uid}-petal-deep)" stroke="var(--petal-rim)" stroke-opacity="0.32" stroke-width="0.85" />
          <path d="M -2 2 C -14 10 -26 24 -18 39 C -7 35 -1 20 -2 2 Z"
            fill="url(#${uid}-petal-deep)" stroke="var(--petal-rim)" stroke-opacity="0.3" stroke-width="0.85" />
          <path d="M 2 2 C 14 10 26 24 18 39 C 7 35 1 20 2 2 Z"
            fill="url(#${uid}-petal-deep)" stroke="var(--petal-rim)" stroke-opacity="0.3" stroke-width="0.85" />
        </g>
        <!-- Geniş kelebek kanadı yaprakları ve ışıldayan merkez dudağı -->
        <g class="petal-inner-layer" style="transform-origin:0px 0px;--delay:${delaySec}s">
          <path d="M -2 0 C -18 -24 -48 -20 -46 3 C -44 21 -18 20 -2 2 Z"
            fill="url(#${uid}-petal)" stroke="var(--petal-rim)" stroke-opacity="0.52" stroke-width="0.95" />
          <path d="M 2 0 C 18 -24 48 -20 46 3 C 44 21 18 20 2 2 Z"
            fill="url(#${uid}-petal)" stroke="var(--petal-rim)" stroke-opacity="0.52" stroke-width="0.95" />
          <!-- Kanat damarları -->
          <path d="M -6 0 Q -24 -5 -36 1 M 6 0 Q 24 -5 36 1" fill="none" stroke="var(--petal-rim)" stroke-opacity="0.32" stroke-width="0.9" />
          <!-- Merkezi orkide dudağı (labellum) -->
          <path d="M 0 -2 C -11 -1 -14 11 -9 20 C -5 25 -2 22 0 27 C 2 22 5 25 9 20 C 14 11 11 -1 0 -2 Z"
            fill="url(#${uid}-petal-soft)" stroke="var(--petal-rim)" stroke-opacity="0.65" stroke-width="0.9" />
          <ellipse cx="0" cy="6" rx="6.2" ry="7.5" fill="url(#${uid}-core)" />
          <g fill="var(--petal-deep)" opacity="0.55">
            <circle cx="-3" cy="12" r="1.1" /><circle cx="3" cy="12" r="1.1" /><circle cx="0" cy="15.5" r="1.2" />
          </g>
        </g>
      `;
    }

    if (flowerType === "zambak") {
      // Zambak: 6 uzun sivri yıldız yaprak + dışa uzanan ince polenli organlar
      const back = [];
      const front = [];
      const stamens = [];
      for (let i = 0; i < 3; i++) {
        const a1 = i * 120 + 60;
        const a2 = i * 120;
        back.push(
          `<g transform="rotate(${a1})">
            <path d="M 0 2 C -12 -12 -11 -35 0 -51 C 11 -35 12 -12 0 2 Z"
              fill="url(#${uid}-petal-deep)" stroke="var(--petal-rim)" stroke-opacity="0.35" stroke-width="0.8" />
          </g>`
        );
        front.push(
          `<g transform="rotate(${a2})">
            <path d="M 0 2 C -13 -13 -12 -38 0 -54 C 12 -38 13 -13 0 2 Z"
              fill="url(#${uid}-petal)" stroke="var(--petal-rim)" stroke-opacity="0.58" stroke-width="0.95" />
            <path d="M 0 -4 L 0 -42" stroke="var(--petal-rim)" stroke-opacity="0.45" stroke-width="1" stroke-linecap="round" />
            <circle cx="-2.8" cy="-14" r="1" fill="var(--petal-deep)" opacity="0.45" />
            <circle cx="2.8" cy="-18" r="1" fill="var(--petal-deep)" opacity="0.45" />
          </g>`
        );
      }
      for (let i = 0; i < 6; i++) {
        const deg = i * 60 + 30;
        stamens.push(
          `<g transform="rotate(${deg})">
            <path d="M 0 0 Q 4 -12 2 -23" fill="none" stroke="var(--petal-rim)" stroke-width="1" opacity="0.85" />
            <ellipse cx="2" cy="-24" rx="2.6" ry="1.4" transform="rotate(-20 2 -24)" fill="url(#${uid}-core)" />
          </g>`
        );
      }
      return `
        ${halo}
        <g>${back.join("")}</g>
        <g class="petal-inner-layer" style="transform-origin:0px 0px;--delay:${delaySec}s">
          ${front.join("")}
          ${stamens.join("")}
          <circle cx="0" cy="0" r="5" fill="url(#${uid}-core)" />
        </g>
      `;
    }

    if (flowerType === "lavanta") {
      // Lavanta: Dikey başak şeklinde katman katman dizilmiş ışıldayan minik tomurcuklar
      const tiers = [
        { y: -4, spread: 10.5, rx: 5.5, ry: 7.4, rot: 36 },
        { y: -15, spread: 11.2, rx: 5.6, ry: 7.6, rot: 34 },
        { y: -27, spread: 10.2, rx: 5.2, ry: 7.2, rot: 30 },
        { y: -39, spread: 8.8, rx: 4.8, ry: 6.8, rot: 26 },
        { y: -50, spread: 7.0, rx: 4.3, ry: 6.2, rot: 22 },
        { y: -60, spread: 4.8, rx: 3.7, ry: 5.5, rot: 16 },
      ];
      const backBuds = tiers
        .map(
          (t) => `
          <ellipse cx="${-t.spread}" cy="${t.y}" rx="${t.rx}" ry="${t.ry}"
            transform="rotate(${-t.rot} ${-t.spread} ${t.y})"
            fill="url(#${uid}-petal-deep)" stroke="var(--petal-rim)" stroke-opacity="0.3" stroke-width="0.65" />
          <ellipse cx="${t.spread}" cy="${t.y}" rx="${t.rx}" ry="${t.ry}"
            transform="rotate(${t.rot} ${t.spread} ${t.y})"
            fill="url(#${uid}-petal-deep)" stroke="var(--petal-rim)" stroke-opacity="0.3" stroke-width="0.65" />`
        )
        .join("");

      const frontBuds = tiers
        .map(
          (t, idx) => `
          <ellipse cx="${(idx % 2 === 0 ? -3.2 : 3.2)}" cy="${t.y - 3}" rx="${(t.rx * 0.88).toFixed(1)}" ry="${(t.ry * 0.92).toFixed(1)}"
            transform="rotate(${idx % 2 === 0 ? -12 : 12} ${idx % 2 === 0 ? -3.2 : 3.2} ${t.y - 3})"
            fill="url(#${uid}-petal)" stroke="var(--petal-rim)" stroke-opacity="0.45" stroke-width="0.7" />
          <ellipse cx="0" cy="${t.y - 5}" rx="${(t.rx * 0.72).toFixed(1)}" ry="${(t.ry * 0.82).toFixed(1)}"
            fill="url(#${uid}-petal-soft)" opacity="0.92" />`
        )
        .join("");

      return `
        <g transform="translate(0, 14)">
          <ellipse cx="0" cy="-34" rx="34" ry="56" fill="url(#${uid}-halo)" opacity="0.68" />
          <line x1="0" y1="6" x2="0" y2="-66" stroke="var(--stem-light)" stroke-width="2.4" stroke-linecap="round" />
          <g>${backBuds}</g>
          <g class="petal-inner-layer" style="transform-origin:0px 0px;--delay:${delaySec}s">
            ${frontBuds}
            <ellipse cx="0" cy="-70" rx="4.2" ry="7.4" fill="url(#${uid}-petal-soft)" stroke="var(--petal-rim)" stroke-opacity="0.55" stroke-width="0.7" />
            <circle cx="0" cy="-71" r="1.8" fill="var(--pollen-color)" opacity="0.9" />
          </g>
        </g>
      `;
    }

    if (flowerType === "nilufer") {
      // Nilüfer / Lotus: Çok katmanlı, simetrik ve yukarı doğru açılan mistik nilüfer yaprakları
      return `
        <g transform="translate(0, 10)">
          <ellipse cx="0" cy="-16" rx="56" ry="44" fill="url(#${uid}-halo)" opacity="0.72" />
          <!-- En dış açılan yan yapraklar -->
          <g>
            <path d="M 0 4 C -24 6 -48 -4 -52 -20 C -34 -22 -14 -12 0 4 Z"
              fill="url(#${uid}-petal-deep)" stroke="var(--petal-rim)" stroke-opacity="0.32" stroke-width="0.85" />
            <path d="M 0 4 C 24 6 48 -4 52 -20 C 34 -22 14 -12 0 4 Z"
              fill="url(#${uid}-petal-deep)" stroke="var(--petal-rim)" stroke-opacity="0.32" stroke-width="0.85" />
            <path d="M 0 4 C -24 -4 -40 -26 -34 -44 C -18 -36 -6 -16 0 4 Z"
              fill="url(#${uid}-petal)" stroke="var(--petal-rim)" stroke-opacity="0.42" stroke-width="0.9" />
            <path d="M 0 4 C 24 -4 40 -26 34 -44 C 18 -36 6 -16 0 4 Z"
              fill="url(#${uid}-petal)" stroke="var(--petal-rim)" stroke-opacity="0.42" stroke-width="0.9" />
          </g>
          <!-- İç taç yaprakları ve ışıldayan lotus kalbi -->
          <g class="petal-inner-layer" style="transform-origin:0px 0px;--delay:${delaySec}s">
            <path d="M 0 5 C -18 -6 -24 -32 -16 -50 C -4 -38 0 -16 0 5 Z"
              fill="url(#${uid}-petal-soft)" stroke="var(--petal-rim)" stroke-opacity="0.52" stroke-width="0.95" />
            <path d="M 0 5 C 18 -6 24 -32 16 -50 C 4 -38 0 -16 0 5 Z"
              fill="url(#${uid}-petal-soft)" stroke="var(--petal-rim)" stroke-opacity="0.52" stroke-width="0.95" />
            <ellipse cx="0" cy="-18" rx="11" ry="12" fill="url(#${uid}-core)" opacity="0.65" />
            <path d="M 0 6 C -14 -8 -14 -34 0 -55 C 14 -34 14 -8 0 6 Z"
              fill="url(#${uid}-petal-soft)" stroke="var(--petal-rim)" stroke-opacity="0.7" stroke-width="1" />
            <ellipse cx="0" cy="-6" rx="6.5" ry="5" fill="url(#${uid}-core)" opacity="0.9" />
          </g>
        </g>
      `;
    }

    if (flowerType === "ortanca") {
      // Ortanca (Hydrangea): 15 küçük 4 yapraklı çiçekçikten oluşan dolgun bulutsu demet
      const florets = [
        // Dış halka
        { x: -25, y: -12, s: 0.82, r: 12, layer: 0 },
        { x: 25, y: -12, s: 0.82, r: -14, layer: 0 },
        { x: -24, y: 12, s: 0.8, r: 26, layer: 0 },
        { x: 24, y: 12, s: 0.8, r: -22, layer: 0 },
        { x: -12, y: -25, s: 0.84, r: 8, layer: 0 },
        { x: 12, y: -25, s: 0.84, r: -10, layer: 0 },
        { x: 0, y: 24, s: 0.8, r: 18, layer: 0 },
        { x: -14, y: 20, s: 0.78, r: -8, layer: 0 },
        { x: 14, y: 20, s: 0.78, r: 15, layer: 0 },
        // İç dolgun katman
        { x: -14, y: -6, s: 0.94, r: 22, layer: 1 },
        { x: 14, y: -6, s: 0.94, r: -18, layer: 1 },
        { x: 0, y: -15, s: 0.96, r: 5, layer: 1 },
        { x: -10, y: 9, s: 0.92, r: -12, layer: 1 },
        { x: 10, y: 9, s: 0.92, r: 16, layer: 1 },
        { x: 0, y: 0, s: 1.04, r: 45, layer: 1 },
      ];

      const drawFloret = (f, gradId) => `
        <g transform="translate(${f.x}, ${f.y}) rotate(${f.r}) scale(${f.s})">
          <ellipse cx="0" cy="-7.2" rx="5.2" ry="6.6" fill="url(#${gradId})" stroke="var(--petal-rim)" stroke-opacity="0.4" stroke-width="0.6" />
          <ellipse cx="0" cy="7.2" rx="5.2" ry="6.6" fill="url(#${gradId})" stroke="var(--petal-rim)" stroke-opacity="0.4" stroke-width="0.6" />
          <ellipse cx="-7.2" cy="0" rx="6.6" ry="5.2" fill="url(#${gradId})" stroke="var(--petal-rim)" stroke-opacity="0.4" stroke-width="0.6" />
          <ellipse cx="7.2" cy="0" rx="6.6" ry="5.2" fill="url(#${gradId})" stroke="var(--petal-rim)" stroke-opacity="0.4" stroke-width="0.6" />
          <circle cx="0" cy="0" r="2.2" fill="url(#${uid}-core)" />
        </g>
      `;

      const outerHtml = florets
        .filter((f) => f.layer === 0)
        .map((f) => drawFloret(f, `${uid}-petal-deep`))
        .join("");
      const innerHtml = florets
        .filter((f) => f.layer === 1)
        .map((f) => drawFloret(f, `${uid}-petal-soft`))
        .join("");

      return `
        ${halo}
        <g>${outerHtml}</g>
        <g class="petal-inner-layer" style="transform-origin:0px 0px;--delay:${delaySec}s">
          ${innerHtml}
        </g>
      `;
    }

    if (flowerType === "karanfil") {
      // Karanfil: Fırfırlı ve tırtıklı çok katmanlı yoğun taç yapraklar
      const ruffledRing = (count, outerR, innerR, gradId, rotOffset, strokeOp) => {
        const items = [];
        for (let i = 0; i < count; i++) {
          const deg = (i * 360) / count + rotOffset;
          items.push(
            `<path d="M 0 0 L ${(-innerR).toFixed(1)} ${(-outerR * 0.72).toFixed(1)}
              Q ${(-innerR * 0.7).toFixed(1)} ${(-outerR * 1.04).toFixed(1)} ${(-innerR * 0.42).toFixed(1)} ${(-outerR * 0.88).toFixed(1)}
              Q 0 ${(-outerR * 1.12).toFixed(1)} ${(innerR * 0.42).toFixed(1)} ${(-outerR * 0.88).toFixed(1)}
              Q ${(innerR * 0.7).toFixed(1)} ${(-outerR * 1.04).toFixed(1)} ${(innerR).toFixed(1)} ${(-outerR * 0.72).toFixed(1)} Z"
              fill="url(#${gradId})" stroke="var(--petal-rim)" stroke-opacity="${strokeOp}" stroke-width="0.8"
              transform="rotate(${deg.toFixed(1)})" />`
          );
        }
        return items.join("");
      };

      return `
        ${halo}
        <g>${ruffledRing(9, 41, 14, `${uid}-petal-deep`, 0, "0.35")}</g>
        <g class="petal-inner-layer" style="transform-origin:0px 0px;--delay:${delaySec}s">
          ${ruffledRing(8, 31, 11.5, `${uid}-petal`, 22, "0.52")}
          ${ruffledRing(7, 20, 8.2, `${uid}-petal-soft`, 10, "0.68")}
          <circle cx="0" cy="0" r="6.5" fill="url(#${uid}-petal-deep)" opacity="0.8" />
          <circle cx="0" cy="0" r="3" fill="url(#${uid}-core)" opacity="0.9" />
        </g>
      `;
    }

    // Varsayılan ("gece"): Videodaki ikonik ışıldayan gece çiçeği (4+3 katmanlı parlayan form)
    return `
      ${halo}
      <!-- Arka parlak taç yapraklar -->
      <g>
        <path d="M 0 4 C -16 -8 -19 -33 0 -46 C 19 -33 16 -8 0 4 Z"
          fill="url(#${uid}-petal)" stroke="var(--petal-rim)" stroke-opacity="0.42" stroke-width="0.9" />
        <path d="M -2 2 C -14 -14 -39 -18 -47 2 C -34 18 -13 14 -2 2 Z"
          fill="url(#${uid}-petal)" stroke="var(--petal-rim)" stroke-opacity="0.38" stroke-width="0.9" />
        <path d="M 2 2 C 14 -14 39 -18 47 2 C 34 18 13 14 2 2 Z"
          fill="url(#${uid}-petal)" stroke="var(--petal-rim)" stroke-opacity="0.38" stroke-width="0.9" />
      </g>
      <!-- İç ışıldayan ön yapraklar ve parlak öz -->
      <g class="petal-inner-layer" style="transform-origin:0px 0px;--delay:${delaySec}s">
        <path d="M 0 2 C -14 10 -24 26 -10 34 C 0 39 0 39 10 34 C 24 26 14 10 0 2 Z"
          fill="url(#${uid}-petal-soft)" stroke="var(--petal-rim)" stroke-opacity="0.55" stroke-width="0.95" />
        <path d="M 0 2 C -9 -6 -10 -22 0 -30 C 10 -22 9 -6 0 2 Z"
          fill="url(#${uid}-petal-soft)" opacity="0.7" />
        <ellipse cx="0" cy="2" rx="11" ry="8.5" fill="url(#${uid}-core)" />
        <ellipse cx="0" cy="1" rx="5.5" ry="4" fill="#ffffff" opacity="0.88" />
      </g>
    `;
  }

  /* ========================================================================
     Tam Buket SVG Oluşturucu (5 Dal, Yapraklar, Yan Çimenler, Polenler)
     ======================================================================== */
  function createBouquetSVG(flowerType) {
    const uid = `bq${++svgUidCounter}`;

    // Sol ve sağ yanlarda videodaki gibi zarif salınan çimen demetleri
    const grassBlades = [
      // Sol çimenler
      { d: "M 134 504 Q 100 410 74 300 Q 98 395 144 504 Z", ox: 138, oy: 504, delay: 0.2, deg: -3.8, dur: 4.8 },
      { d: "M 152 504 Q 124 422 104 334 Q 134 415 164 504 Z", ox: 158, oy: 504, delay: 0.34, deg: -2.8, dur: 5.4 },
      { d: "M 176 504 Q 146 440 128 372 Q 160 434 188 504 Z", ox: 182, oy: 504, delay: 0.48, deg: -2.2, dur: 4.3 },
      { d: "M 204 504 Q 180 452 166 404 Q 192 448 214 504 Z", ox: 208, oy: 504, delay: 0.58, deg: -1.8, dur: 5.1 },
      // Sağ çimenler
      { d: "M 426 504 Q 460 410 486 300 Q 462 395 416 504 Z", ox: 422, oy: 504, delay: 0.24, deg: 3.8, dur: 5.0 },
      { d: "M 408 504 Q 436 422 456 334 Q 426 415 396 504 Z", ox: 402, oy: 504, delay: 0.38, deg: 2.9, dur: 4.6 },
      { d: "M 384 504 Q 414 440 432 372 Q 400 434 372 504 Z", ox: 378, oy: 504, delay: 0.52, deg: 2.3, dur: 5.5 },
      { d: "M 356 504 Q 380 452 394 404 Q 368 448 346 504 Z", ox: 352, oy: 504, delay: 0.62, deg: 1.8, dur: 4.4 },
      // Taban dolgun yapraklar
      { d: "M 244 504 Q 214 468 192 438 Q 228 456 260 504 Z", ox: 252, oy: 504, delay: 0.42, deg: -1.5, dur: 4.9 },
      { d: "M 316 504 Q 346 468 368 438 Q 332 456 300 504 Z", ox: 308, oy: 504, delay: 0.45, deg: 1.5, dur: 4.9 },
    ];

    // 5 çiçek dalı: 3 ana kahraman çiçek + 2 yan eşlikçi çiçek
    const stems = [
      // 1. Alt-Sol eşlikçi çiçek (arka katman)
      {
        rootX: 262, rootY: 502,
        path: "M 262 502 C 236 432, 166 392, 126 322",
        len: 270,
        tipX: 126, tipY: 322,
        tilt: -28,
        scale: 0.72,
        stemDelay: 0.32,
        bloomDelay: 1.28,
        breezeDeg: -2.4,
        breezeDur: 5.8,
        breezeDelay: 0.2,
        leaves: [
          { x: 214, y: 424, side: -1, rot: -52, scale: 0.85, delay: 0.82 },
          { x: 174, y: 378, side: 1, rot: 20, scale: 0.78, delay: 0.96 },
        ],
        pollen: [
          { dx: -10, dy: -8, r: 2.2, dur: 4.6, delay: 2.1, mx: -8, ex: 6 },
          { dx: 12, dy: -4, r: 1.8, dur: 5.1, delay: 3.0, mx: 9, ex: -4 },
        ],
      },
      // 2. Alt-Sağ eşlikçi çiçek (arka katman)
      {
        rootX: 298, rootY: 502,
        path: "M 298 502 C 324 432, 394 392, 434 326",
        len: 270,
        tipX: 434, tipY: 326,
        tilt: 28,
        scale: 0.7,
        stemDelay: 0.36,
        bloomDelay: 1.35,
        breezeDeg: 2.4,
        breezeDur: 6.1,
        breezeDelay: 0.5,
        leaves: [
          { x: 346, y: 426, side: 1, rot: 52, scale: 0.84, delay: 0.86 },
          { x: 386, y: 380, side: -1, rot: -20, scale: 0.76, delay: 1.0 },
        ],
        pollen: [
          { dx: 10, dy: -8, r: 2.1, dur: 4.8, delay: 2.3, mx: 8, ex: -6 },
          { dx: -10, dy: -2, r: 1.7, dur: 5.2, delay: 3.3, mx: -7, ex: 5 },
        ],
      },
      // 3. Sol Ana Çiçek
      {
        rootX: 270, rootY: 502,
        path: "M 270 502 C 254 405, 206 312, 174 216",
        len: 340,
        tipX: 174, tipY: 216,
        tilt: -18,
        scale: 0.96,
        stemDelay: 0.16,
        bloomDelay: 1.08,
        breezeDeg: -2.1,
        breezeDur: 5.3,
        breezeDelay: 0.1,
        leaves: [
          { x: 242, y: 404, side: -1, rot: -42, scale: 1.05, delay: 0.64 },
          { x: 222, y: 344, side: 1, rot: 36, scale: 0.98, delay: 0.76 },
          { x: 198, y: 284, side: -1, rot: -32, scale: 0.88, delay: 0.88 },
        ],
        pollen: [
          { dx: -14, dy: -10, r: 2.5, dur: 4.3, delay: 1.8, mx: -10, ex: 8 },
          { dx: 10, dy: -16, r: 2.1, dur: 4.9, delay: 2.6, mx: 12, ex: -6 },
          { dx: 0, dy: -6, r: 1.7, dur: 3.9, delay: 3.5, mx: -6, ex: 10 },
        ],
      },
      // 4. Sağ Ana Çiçek
      {
        rootX: 290, rootY: 502,
        path: "M 290 502 C 306 405, 354 314, 386 220",
        len: 340,
        tipX: 386, tipY: 220,
        tilt: 18,
        scale: 0.95,
        stemDelay: 0.2,
        bloomDelay: 1.14,
        breezeDeg: 2.1,
        breezeDur: 5.6,
        breezeDelay: 0.35,
        leaves: [
          { x: 318, y: 404, side: 1, rot: 42, scale: 1.05, delay: 0.68 },
          { x: 338, y: 344, side: -1, rot: -36, scale: 0.98, delay: 0.8 },
          { x: 362, y: 286, side: 1, rot: 32, scale: 0.88, delay: 0.92 },
        ],
        pollen: [
          { dx: 14, dy: -10, r: 2.5, dur: 4.4, delay: 1.9, mx: 10, ex: -8 },
          { dx: -10, dy: -16, r: 2.0, dur: 5.0, delay: 2.8, mx: -11, ex: 7 },
          { dx: 2, dy: -4, r: 1.8, dur: 4.0, delay: 3.7, mx: 7, ex: -9 },
        ],
      },
      // 5. Orta Ana Kahraman Çiçek (en uzun, ön katman)
      {
        rootX: 280, rootY: 504,
        path: "M 280 504 C 276 400, 286 286, 280 156",
        len: 370,
        tipX: 280, tipY: 156,
        tilt: 0,
        scale: 1.12,
        stemDelay: 0.05,
        bloomDelay: 0.92,
        breezeDeg: 1.5,
        breezeDur: 5.0,
        breezeDelay: 0,
        leaves: [
          { x: 279, y: 416, side: -1, rot: -34, scale: 1.16, delay: 0.54 },
          { x: 281, y: 382, side: 1, rot: 36, scale: 1.12, delay: 0.62 },
          { x: 280, y: 318, side: -1, rot: -32, scale: 1.02, delay: 0.72 },
          { x: 282, y: 276, side: 1, rot: 32, scale: 0.94, delay: 0.82 },
        ],
        pollen: [
          { dx: -18, dy: -12, r: 2.8, dur: 4.2, delay: 1.6, mx: -12, ex: 10 },
          { dx: 18, dy: -16, r: 2.4, dur: 4.7, delay: 2.2, mx: 14, ex: -8 },
          { dx: 0, dy: -22, r: 2.1, dur: 5.1, delay: 2.9, mx: -8, ex: 12 },
          { dx: -6, dy: -6, r: 1.8, dur: 3.8, delay: 3.6, mx: 9, ex: -10 },
        ],
      },
    ];

    const grassMarkup = grassBlades
      .map(
        (g) => `
        <path
          class="grass-blade"
          d="${g.d}"
          fill="url(#${uid}-grass)"
          style="transform-origin:${g.ox}px ${g.oy}px;--delay:${g.delay}s;--sway-deg:${g.deg}deg;--sway-dur:${g.dur}s"
        />`
      )
      .join("");

    const stemsMarkup = stems
      .map((s, stemIdx) => {
        const stemFlowerType =
          flowerType === "karisik"
            ? MIXED_BOUQUET_TYPES[stemIdx % MIXED_BOUQUET_TYPES.length]
            : flowerType;
        const leavesHtml = s.leaves
          .map((lf) => {
            const pathD =
              lf.side < 0
                ? "M 0 0 C -18 -4 -44 -20 -52 -42 C -30 -38 -10 -22 0 0 Z"
                : "M 0 0 C 18 -4 44 -20 52 -42 C 30 -38 10 -22 0 0 Z";
            const veinD =
              lf.side < 0 ? "M -2 -2 Q -24 -16 -44 -36" : "M 2 -2 Q 24 -16 44 -36";
            const startRot = lf.side < 0 ? "22deg" : "-22deg";
            return `
              <g transform="translate(${lf.x}, ${lf.y}) rotate(${lf.rot}) scale(${lf.scale})">
                <g class="stem-leaf" style="transform-origin:0px 0px;--delay:${lf.delay}s;--leaf-start-rot:${startRot}">
                  <path d="${pathD}" fill="url(#${uid}-leaf)" stroke="var(--stem-light)" stroke-opacity="0.32" stroke-width="0.7" />
                  <path d="${veinD}" fill="none" stroke="var(--stem-light)" stroke-opacity="0.45" stroke-width="1" stroke-linecap="round" />
                </g>
              </g>
            `;
          })
          .join("");

        const pollenHtml = s.pollen
          .map(
            (p) => `
            <circle
              class="pollen-orb"
              cx="${s.tipX + p.dx}"
              cy="${s.tipY + p.dy}"
              r="${p.r}"
              fill="var(--pollen-color)"
              style="--p-dur:${p.dur}s;--p-delay:${p.delay}s;--px-mid:${p.mx}px;--px-end:${p.ex}px;filter:drop-shadow(0 0 6px var(--pollen-color))"
            />`
          )
          .join("");

        return `
          <g class="stem-sway-group" style="transform-origin:${s.rootX}px ${s.rootY}px;--breeze-deg:${s.breezeDeg}deg;--breeze-dur:${s.breezeDur}s;--breeze-delay:${s.breezeDelay}s">
            <path
              class="stem-path"
              d="${s.path}"
              fill="none"
              stroke="url(#${uid}-stem)"
              stroke-width="${s.scale > 1 ? 6.2 : s.scale > 0.85 ? 5.2 : 4.2}"
              stroke-linecap="round"
              style="--stem-len:${s.len};--delay:${s.stemDelay}s"
            />
            ${leavesHtml}
            <g transform="translate(${s.tipX}, ${s.tipY}) rotate(${s.tilt}) scale(${s.scale})">
              <g class="flower-head" style="transform-origin:0px 0px;--delay:${s.bloomDelay}s">
                ${renderFlowerHead(stemFlowerType, uid, s.bloomDelay)}
              </g>
            </g>
            ${pollenHtml}
          </g>
        `;
      })
      .join("");

    return `
      <svg class="bouquet-svg" viewBox="0 0 560 520" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Işıldayan çiçek buketi">
        <defs>
          <radialGradient id="${uid}-ground" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="rgb(var(--glow-rgb))" stop-opacity="0.34" />
            <stop offset="55%" stop-color="rgb(var(--glow-rgb))" stop-opacity="0.08" />
            <stop offset="100%" stop-color="rgb(var(--glow-rgb))" stop-opacity="0" />
          </radialGradient>

          <radialGradient id="${uid}-halo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="rgb(var(--glow-rgb))" stop-opacity="0.45" />
            <stop offset="55%" stop-color="rgb(var(--glow-rgb))" stop-opacity="0.12" />
            <stop offset="100%" stop-color="rgb(var(--glow-rgb))" stop-opacity="0" />
          </radialGradient>

          <linearGradient id="${uid}-petal" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stop-color="var(--petal-light)" />
            <stop offset="56%" stop-color="var(--petal-mid)" />
            <stop offset="100%" stop-color="var(--petal-deep)" />
          </linearGradient>

          <linearGradient id="${uid}-petal-soft" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stop-color="var(--petal-rim)" />
            <stop offset="48%" stop-color="var(--petal-light)" />
            <stop offset="100%" stop-color="var(--petal-mid)" />
          </linearGradient>

          <linearGradient id="${uid}-petal-deep" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stop-color="var(--petal-mid)" />
            <stop offset="100%" stop-color="var(--petal-deep)" />
          </linearGradient>

          <radialGradient id="${uid}-core" cx="45%" cy="40%" r="55%">
            <stop offset="0%" stop-color="var(--core-light)" />
            <stop offset="55%" stop-color="var(--core-mid)" />
            <stop offset="100%" stop-color="var(--core-deep)" />
          </radialGradient>

          <radialGradient id="${uid}-daisy-core" cx="38%" cy="35%" r="65%">
            <stop offset="0%" stop-color="#fffbeb" />
            <stop offset="45%" stop-color="#facc15" />
            <stop offset="100%" stop-color="#b45309" />
          </radialGradient>

          <linearGradient id="${uid}-stem" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="var(--stem-light)" />
            <stop offset="60%" stop-color="var(--stem-mid)" />
            <stop offset="100%" stop-color="var(--stem-deep)" />
          </linearGradient>

          <linearGradient id="${uid}-leaf" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="var(--stem-light)" />
            <stop offset="55%" stop-color="var(--stem-mid)" />
            <stop offset="100%" stop-color="var(--stem-deep)" />
          </linearGradient>

          <linearGradient id="${uid}-grass" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stop-color="var(--grass-light)" />
            <stop offset="100%" stop-color="var(--grass-deep)" />
          </linearGradient>
        </defs>

        <!-- Zemin gece ışıltısı -->
        <ellipse class="ground-glow" cx="280" cy="496" rx="195" ry="26" fill="url(#${uid}-ground)" />

        <!-- Yanlarda salınan çimenler -->
        <g>${grassMarkup}</g>

        <!-- Ana çiçek buketi -->
        <g>${stemsMarkup}</g>
      </svg>
    `;
  }

  function mountBouquet(container, flowerType) {
    if (!container) return;
    container.innerHTML = createBouquetSVG(flowerType);
  }

  /* ========================================================================
     Yıldızlı Gece Tuvali + Etkileşimli Parıltı Efektleri
     ======================================================================== */
  function initStarfield() {
    const canvas = document.getElementById("starfield");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let stars = [];
    let fireflies = [];
    let bursts = [];

    function getGlowRgb() {
      const val = getComputedStyle(document.body).getPropertyValue("--glow-rgb").trim();
      return val || "57, 198, 214";
    }

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const starCount = Math.min(150, Math.max(70, Math.floor((width * height) / 11000)));
      stars = Array.from({ length: starCount }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.45 + 0.35,
        phase: Math.random() * Math.PI * 2,
        speed: 0.4 + Math.random() * 1.3,
        warm: Math.random() > 0.78,
      }));

      fireflies = Array.from({ length: 18 }, () => ({
        x: Math.random() * width,
        y: height * (0.25 + Math.random() * 0.7),
        r: Math.random() * 2 + 1.1,
        vx: (Math.random() - 0.5) * 0.24,
        vy: -0.12 - Math.random() * 0.22,
        phase: Math.random() * Math.PI * 2,
      }));
    }

    function spawnBurst(x, y) {
      for (let i = 0; i < 12; i++) {
        const angle = (Math.PI * 2 * i) / 12 + (Math.random() - 0.5) * 0.4;
        const speed = 0.8 + Math.random() * 2.1;
        bursts.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 0.35,
          r: 1.4 + Math.random() * 1.8,
          life: 1,
          decay: 0.018 + Math.random() * 0.014,
        });
      }
    }

    // Hediye ekranında gökyüzüne dokununca/tıklayınca hafif yıldız parıltısı
    document.addEventListener("pointerdown", (e) => {
      if (!document.body.classList.contains("mode-gift")) return;
      if (e.target.closest("button, a, .letter-card")) return;
      spawnBurst(e.clientX, e.clientY);
    });

    resize();
    window.addEventListener("resize", resize);

    let time = 0;
    function tick() {
      time += 0.016;
      ctx.clearRect(0, 0, width, height);
      const glowRgb = getGlowRgb();

      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        const alpha = 0.22 + 0.65 * (0.5 + 0.5 * Math.sin(time * s.speed + s.phase));
        ctx.fillStyle = s.warm
          ? `rgba(255, 244, 210, ${alpha.toFixed(3)})`
          : `rgba(218, 236, 255, ${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      for (let i = 0; i < fireflies.length; i++) {
        const f = fireflies[i];
        f.x += f.vx + Math.sin(time + f.phase) * 0.16;
        f.y += f.vy;
        if (f.y < -10) {
          f.y = height + 10;
          f.x = Math.random() * width;
        }
        if (f.x < -10) f.x = width + 10;
        if (f.x > width + 10) f.x = -10;

        const alpha = 0.2 + 0.55 * (0.5 + 0.5 * Math.sin(time * 1.8 + f.phase));
        const grad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r * 3.8);
        grad.addColorStop(0, `rgba(255, 250, 220, ${alpha.toFixed(3)})`);
        grad.addColorStop(0.5, `rgba(${glowRgb}, ${(alpha * 0.55).toFixed(3)})`);
        grad.addColorStop(1, `rgba(${glowRgb}, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r * 3.8, 0, Math.PI * 2);
        ctx.fill();
      }

      for (let i = bursts.length - 1; i >= 0; i--) {
        const b = bursts[i];
        b.x += b.vx;
        b.y += b.vy;
        b.vx *= 0.98;
        b.vy *= 0.98;
        b.life -= b.decay;
        if (b.life <= 0) {
          bursts.splice(i, 1);
          continue;
        }
        ctx.fillStyle = `rgba(${glowRgb}, ${b.life.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r * b.life, 0, Math.PI * 2);
        ctx.fill();
      }

      requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  /* ========================================================================
     Tema Uygulama & Toast Bildirimi
     ======================================================================== */
  function applyTheme(themeKey) {
    const safeTheme = VALID_THEMES.has(themeKey) ? themeKey : "turkuaz";
    VALID_THEMES.forEach((t) => document.body.classList.remove(`theme-${t}`));
    document.body.classList.add(`theme-${safeTheme}`);
  }

  let toastTimer = null;
  function showToast(text) {
    const el = document.getElementById("toast");
    if (!el) return;
    el.textContent = text;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
  }

  /* ========================================================================
     HEDİYE EKRANI KONTROLÜ
     ======================================================================== */
  function initGiftView(data) {
    document.body.classList.remove("mode-builder", "letter-open");
    document.body.classList.add("mode-gift");
    applyTheme(data.theme);

    const giftView = document.getElementById("gift-view");
    const builderView = document.getElementById("builder-view");
    const giftTitle = document.getElementById("gift-title");
    const giftBouquet = document.getElementById("gift-bouquet");
    const envelopeDock = document.getElementById("envelope-dock");
    const openLetterBtn = document.getElementById("open-letter-btn");
    const closeLetterBtn = document.getElementById("close-letter-btn");
    const letterPanel = document.getElementById("letter-panel");
    const letterBody = document.getElementById("letter-body");
    const letterFooter = document.getElementById("letter-footer");
    const letterSignature = document.getElementById("letter-signature");
    const replayBtn = document.getElementById("replay-gift-btn");
    const createOwnLink = document.getElementById("create-own-link");

    builderView.classList.add("hidden");
    giftView.classList.remove("hidden");

    giftTitle.textContent = data.title;
    document.title = `${data.title} — Gece Buketi`;
    mountBouquet(giftBouquet, data.flower);

    const hasLetter = Boolean(data.message && data.message.trim().length > 0);
    if (hasLetter) {
      envelopeDock.classList.remove("hidden");
      letterBody.textContent = data.message;
      if (data.sender) {
        letterSignature.textContent = data.sender;
        letterFooter.classList.remove("hidden");
      } else {
        letterFooter.classList.add("hidden");
      }
    } else {
      envelopeDock.classList.add("hidden");
    }

    function setLetterOpen(isOpen) {
      document.body.classList.toggle("letter-open", isOpen);
      openLetterBtn.setAttribute("aria-expanded", String(isOpen));
      letterPanel.setAttribute("aria-hidden", String(!isOpen));
    }

    openLetterBtn.addEventListener("click", () => setLetterOpen(true));
    closeLetterBtn.addEventListener("click", () => setLetterOpen(false));

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && document.body.classList.contains("letter-open")) {
        setLetterOpen(false);
      }
    });

    replayBtn.addEventListener("click", () => {
      setLetterOpen(false);
      // Başlık, zarf ve buket animasyonlarını yeniden başlat
      const header = giftView.querySelector(".gift-header");
      if (header) {
        header.style.animation = "none";
        void header.offsetWidth;
        header.style.animation = "";
      }
      if (hasLetter) {
        envelopeDock.style.animation = "none";
        void envelopeDock.offsetWidth;
        envelopeDock.style.animation = "";
      }
      mountBouquet(giftBouquet, data.flower);
    });

    createOwnLink.setAttribute("href", window.location.href.split("?")[0].split("#")[0]);
  }

  /* ========================================================================
     BUKET OLUŞTURUCU STÜDYO KONTROLÜ
     ======================================================================== */
  function initBuilderView() {
    document.body.classList.remove("mode-gift", "letter-open");
    document.body.classList.add("mode-builder");

    const giftView = document.getElementById("gift-view");
    const builderView = document.getElementById("builder-view");
    giftView.classList.add("hidden");
    builderView.classList.remove("hidden");

    const state = {
      title: "",
      flower: "gece",
      theme: "turkuaz",
      message: "",
      sender: "",
      userPickedTheme: false,
    };

    const form = document.getElementById("builder-form");
    const inputTitle = document.getElementById("input-title");
    const inputMessage = document.getElementById("input-message");
    const inputSender = document.getElementById("input-sender");
    const titleCount = document.getElementById("title-count");
    const messageCount = document.getElementById("message-count");
    const senderCount = document.getElementById("sender-count");

    const previewTitle = document.getElementById("preview-title");
    const previewBouquet = document.getElementById("preview-bouquet");
    const previewEnvelopeHint = document.getElementById("preview-envelope-hint");
    const previewReplayBtn = document.getElementById("preview-replay-btn");
    const selectedThemeName = document.getElementById("selected-theme-name");

    const flowerButtons = Array.from(document.querySelectorAll(".flower-option"));
    const themeButtons = Array.from(document.querySelectorAll(".theme-swatch"));
    const presetChips = Array.from(document.querySelectorAll(".chip"));

    const shareBox = document.getElementById("share-box");
    const generatedUrlInput = document.getElementById("generated-url");
    const copyUrlBtn = document.getElementById("copy-url-btn");
    const openPreviewLink = document.getElementById("open-preview-link");
    const whatsappShareLink = document.getElementById("whatsapp-share-link");

    function updateThemeSelection(themeKey) {
      state.theme = themeKey;
      applyTheme(themeKey);
      selectedThemeName.textContent = THEME_LABELS[themeKey] || "";
      themeButtons.forEach((btn) => {
        const active = btn.dataset.theme === themeKey;
        btn.classList.toggle("active", active);
        btn.setAttribute("aria-checked", String(active));
      });
    }

    function updateFlowerSelection(flowerKey) {
      state.flower = flowerKey;
      flowerButtons.forEach((btn) => {
        const active = btn.dataset.flower === flowerKey;
        btn.classList.toggle("active", active);
        btn.setAttribute("aria-checked", String(active));
      });
      if (!state.userPickedTheme && FLOWER_DEFAULTS[flowerKey]) {
        updateThemeSelection(FLOWER_DEFAULTS[flowerKey]);
      }
      mountBouquet(previewBouquet, state.flower);
      refreshShareLinkIfVisible();
    }

    function updatePreviewText() {
      previewTitle.textContent = state.title.trim() || "Seni Seviyorum";
      titleCount.textContent = `${state.title.length} / 70`;
      messageCount.textContent = `${state.message.length} / 700`;
      senderCount.textContent = `${state.sender.length} / 40`;
      previewEnvelopeHint.classList.toggle("hidden", state.message.trim().length === 0);
      refreshShareLinkIfVisible();
    }

    function refreshShareLinkIfVisible() {
      if (shareBox.classList.contains("hidden")) return;
      const url = buildShareUrl(state);
      generatedUrlInput.value = url;
      openPreviewLink.href = url;
      const waText = `Sana özel bir gece buketi hazırladım 💐✨\n${url}`;
      whatsappShareLink.href = `https://wa.me/?text=${encodeURIComponent(waText)}`;
    }

    inputTitle.addEventListener("input", () => {
      state.title = inputTitle.value;
      updatePreviewText();
    });

    inputMessage.addEventListener("input", () => {
      state.message = inputMessage.value;
      updatePreviewText();
    });

    inputSender.addEventListener("input", () => {
      state.sender = inputSender.value;
      updatePreviewText();
    });

    presetChips.forEach((chip) => {
      chip.addEventListener("click", () => {
        const preset = chip.dataset.preset || "";
        inputTitle.value = preset;
        state.title = preset;
        updatePreviewText();
        inputTitle.focus();
      });
    });

    flowerButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        updateFlowerSelection(btn.dataset.flower);
      });
    });

    themeButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        state.userPickedTheme = true;
        updateThemeSelection(btn.dataset.theme);
        refreshShareLinkIfVisible();
      });
    });

    previewReplayBtn.addEventListener("click", () => {
      mountBouquet(previewBouquet, state.flower);
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!state.title.trim()) {
        state.title = "Seni Seviyorum";
        inputTitle.value = state.title;
        updatePreviewText();
      }
      const url = buildShareUrl(state);
      generatedUrlInput.value = url;
      openPreviewLink.href = url;
      const waText = `Sana özel bir gece buketi hazırladım 💐✨\n${url}`;
      whatsappShareLink.href = `https://wa.me/?text=${encodeURIComponent(waText)}`;

      shareBox.classList.remove("hidden");
      shareBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
      showToast("Özel buket linkin oluşturuldu!");
    });

    copyUrlBtn.addEventListener("click", async () => {
      const url = generatedUrlInput.value;
      if (!url) return;
      try {
        await navigator.clipboard.writeText(url);
        copyUrlBtn.textContent = "Kopyalandı ✓";
        showToast("Link panoya kopyalandı!");
        setTimeout(() => {
          copyUrlBtn.textContent = "Kopyala";
        }, 2000);
      } catch {
        generatedUrlInput.select();
        document.execCommand("copy");
        copyUrlBtn.textContent = "Kopyalandı ✓";
        showToast("Link panoya kopyalandı!");
        setTimeout(() => {
          copyUrlBtn.textContent = "Kopyala";
        }, 2000);
      }
    });

    // İlk yükleme
    updateThemeSelection(state.theme);
    mountBouquet(previewBouquet, state.flower);
    updatePreviewText();
  }

  /* ========================================================================
     Başlatma
     ======================================================================== */
  function bootstrap() {
    initStarfield();
    const rawParam = getGiftParamFromUrl();
    if (rawParam) {
      const parsed = decodePayload(rawParam);
      if (parsed) {
        initGiftView(parsed);
        return;
      }
    }
    initBuilderView();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrap);
  } else {
    bootstrap();
  }
})();
