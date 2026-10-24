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

// Animations-Varianten automatisch vergeben
document.querySelectorAll(".page-head .section-title, .page-head .tagline, .page-head .section-sub").forEach((el) => el.classList.add("reveal"));
document.querySelectorAll(".section-title").forEach((el) => el.classList.add("reveal", "zoom"));
document.querySelectorAll(".grid > .reveal, .socials > .reveal").forEach((el) => el.classList.add("flip"));
document.querySelectorAll(".about > .reveal").forEach((el, i) => el.classList.add(i ? "from-right" : "from-left"));
document.querySelectorAll(".timeline > .reveal").forEach((el, i) => el.classList.add(i % 2 ? "from-right" : "from-left"));

// Gestaffelte Verzögerung für Gruppen
document.querySelectorAll(".grid, .socials, .stats, .timeline, .page-head .container").forEach((group) => {
  [...group.children].filter((c) => c.classList.contains("reveal")).forEach((el, i) => el.style.setProperty("--d", `${(i % 6) * 120}ms`));
});

// Scroll-Reveal + Skill-Balken + Zähler
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    el.classList.add("visible");
    el.querySelectorAll(".bar span").forEach((bar) => (bar.style.width = bar.dataset.value + "%"));
    el.querySelectorAll(".stat-num").forEach(countUp);
    // Nach der Animation aufräumen, damit Hover-Effekte wieder schnell reagieren
    el.addEventListener("transitionend", function done(e) {
      if (e.target !== el || e.propertyName !== "transform") return;
      el.classList.remove("reveal", "from-left", "from-right", "zoom", "flip");
      el.style.removeProperty("--d");
      el.removeEventListener("transitionend", done);
    });
    observer.unobserve(el);
  });
}, { threshold: 0.15, rootMargin: "0px 0px -60px 0px" });
document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

// Scroll-Fortschrittsbalken + Parallax im Hero
const progress = document.createElement("div");
progress.id = "progress";
document.body.prepend(progress);
const heroInner = document.querySelector(".hero .container");
let ticking = false;
addEventListener("scroll", () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    const y = scrollY;
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    if (heroInner && y < innerHeight) {
      heroInner.style.transform = `translateY(${y * 0.4}px) scale(${1 - y / 3000})`;
      heroInner.style.opacity = Math.max(0, 1 - y / 600);
    }
    ticking = false;
  });
}, { passive: true });

// Sanfte Seitenübergänge zwischen den Unterseiten
document.querySelectorAll('a[href$=".html"]').forEach((a) => {
  a.addEventListener("click", (e) => {
    if (e.ctrlKey || e.metaKey || e.shiftKey || a.target === "_blank") return;
    e.preventDefault();
    document.body.classList.add("leaving");
    setTimeout(() => (location.href = a.href), 280);
  });
});
addEventListener("pageshow", () => document.body.classList.remove("leaving"));

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
