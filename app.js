/* ===== PENGATURAN ===== */
const CONFIG = {
  nama: "Homatic",
  partikel: 0, // 0 = otomatis, atau isi angka (misal 150)
  kerapatan: 7500, // makin kecil = makin banyak partikel
  ukuran: 1, // 1 = normal, 0.7 = lebih kecil
  opasitas: 0.75, // 1 = pekat, 0.5 = lebih transparan
  lebarKarakter: 300,
  geserY: 4,
  batas: 2000, // batas kalibrasi LDR (untuk simulasi)
  footer:
    "Homatic · Smart Clothesline & Automated Lighting System Based on ESP32 & Blynk IoT",
};
/* ======================= */
const $ = (s) => document.querySelector(s),
  $$ = (s) => [...document.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t),
  rgb = (c) => `rgb(${c.map(Math.round)})`;
const MENU = [
  ["index.html", "Beranda"],
  ["prinsip.html", "Prinsip"],
  ["alat.html", "Alat"],
  ["langkah.html", "Langkah"],
  ["kode.html", "Kode"],
  ["hasil.html", "Hasil"],
  ["tim.html", "Tim"],
];
const file = location.pathname.split("/").pop() || "index.html";
const LBL = ["☀️ Cerah", "🌇 Senja", "🌙 Malam"];

/* ---- karakter (SVG buatan kode) ---- */
const SVG = `<svg id="ch" viewBox="0 0 200 200"><g id="bd">
<rect x="130" y="34" width="18" height="34" rx="5" fill="#2dd4bf"/>
<path d="M32 100 L100 36 L168 100 V158 a18 18 0 0 1 -18 18 H50 a18 18 0 0 1 -18 -18Z" fill="#fff" stroke="#c5ece6" stroke-width="3" stroke-linejoin="round"/>
<path d="M16 104 L100 24 L184 104" fill="none" stroke="#2dd4bf" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>
<circle cx="100" cy="76" r="13" style="fill:var(--win,#d9f7f2)" stroke="#2dd4bf" stroke-width="4"/>
<path d="M100 63v26M87 76h26" stroke="#2dd4bf" stroke-width="3"/>
<g id="fc">
<ellipse cx="52" cy="152" rx="10" ry="6" fill="#ff9fb2" opacity=".55"/><ellipse cx="148" cy="152" rx="10" ry="6" fill="#ff9fb2" opacity=".55"/>
<g class="eye"><ellipse cx="72" cy="128" rx="19" ry="22" fill="#c4f0ed"/><g class="pp"><circle cx="72" cy="128" r="11" fill="#000000"/><circle cx="76" cy="122" r="4.5" fill="#fff"/><circle cx="68" cy="134" r="2" fill="#fff"/></g></g>
<g class="eye"><ellipse cx="128" cy="128" rx="19" ry="22" fill="#c4f0ed"/><g class="pp"><circle cx="128" cy="128" r="11" fill="#000000"/><circle cx="132" cy="122" r="4.5" fill="#fff"/><circle cx="124" cy="134" r="2" fill="#fff"/></g></g>
<path id="mo" d="M89 152 q11 10 22 0" fill="none" stroke="#0f3d3a" stroke-width="4" stroke-linecap="round"/>
</g></g></svg>`;

document.head.insertAdjacentHTML(
  "beforeend",
  `<style>
#st{position:fixed;inset:0;z-index:1;pointer-events:none}
#char{position:fixed;left:50%;top:calc(50% + ${CONFIG.geserY}vh);width:min(${CONFIG.lebarKarakter}px,58vw);translate:-50% -50%;z-index:1;pointer-events:none}
#ch{width:100%;display:block;overflow:visible;transform-origin:50% 88%;filter:drop-shadow(0 10px 14px rgba(15,61,58,.22))}
#sh{position:absolute;left:16%;right:16%;bottom:5%;height:8%;background:radial-gradient(ellipse,rgba(15,61,58,.35),transparent 70%);filter:blur(3px)}
.eye{transform-box:fill-box;transform-origin:center;transition:transform .09s}
.eye.bl{transform:scaleY(.08)}
#bg::before{content:"";position:absolute;left:50%;top:50%;width:75vmin;height:75vmin;translate:-50% -50%;background:radial-gradient(circle,rgba(255,255,255,.7),transparent 65%);opacity:var(--halo,1)}
</style>`,
);
document.body.insertAdjacentHTML(
  "afterbegin",
  `<div class="prog" id="prog"></div>
  <div id="bg"></div><canvas id="st"></canvas>
  <div id="char"><div id="sh"></div>${SVG}</div>
  <nav><span class="logo">🏠 ${CONFIG.nama}</span>${MENU.map(([h, t]) => `<a href="${h}"${h === file ? ' class="on"' : ""}>${t}</a>`).join("")}</nav>
  <div class="chip" id="chip">✨ Tahan klik: bintang berkumpul, lepas: buyar</div><div id="cur"></div><div class="toast" id="toast"></div>`,
);
$("main").insertAdjacentHTML(
  "afterend",
  `<footer><span>${CONFIG.footer}</span></footer>`,
);
if (matchMedia("(hover:hover)").matches)
  document.documentElement.classList.add("has-cur");

/* ---- langit: pagi → senja → malam, mengikuti scroll ---- */
const SKY = [
  [
    [244, 255, 253],
    [184, 241, 232],
  ],
  [
    [255, 224, 204],
    [127, 214, 204],
  ],
  [
    [6, 32, 44],
    [11, 74, 85],
  ],
];
let pr = 0,
  dk = 0,
  pc = [13, 148, 136],
  hintUntil = Date.now() + 6000;
function bg() {
  pr = clamp(
    scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight),
  );
  const s = pr < 0.5 ? 0 : 1,
    t0 = (pr < 0.5 ? pr : pr - 0.5) / 0.5,
    t = t0 * t0 * (3 - 2 * t0);
  const A = SKY[s],
    B = SKY[s + 1];
  $("#bg").style.background =
    `linear-gradient(${rgb(mix(A[0], B[0], t))},${rgb(mix(A[1], B[1], t))})`;
  dk = clamp((pr - 0.3) / 0.45);
  pc = mix([13, 148, 136], [232, 255, 251], dk);
  $("#bg").style.setProperty("--halo", 1 - dk * 0.7);
  document.documentElement.style.setProperty(
    "--win",
    rgb(mix([217, 247, 242], [255, 214, 102], dk)),
  );
  if (Date.now() > hintUntil)
    $("#chip").textContent = LBL[pr < 0.33 ? 0 : pr < 0.66 ? 1 : 2];
  $("#prog").style.width = pr * 100 + "%";
}
addEventListener("scroll", bg, { passive: true });
bg();
setTimeout(bg, 6100);

/* ---- partikel rasi bintang ---- */
const st = $("#st"),
  g = st.getContext("2d");
let W,
  H,
  P = [];
const nova = () => ({
  x: Math.random() * W,
  y: Math.random() * H,
  bx: (Math.random() - 0.5) * 18,
  by: (Math.random() - 0.5) * 18,
  ex: 0,
  ey: 0,
  r: Math.random() < 0.08 ? 1.9 : 0.8 + Math.random() * 0.8,
  tw: 1 + Math.random() * 2,
  ph: Math.random() * 6.28,
});
function resize() {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  W = innerWidth;
  H = innerHeight;
  st.width = W * dpr;
  st.height = H * dpr;
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  const n =
    CONFIG.partikel || Math.round(clamp((W * H) / CONFIG.kerapatan, 70, 260));
  while (P.length < n) P.push(nova());
  P.length = n;
}
addEventListener("resize", resize);
resize();
const M = { x: -999, y: -999, on: false, down: false };
function boom(x, y, F, R = 300) {
  for (const p of P) {
    const dx = p.x - x,
      dy = p.y - y,
      d = Math.hypot(dx, dy) || 1;
    if (d < R) {
      const f = (1 - d / R) * F;
      p.ex += (dx / d) * f;
      p.ey += (dy / d) * f;
    }
  }
}
function draw(dt, t) {
  g.clearRect(0, 0, W, H);
  const D = Math.min(125, Math.max(80, W / 11)),
    col = pc.map(Math.round).join(","),
    op = CONFIG.opasitas,
    uk = CONFIG.ukuran;
  for (const p of P) {
    if (M.on) {
      const dx = p.x - M.x,
        dy = p.y - M.y,
        d = Math.hypot(dx, dy) || 1;
      if (M.down) {
        if (d < 280) {
          const f = (1 - d / 280) * 1500 * dt;
          p.ex += (-dx / d) * f - (dy / d) * f * 0.5;
          p.ey += (-dy / d) * f + (dx / d) * f * 0.5;
        }
      } else if (d < 130) {
        const f = (1 - d / 130) * 1100 * dt;
        p.ex += (dx / d) * f;
        p.ey += (dy / d) * f;
      }
    }
    const k = Math.pow(M.down ? 0.5 : 0.08, dt);
    p.ex = clamp(p.ex * k, -900, 900);
    p.ey = clamp(p.ey * k, -900, 900);
    p.x += (p.bx + p.ex) * dt;
    p.y += (p.by + p.ey) * dt;
    if (p.x < -20) p.x = W + 20;
    else if (p.x > W + 20) p.x = -20;
    if (p.y < -20) p.y = H + 20;
    else if (p.y > H + 20) p.y = -20;
  }
  g.lineWidth = 1;
  for (let i = 0; i < P.length; i++)
    for (let j = i + 1; j < P.length; j++) {
      const dx = P[i].x - P[j].x,
        dy = P[i].y - P[j].y,
        q = dx * dx + dy * dy;
      if (q < D * D) {
        g.strokeStyle = `rgba(${col},${(1 - Math.sqrt(q) / D) * 0.4 * op})`;
        g.beginPath();
        g.moveTo(P[i].x, P[i].y);
        g.lineTo(P[j].x, P[j].y);
        g.stroke();
      }
    }
  if (M.on)
    for (const p of P) {
      const d = Math.hypot(p.x - M.x, p.y - M.y);
      if (d < 170) {
        g.strokeStyle = `rgba(${col},${(1 - d / 170) * 0.6 * op})`;
        g.beginPath();
        g.moveTo(M.x, M.y);
        g.lineTo(p.x, p.y);
        g.stroke();
      }
    }
  for (const p of P) {
    const a = (0.4 + 0.35 * Math.sin(t * p.tw + p.ph)) * op,
      r = p.r * uk;
    g.fillStyle = `rgba(${col},${a})`;
    g.beginPath();
    g.arc(p.x, p.y, r, 0, 6.283);
    g.fill();
    if (p.r > 1.7) {
      g.strokeStyle = `rgba(${col},${a * 0.8})`;
      g.beginPath();
      g.moveTo(p.x - r * 2.4, p.y);
      g.lineTo(p.x + r * 2.4, p.y);
      g.moveTo(p.x, p.y - r * 2.4);
      g.lineTo(p.x, p.y + r * 2.4);
      g.stroke();
    }
  }
}

/* ---- kursor + percikan + input ---- */
const SP = ["✦", "♡", "✿", "★"],
  cur = $("#cur");
let lastMove = 0;
function spark(x, y, k) {
  for (let i = 0; i < k; i++) {
    const s = document.createElement("span");
    s.className = "spark";
    s.textContent = SP[(Math.random() * SP.length) | 0];
    s.style.cssText = `left:${x}px;top:${y}px;--dx:${(Math.random() - 0.5) * 90}px;--dy:${20 + Math.random() * 60}px;color:${Math.random() < 0.5 ? "#14b8a6" : "#5eead4"}`;
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 900);
  }
}
function move(x, y) {
  M.x = x;
  M.y = y;
  M.on = true;
  lastMove = Date.now();
  cur.style.transform = `translate(${x}px,${y}px)`;
}
addEventListener("pointermove", (e) => move(e.clientX, e.clientY));
addEventListener(
  "touchmove",
  (e) => move(e.touches[0].clientX, e.touches[0].clientY),
  { passive: true },
);
addEventListener("pointerdown", (e) => {
  move(e.clientX, e.clientY);
  M.down = true;
  spark(e.clientX, e.clientY, 8);
});
function lepas(e) {
  if (M.down) {
    M.down = false;
    boom(M.x, M.y, 1100, 320);
  }
  if (e.pointerType === "touch") M.on = false;
}
addEventListener("pointerup", lepas);
addEventListener("pointercancel", lepas);
addEventListener("mouseout", (e) => {
  if (!e.relatedTarget) M.on = false;
});
document.addEventListener("pointerover", (e) =>
  cur.classList.toggle(
    "big",
    !!e.target.closest("a,button,.card,.pin,input,label,.shot img"),
  ),
);

/* ---- karakter: tengak-tengok, berkedip, loncat ---- */
const chEl = $("#char"),
  ch = $("#ch"),
  fc = $("#fc"),
  sh = $("#sh"),
  mo = $("#mo"),
  eyes = $$(".eye"),
  pps = $$(".pp");
let hx = 0,
  hy = 0,
  tgx = 0,
  tgy = 0,
  jy = 0,
  jv = 0,
  sq = 0,
  air = false,
  nextJump = 0,
  nextLook = 0,
  blinkAt = 0,
  last = performance.now();
function pusat() {
  const r = chEl.getBoundingClientRect();
  return [r.left + r.width / 2, r.top + r.height / 2, r.width];
}
function jump() {
  if (air || Date.now() < nextJump) return;
  air = true;
  jv = -760;
  nextJump = Date.now() + 900;
  mo.setAttribute("d", "M88 148 q12 22 24 0z");
  mo.style.fill = "#ff8aa0";
  const [cx, cy] = pusat();
  boom(cx, cy, 850, 330);
  spark(cx, cy - 40, 6);
}
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  const t = now / 1000;
  const [cx, cy, w] = pusat(),
    idle = Date.now() - lastMove > 2500 || !M.on;
  if (idle) {
    if (now > nextLook) {
      tgx = (Math.random() * 2 - 1) * 0.9;
      tgy = (Math.random() * 2 - 1) * 0.6;
      nextLook = now + 1600 + Math.random() * 1800;
    }
  } else {
    tgx = clamp((M.x - cx) / (W * 0.35), -1, 1);
    tgy = clamp((M.y - cy) / (H * 0.35), -1, 1);
    if (Math.hypot(M.x - cx, M.y - cy) < w * 0.42) jump();
  }
  const kf = 1 - Math.pow(0.0008, dt);
  hx += (tgx - hx) * kf;
  hy += (tgy - hy) * kf;
  if (air) {
    jy += jv * dt;
    jv += 2400 * dt;
    if (jy >= 0) {
      jy = 0;
      air = false;
      sq = 1;
      mo.setAttribute("d", "M89 152 q11 10 22 0");
      mo.style.fill = "none";
      const [x, y] = pusat();
      boom(x, y, 650, 260);
      spark(x, y + w * 0.3, 5);
    }
  }
  sq *= Math.pow(0.003, dt);
  const stretch = air ? Math.min(0.1, Math.abs(jv) / 7000) : 0,
    br = Math.sin(t * 2) * 0.012;
  fc.style.transform = `translate(${hx * 11}px,${hy * 7}px)`;
  pps.forEach(
    (e) => (e.style.transform = `translate(${hx * 6}px,${hy * 5}px)`),
  );
  ch.style.transform = `perspective(800px) rotateY(${hx * 26}deg) rotateX(${-hy * 18}deg) rotate(${hx * 3}deg) translateY(${jy}px) scale(${1 - stretch * 0.5 + sq * 0.15},${1 + stretch - sq * 0.15 + br})`;
  sh.style.transform = `scale(${1 - Math.min(0.5, -jy / 260)})`;
  sh.style.opacity = 1 - Math.min(0.6, -jy / 260);
  if (now > blinkAt) {
    eyes.forEach((e) => e.classList.add("bl"));
    setTimeout(() => eyes.forEach((e) => e.classList.remove("bl")), 120);
    blinkAt = now + 2000 + Math.random() * 3500;
  }
  draw(dt, t);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

/* ---- kartu miring 3D, tombol magnet, muncul saat scroll ---- */
$$(".card").forEach((c) => {
  c.classList.add("reveal");
  if (c.classList.contains("flat")) return;
  c.addEventListener("pointermove", (e) => {
    const r = c.getBoundingClientRect(),
      x = (e.clientX - r.left) / r.width,
      y = (e.clientY - r.top) / r.height;
    c.style.setProperty("--ry", (x - 0.5) * 12 + "deg");
    c.style.setProperty("--rx", (0.5 - y) * 12 + "deg");
    c.style.setProperty("--gx", x * 100 + "%");
    c.style.setProperty("--gy", y * 100 + "%");
  });
  c.addEventListener("pointerleave", () => {
    c.style.setProperty("--rx", "0deg");
    c.style.setProperty("--ry", "0deg");
  });
});
$$(".btn").forEach((b) => {
  b.addEventListener("pointermove", (e) => {
    const r = b.getBoundingClientRect();
    b.style.translate = `${(e.clientX - r.left - r.width / 2) * 0.25}px ${(e.clientY - r.top - r.height / 2) * 0.35}px`;
  });
  b.addEventListener("pointerleave", () => (b.style.translate = "0 0"));
});
const io = new IntersectionObserver(
  (es) => es.forEach((e) => e.isIntersecting && e.target.classList.add("in")),
  { threshold: 0.15 },
);
$$(".reveal,.title").forEach((el) => io.observe(el));

/* ---- gambar: klik untuk memperbesar ---- */
document.addEventListener("click", (e) => {
  const im = e.target.closest(".shot img");
  if (!im) return;
  const d = document.createElement("div");
  d.className = "lb";
  d.innerHTML = `<img src="${im.src}" alt="">`;
  d.onclick = () => d.remove();
  document.body.appendChild(d);
});

/* ---- toast, salin pin, salin kode ---- */
function toast(t) {
  const e = $("#toast");
  e.textContent = t;
  e.classList.add("show");
  clearTimeout(e._t);
  e._t = setTimeout(() => e.classList.remove("show"), 1600);
}
$$(".pin").forEach(
  (p) =>
    (p.onclick = () => {
      navigator.clipboard && navigator.clipboard.writeText(p.textContent);
      toast("Disalin: " + p.textContent + " ✨");
    }),
);
if ($("#salin"))
  $("#salin").onclick = () => {
    navigator.clipboard &&
      navigator.clipboard.writeText($("#kode").textContent);
    toast("Kode disalin 📋✨");
  };

/* ---- simulasi (hanya di prinsip.html) ---- */
if ($("#ldr")) {
  $("#th").value = CONFIG.batas;
  const f = () => {
    const auto = $("#auto").checked,
      gelap = +$("#ldr").value > +$("#th").value,
      hujan = $("#rain").checked;
    $("#ldrv").textContent = $("#ldr").value;
    let lampu, jem;
    if (auto) {
      lampu = gelap;
      jem = !(gelap || hujan);
    } else {
      lampu = $("#mlamp").checked;
      jem = $("#mjem").checked;
    }
    $("#mpanel").style.display = auto ? "none" : "block";
    $("#t-mode").className = "tile on";
    $("#t-mode").innerHTML =
      (auto ? "🤖" : "🎮") + `<b>Mode ${auto ? "Otomatis" : "Manual"}</b>`;
    $("#t-lamp").className = "tile" + (lampu ? " on" : "");
    $("#t-lamp").innerHTML =
      (lampu ? "💡" : "🌑") + `<b>Lampu ${lampu ? "NYALA" : "MATI"}</b>`;
    $("#t-jem").className = "tile" + (jem ? " on" : "");
    $("#t-jem").innerHTML =
      (jem ? "👕☀️" : "🏠👕") +
      `<b>Jemuran ${jem ? "KELUAR (90°)" : "MASUK (0°)"}</b>`;
  };
  $$(".sim input").forEach((i) => i.addEventListener("input", f));
  f();
}
