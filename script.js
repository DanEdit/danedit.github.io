// ==========================================================
// DANEDIT – Interaktionen
// ==========================================================

// Mobile-Menü
const burger = document.querySelector(".burger");
const navLinks = document.querySelector(".nav-links");
if (burger) {
  burger.addEventListener("click", () => navLinks.classList.toggle("open"));
}

// Aktiven Menüpunkt markieren
const current = location.pathname.split("/").pop() || "index.html";
document.querySelectorAll(".nav-links a").forEach((a) => {
  if (a.getAttribute("href") === current) a.classList.add("active");
});

// Schreibmaschinen-Effekt (Texte in data-words, getrennt mit |)
const typed = document.querySelector(".typed");
if (typed) {
  const words = typed.dataset.words.split("|");
  let w = 0, c = 0, deleting = false;
  (function tick() {
    const word = words[w];
    typed.textContent = word.slice(0, c);
    if (!deleting && c < word.length) c++;
    else if (deleting && c > 0) c--;
    else if (!deleting) { deleting = true; return setTimeout(tick, 1600); }
    else { deleting = false; w = (w + 1) % words.length; }
    setTimeout(tick, deleting ? 40 : 90);
  })();
}

// Scroll-Reveal + Skill-Balken + Zähler
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    el.classList.add("visible");
    el.querySelectorAll(".bar span").forEach((bar) => (bar.style.width = bar.dataset.value + "%"));
    el.querySelectorAll(".stat-num").forEach(countUp);
    observer.unobserve(el);
  });
}, { threshold: 0.15 });
document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

function countUp(el) {
  const target = parseInt(el.dataset.count, 10);
  const suffix = el.dataset.suffix || "";
  const start = performance.now();
  (function step(now) {
    const p = Math.min((now - start) / 1500, 1);
    el.textContent = Math.floor(target * p).toLocaleString("de-DE") + suffix;
    if (p < 1) requestAnimationFrame(step);
  })(start);
}

// YouTube-Videos: Vorschaubild laden, beim Klick abspielen
document.querySelectorAll(".thumb[data-video-id]").forEach((thumb) => {
  const id = thumb.dataset.videoId.trim();
  if (!id) return;
  const img = document.createElement("img");
  img.src = `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
  img.alt = "";
  img.loading = "lazy";
  thumb.prepend(img);
  thumb.style.cursor = "pointer";
  thumb.addEventListener("click", () => {
    thumb.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
  }, { once: true });
});

// Video-Filter
document.querySelectorAll(".filters button").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filters button").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    const f = btn.dataset.filter;
    document.querySelectorAll(".video-card").forEach((card) => {
      card.style.display = f === "all" || card.dataset.category === f ? "" : "none";
    });
  });
});

// Kontaktformular -> öffnet das E-Mail-Programm
const form = document.querySelector("form.terminal");
if (form) {
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const d = new FormData(form);
    const subject = encodeURIComponent(`Anfrage von ${d.get("name")}`);
    const body = encodeURIComponent(`${d.get("message")}\n\n— ${d.get("name")} (${d.get("email")})`);
    location.href = `mailto:${form.dataset.mail}?subject=${subject}&body=${body}`;
  });
}

// Neon-Partikel im Hintergrund
const canvas = document.getElementById("particles");
if (canvas && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const ctx = canvas.getContext("2d");
  let pts = [];
  const resize = () => {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
    pts = Array.from({ length: Math.min(70, Math.floor(innerWidth / 18)) }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
    }));
  };
  resize();
  addEventListener("resize", resize);
  (function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pts.forEach((p, i) => {
      p.x = (p.x + p.vx + canvas.width) % canvas.width;
      p.y = (p.y + p.vy + canvas.height) % canvas.height;
      ctx.fillStyle = i % 2 ? "#00f0ff" : "#ff2bd6";
      ctx.fillRect(p.x, p.y, 2, 2);
      for (let j = i + 1; j < pts.length; j++) {
        const q = pts[j];
        const d = Math.hypot(p.x - q.x, p.y - q.y);
        if (d < 120) {
          ctx.strokeStyle = `rgba(0,240,255,${(1 - d / 120) * 0.2})`;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.stroke();
        }
      }
    });
    requestAnimationFrame(draw);
  })();
}
