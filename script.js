// ==========================================================
// DANEDIT – Scroll-Animationen im Stil einer Apple-Produktseite
// ==========================================================

const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));

// Profilbild: neuestes Bild aus dem Ordner "profilbild" im Repo verwenden,
// sonst bleibt das im HTML eingetragene Bild stehen
const avatar = document.querySelector(".avatar img[data-folder]");
if (avatar) {
  const api = "https://api.github.com/repos/DanEdit/danedit.github.io";
  fetch(`${api}/contents/${avatar.dataset.folder}`)
    .then((r) => (r.ok ? r.json() : []))
    .then(async (files) => {
      const imgs = files.filter((f) => /\.(jpe?g|png|webp|gif|avif)$/i.test(f.name));
      if (!imgs.length) return;
      // Datum des letzten Commits je Bild -> neuestes gewinnt
      const dates = await Promise.all(imgs.map((f) =>
        fetch(`${api}/commits?path=${encodeURIComponent(f.path)}&per_page=1`)
          .then((r) => (r.ok ? r.json() : []))
          .then((c) => (c[0] ? c[0].commit.committer.date : ""))
      ));
      const newest = imgs[dates.indexOf([...dates].sort().pop())];
      const src = newest.path.split("/").map(encodeURIComponent).join("/");
      if (!avatar.src.endsWith(src)) avatar.src = src;
    })
    .catch(() => {});
}

// Text in einzelne Wörter zerlegen (für das Aufleuchten)
const lightups = [...document.querySelectorAll("[data-lightup]")].map((el) => {
  el.innerHTML = el.textContent.trim().split(/\s+/).map((w) => `<span>${w}</span>`).join(" ");
  return { el, words: [...el.children] };
});

const zooms = [...document.querySelectorAll("[data-zoom]")];
const cubes = [...document.querySelectorAll("[data-cube]")];

// Intro: Startzustand (groß + mittig) aus der Endposition berechnen
const intro = document.querySelector("[data-intro]");
const introStage = intro && intro.querySelector(".hero-sticky");
const introAvatar = intro && intro.querySelector("[data-intro-avatar]");
const introTitle = intro && intro.querySelector("[data-intro-title]");
const introLater = intro ? [...intro.querySelectorAll("[data-later]")] : [];
const introHint = intro && intro.querySelector("[data-hint]");
let introGeo = null;

function measureIntro() {
  if (!intro) return;
  introAvatar.style.transform = introTitle.style.transform = "";
  const box = introStage.getBoundingClientRect();
  const a = introAvatar.getBoundingClientRect();
  const t = introTitle.getBoundingClientRect();
  // Startgrößen: Bild deutlich größer, Name so groß wie es die Breite zulässt
  const A = Math.min(240, innerWidth * 0.55, box.height * 0.32) / a.height;
  const T = Math.min(1.45, (innerWidth * 0.9) / t.width);
  const gap = 28;
  const total = a.height * A + gap + t.height * T;
  const top = (box.height - total) / 2;
  introGeo = {
    A, T,
    dyA: top + (a.height * A) / 2 - (a.top - box.top + a.height / 2),
    dyT: top + a.height * A + gap + (t.height * T) / 2 - (t.top - box.top + t.height / 2),
  };
}

const easeInOut = (x) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);

// Alle scroll-gesteuerten Effekte in einem Frame berechnen
function onScroll() {
  const vh = innerHeight;

  // Intro: Bild + Name schrumpfen an ihren Platz, Rest blendet ein
  if (introGeo) {
    const r = intro.getBoundingClientRect();
    const p = clamp(-r.top / (r.height - introStage.offsetHeight));
    const k = 1 - easeInOut(p);
    const { A, T, dyA, dyT } = introGeo;
    introAvatar.style.transform = `translateY(${dyA * k}px) scale(${1 + (A - 1) * k})`;
    introTitle.style.transform = `translateY(${dyT * k}px) scale(${1 + (T - 1) * k})`;
    introLater.forEach((el, i) => {
      const q = clamp((p - 0.45 - i * 0.1) / 0.25);
      el.style.opacity = q;
      el.style.transform = `translateY(${24 * (1 - q)}px)`;
    });
    introHint.style.opacity = clamp(1 - p * 5);
  }

  // Bild wächst, solange es "klebt"
  zooms.forEach((z) => {
    const r = z.getBoundingClientRect();
    const p = clamp(-r.top / (r.height - vh));
    z.querySelector(".zoom-media").style.setProperty("--p", p.toFixed(3));
  });

  // Würfel dreht sich, während er durchs Bild läuft
  cubes.forEach((c) => {
    const r = c.getBoundingClientRect();
    const p = clamp((vh - r.top) / (vh + r.height));
    c.style.setProperty("--r", p.toFixed(3));
  });

  // Wörter leuchten nacheinander auf, während der Absatz nach oben wandert
  lightups.forEach(({ el, words }) => {
    const r = el.getBoundingClientRect();
    const p = clamp((vh * 0.85 - r.top) / (vh * 0.5));
    const lit = Math.round(p * words.length);
    words.forEach((w, i) => w.classList.toggle("on", i < lit));
  });
}

if (!reduceMotion) {
  let ticking = false;
  addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { onScroll(); ticking = false; });
  }, { passive: true });
  const relayout = () => { measureIntro(); onScroll(); };
  addEventListener("resize", relayout);
  if (document.fonts) document.fonts.ready.then(relayout);
  relayout();
}

// Einblenden + Zahlen hochzählen
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add("visible");
    entry.target.querySelectorAll("[data-count]").forEach(countUp);
    observer.unobserve(entry.target);
  });
}, { threshold: 0.2 });
document.querySelectorAll(".reveal, .reveal-scale").forEach((el) => observer.observe(el));

function countUp(el) {
  const target = parseInt(el.dataset.count, 10);
  const suffix = el.dataset.suffix || "";
  const start = performance.now();
  (function step(now) {
    const p = Math.min((now - start) / 1600, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(target * eased).toLocaleString("de-DE") + suffix;
    if (p < 1) requestAnimationFrame(step);
  })(start);
}

// Highlights-Galerie: Punkte zeigen die aktuelle Karte
const gallery = document.querySelector("[data-gallery]");
const dots = document.querySelector("[data-dots]");
if (gallery && dots) {
  const cards = [...gallery.children];
  cards.forEach((card, i) => {
    const b = document.createElement("button");
    b.setAttribute("aria-label", `Karte ${i + 1}`);
    b.addEventListener("click", () => gallery.scrollTo({ left: card.offsetLeft - cards[0].offsetLeft, behavior: "smooth" }));
    dots.appendChild(b);
  });
  const update = () => {
    const max = gallery.scrollWidth - gallery.clientWidth;
    const i = max > 0 ? Math.round((gallery.scrollLeft / max) * (cards.length - 1)) : 0;
    [...dots.children].forEach((d, j) => d.classList.toggle("active", j === i));
  };
  gallery.addEventListener("scroll", update, { passive: true });
  update();
}

// Kurze Hinweis-Meldung
const toast = document.getElementById("toast");
function showToast(text) {
  toast.textContent = text;
  toast.classList.add("show");
  clearTimeout(showToast.t);
  showToast.t = setTimeout(() => toast.classList.remove("show"), 2200);
}

// Teilen: öffnet das System-Teilen-Menü (AirDrop, Nachrichten, Zum Home-Bildschirm …)
const shareData = {
  title: "DanEdit",
  text: "Videos, 3D-Druck und Smart Home aus München.",
  url: "https://danedit.github.io/",
};
document.querySelectorAll("[data-share]").forEach((btn) => btn.addEventListener("click", async () => {
  if (navigator.share) {
    try { await navigator.share(shareData); } catch (_) { /* abgebrochen */ }
    return;
  }
  try {
    await navigator.clipboard.writeText(shareData.url);
    showToast("Link kopiert");
  } catch (_) {
    showToast(shareData.url);
  }
}));

// QR-Code (Bibliothek wird erst beim ersten Öffnen geladen)
const sheet = document.getElementById("qr-sheet");
const qrBox = document.getElementById("qr");
function renderQr() {
  const qr = qrcode(0, "M");
  qr.addData(shareData.url);
  qr.make();
  qrBox.innerHTML = qr.createSvgTag({ cellSize: 6, margin: 0 });
}
document.getElementById("qr-open").addEventListener("click", () => {
  sheet.hidden = false;
  if (qrBox.firstChild) return;
  if (window.qrcode) return renderQr();
  const s = document.createElement("script");
  s.src = "https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js";
  s.onload = renderQr;
  s.onerror = () => { sheet.hidden = true; showToast("QR-Code konnte nicht geladen werden"); };
  document.head.appendChild(s);
});
document.getElementById("qr-close").addEventListener("click", () => (sheet.hidden = true));
sheet.addEventListener("click", (e) => { if (e.target === sheet) sheet.hidden = true; });
