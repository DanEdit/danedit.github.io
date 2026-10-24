// ==========================================================
// DANEDIT – Linksammlung
// ==========================================================

// Profilbild: neuestes Bild aus dem Ordner "profilbild" im Repo verwenden,
// sonst bleibt das im HTML eingetragene Bild stehen
const avatar = document.querySelector(".avatar img[data-folder]");
if (avatar) {
  const api = "https://api.github.com/repos/DanEdit/danedit.github.io";
  const dir = avatar.dataset.folder;
  fetch(`${api}/contents/${dir}`)
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

// Scroll-Animationen
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add("visible");
    observer.unobserve(entry.target);
  });
}, { threshold: 0.2 });
document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

// Link-Kacheln kippen leicht mit dem Mauszeiger
document.querySelectorAll(".link").forEach((link) => {
  link.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    const r = link.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    link.style.transform = `perspective(600px) rotateX(${-y * 6}deg) rotateY(${x * 6}deg) translateY(-3px)`;
  });
  link.addEventListener("pointerleave", () => (link.style.transform = ""));
});

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
document.getElementById("share").addEventListener("click", async () => {
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
});

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
