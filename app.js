(() => {
  const PASS = (window.BIRTHDAY?.password || "roham").toLowerCase();
  const SCENES = window.BIRTHDAY?.scenes || [];

  const boot = document.getElementById("boot");
  const lock = document.getElementById("lock");
  const intro = document.getElementById("intro");
  const story = document.getElementById("story");
  const deck = document.getElementById("deck");
  const form = document.getElementById("unlock-form");
  const input = document.getElementById("password");
  const err = document.getElementById("lock-error");
  const startBtn = document.getElementById("start-story");
  const prevBtn = document.getElementById("prev-btn");
  const nextBtn = document.getElementById("next-btn");
  const barFill = document.getElementById("bar-fill");
  const stepNow = document.getElementById("step-now");
  const stepTotal = document.getElementById("step-total");
  const spark = document.getElementById("spark");
  const ctx = spark.getContext("2d", { alpha: true, desynchronized: true });
  const romanceLayer = document.getElementById("romance-layer");

  let index = 0;
  let transitioning = false;
  let blown = false;
  let pageVisible = !document.hidden;
  let sparkRaf = 0;
  const nodes = [];
  const preloaded = new Set();

  const ROMANCE_ICONS = ["♥", "💋", "❀", "✿", "🌹", "♡", "💋", "♥"];
  const MAX_DOTS = 56;
  const MAX_FLOAT = 8;
  const DPR = Math.min(window.devicePixelRatio || 1, 1.75);

  /* ---------- sparkles (capped + paused when hidden) ---------- */
  const dots = [];

  function resizeSpark() {
    spark.width = Math.floor(window.innerWidth * DPR);
    spark.height = Math.floor(window.innerHeight * DPR);
    spark.style.width = "100%";
    spark.style.height = "100%";
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  function seedDots() {
    dots.length = 0;
    const n = Math.min(28, Math.max(14, Math.floor(window.innerWidth / 28)));
    for (let i = 0; i < n; i++) {
      dots.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        r: 0.6 + Math.random() * 1.6,
        a: 0.18 + Math.random() * 0.45,
        vy: 0.12 + Math.random() * 0.35,
        vx: -0.15 + Math.random() * 0.3,
        rose: Math.random() > 0.55,
      });
    }
  }

  function pruneDots() {
    if (dots.length > MAX_DOTS) dots.splice(0, dots.length - MAX_DOTS);
  }

  function tickSpark() {
    if (!pageVisible) {
      sparkRaf = 0;
      return;
    }
    const w = window.innerWidth;
    const h = window.innerHeight;
    ctx.clearRect(0, 0, w, h);

    let rose = null;
    for (let i = 0; i < dots.length; i++) {
      const d = dots[i];
      d.x += d.vx;
      d.y += d.vy;
      if (d.y > h) {
        d.y = -4;
        d.x = Math.random() * w;
        d.a *= 0.92;
      }
      if (d.a < 0.08 && i > 20) {
        dots.splice(i, 1);
        i--;
        continue;
      }
      if (rose !== d.rose) {
        rose = d.rose;
        ctx.fillStyle = rose
          ? "rgba(255, 93, 143, 0.55)"
          : "rgba(240, 196, 138, 0.5)";
      }
      ctx.globalAlpha = d.a;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    sparkRaf = requestAnimationFrame(tickSpark);
  }

  function startSpark() {
    if (!sparkRaf && pageVisible) sparkRaf = requestAnimationFrame(tickSpark);
  }

  function burst(x = window.innerWidth / 2, y = window.innerHeight / 2) {
    const n = pageVisible ? 18 : 8;
    for (let i = 0; i < n; i++) {
      dots.push({
        x,
        y,
        r: 1 + Math.random() * 2.2,
        a: 0.55 + Math.random() * 0.35,
        vy: -1.4 - Math.random() * 2.1,
        vx: -2.2 + Math.random() * 4.4,
        rose: Math.random() > 0.35,
      });
    }
    pruneDots();
  }

  /* ---------- romance FX (pooled / capped) ---------- */
  const popPool = [];

  function spawnPop(kind, x, y, icon) {
    if (!pageVisible) return;
    let el = popPool.pop();
    if (!el) {
      el = document.createElement("div");
    }
    el.className = kind;
    el.textContent = icon;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    if (kind === "petal-pop") {
      el.style.setProperty("--dx", `${-50 + Math.random() * 100}px`);
    }
    document.body.appendChild(el);
    const life = kind === "petal-pop" ? 1400 : 1000;
    setTimeout(() => {
      el.remove();
      el.className = "";
      if (popPool.length < 24) popPool.push(el);
    }, life);
  }

  function kissRain(count = 8) {
    const n = Math.min(count, 12);
    for (let i = 0; i < n; i++) {
      const x = 24 + Math.random() * (window.innerWidth - 48);
      const y = 80 + Math.random() * (window.innerHeight * 0.55);
      const pick = Math.random();
      setTimeout(() => {
        if (!pageVisible) return;
        if (pick < 0.45) spawnPop("kiss-pop", x, y, "💋");
        else if (pick < 0.8) spawnPop("heart-pop", x, y, "♥");
        else spawnPop("petal-pop", x, y, Math.random() > 0.5 ? "❀" : "🌹");
      }, i * 55);
    }
  }

  function floatRomanceLoop() {
    if (!romanceLayer || !pageVisible) return;
    while (romanceLayer.childElementCount >= MAX_FLOAT) {
      romanceLayer.firstElementChild?.remove();
    }
    const icon = ROMANCE_ICONS[(Math.random() * ROMANCE_ICONS.length) | 0];
    const el = document.createElement("span");
    el.className = "float-romance";
    el.textContent = icon;
    el.style.left = `${Math.random() * 92}%`;
    el.style.bottom = "-8%";
    el.style.fontSize = `${0.9 + Math.random() * 1.05}rem`;
    el.style.setProperty("--drift-x", `${-40 + Math.random() * 80}px`);
    el.style.setProperty("--spin", `${120 + Math.random() * 220}deg`);
    el.style.animationDuration = `${6 + Math.random() * 3.5}s`;
    romanceLayer.appendChild(el);
    setTimeout(() => el.remove(), 9500);
  }

  const floatTimer = setInterval(floatRomanceLoop, 1400);
  for (let i = 0; i < 3; i++) setTimeout(floatRomanceLoop, i * 400);

  let resizeTimer = 0;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      resizeSpark();
      seedDots();
    }, 150);
  });

  document.addEventListener("visibilitychange", () => {
    pageVisible = !document.hidden;
    if (pageVisible) startSpark();
    else if (sparkRaf) {
      cancelAnimationFrame(sparkRaf);
      sparkRaf = 0;
    }
  });

  /* ---------- preload helpers ---------- */
  function preload(src) {
    return new Promise((resolve) => {
      if (!src || preloaded.has(src)) return resolve();
      preloaded.add(src);
      const img = new Image();
      img.decoding = "async";
      img.onload = img.onerror = () => resolve();
      img.src = src;
    });
  }

  function hydrateImages(center) {
    const from = Math.max(0, center - 1);
    const to = Math.min(nodes.length - 1, center + 2);
    for (let i = from; i <= to; i++) {
      const img = nodes[i]?.querySelector("img[data-src]");
      if (!img) continue;
      const src = img.getAttribute("data-src");
      if (!src || img.src.includes(src)) continue;
      img.src = src;
      img.removeAttribute("data-src");
      preloaded.add(src);
    }
  }

  async function warmBoot() {
    const first = [
      "images/opt/favorite.webp",
      SCENES[0]?.image,
      SCENES[1]?.image,
    ].filter(Boolean);
    await Promise.all(first.map(preload));
    boot.classList.add("is-done");
    input?.focus({ preventScroll: true });
  }

  function preloadAround(i) {
    hydrateImages(i);
    preload(SCENES[i + 1]?.image);
    preload(SCENES[i + 2]?.image);
    preload(SCENES[i + 3]?.image);
  }

  /* ---------- build scenes ---------- */
  function letterHTML() {
    return `
      <div class="letter-inner">
        <p class="scene-kicker" style="opacity:1;transform:none">Final letter</p>
        <h3 class="scene-title">To my Maliha Fahad</h3>
        <div class="letter-block">
          <p>Jaan. Mera Bacha. Meri stubborn storm.</p>
          <p>From that first rishta photo to these years together, ap ne meri life badal di. Hum ladte hain, jagrte hain, phir bhi end mein meri har raat ap pe hi rukti hai. Soft side bhi ap, dirty side bhi ap, ghar bhi ap.</p>
          <p>Woh pehli nazar, woh pehli raat jab ghar koi nahi tha, shadi ke shuru ke din jab apki neck kabhi saaf nahi hoti thi, subah ki chai naan chany, bike rides, saman lene jana, Roham, hasi, drama, masti. Yeh sab humara journey hai. Yeh sab ap hain.</p>
          <p>Aaj birthday pe main cheezen nahi de raha. Main yeh sach de raha hoon: fighting ne humein cancel nahi kiya. Distance ne humein delete nahi kiya. Ap Maliha Fahad hain. Meri wife. Meri hunger. Meri peace. Meri forever.</p>
          <p class="signoff">Happy Birthday, Jaan.<br/>Apka hamesha,<br/>Fahad</p>
        </div>
        <p class="letter-swipe">Swipe once more…</p>
      </div>`;
  }

  function endingHTML(scene) {
    const img = scene.image || "images/opt/favorite.webp";
    const line = scene.text || "Meri naughty wife. Meri lingerie wali Jaan. Meri hunger. Meri forever.";
    return `
      <div class="ending-media">
        <img data-src="${img}" alt="" decoding="async" />
      </div>
      <div class="ending-veil" aria-hidden="true"></div>
      <div class="ending-float" aria-hidden="true">
        <span>💋</span><span>♥</span><span>💋</span><span>♥</span><span>💋</span><span>❀</span>
      </div>
      <div class="ending-inner">
        <p class="ending-kicker">Only for my wife</p>
        <p class="ending-naughty">${line}</p>
        <h3 class="ending-love">I love you</h3>
        <p class="ending-name">Maliha Fahad</p>
        <p class="ending-fin">The End</p>
        <p class="ending-soft">Ab so jao Jaan… ya phir mere paas aa jao.</p>
      </div>`;
  }

  function cakeHTML(scene) {
    return `
      <div class="cake-wrap">
        <div class="flames" id="flames">
          <span class="flame"></span><span class="flame"></span><span class="flame"></span>
        </div>
        <img data-src="${scene.image}" alt="Birthday cake" width="280" height="280" decoding="async" />
      </div>
      <div class="scene-copy">
        <p class="scene-kicker">${scene.kicker}</p>
        <h3 class="scene-title">${scene.title}</h3>
        <p class="scene-text">${scene.text || ""}</p>
        <button type="button" class="pulse-btn hold-btn" id="blow-btn">Hold to blow candles</button>
        <p class="cake-note" id="cake-note" hidden>Wish locked in. Your letter awaits…</p>
      </div>`;
  }

  function photoHTML(scene, eager) {
    const srcAttr = eager
      ? `src="${scene.image}"`
      : `data-src="${scene.image}"`;
    return `
      <div class="scene-media">
        <img ${srcAttr} alt="" decoding="async" ${eager ? 'loading="eager"' : 'loading="lazy"'} />
      </div>
      <div class="scene-copy">
        <p class="scene-kicker">${scene.kicker || ""}</p>
        <h3 class="scene-title">${scene.title || ""} <span class="title-kiss" aria-hidden="true">💋</span></h3>
        <p class="scene-text">${scene.text || ""}</p>
      </div>`;
  }

  function buildDeck() {
    deck.innerHTML = "";
    nodes.length = 0;
    SCENES.forEach((scene, i) => {
      const el = document.createElement("article");
      el.className = "scene";
      el.dataset.tone = scene.tone || "soft";
      el.dataset.index = String(i);
      if (scene.type === "letter") {
        el.classList.add("letter-scene");
        el.innerHTML = letterHTML();
      } else if (scene.type === "ending" || scene.id === "the-end") {
        el.classList.add("ending-scene");
        el.innerHTML = endingHTML(scene);
      } else if (scene.type === "cake") {
        el.innerHTML = cakeHTML(scene);
      } else {
        el.innerHTML = photoHTML(scene, i < 2);
      }
      deck.appendChild(el);
      nodes.push(el);
    });
    stepTotal.textContent = String(SCENES.length);
    hydrateImages(0);
    wireCake();
  }

  function wireCake() {
    const btn = document.getElementById("blow-btn");
    const flames = document.getElementById("flames");
    const note = document.getElementById("cake-note");
    if (!btn) return;
    let timer = null;
    const start = () => {
      if (blown) return;
      timer = setTimeout(() => {
        blown = true;
        flames?.classList.add("is-out");
        if (note) note.hidden = false;
        burst();
        try {
          navigator.vibrate?.(30);
        } catch (_) {}
        setTimeout(() => goTo(index + 1, 1), 900);
      }, 900);
    };
    const cancel = () => clearTimeout(timer);
    btn.addEventListener("touchstart", start, { passive: true });
    btn.addEventListener("touchend", cancel);
    btn.addEventListener("mousedown", start);
    btn.addEventListener("mouseup", cancel);
    btn.addEventListener("mouseleave", cancel);
  }

  function updateUI() {
    barFill.style.width = `${((index + 1) / SCENES.length) * 100}%`;
    stepNow.textContent = String(index + 1);
    prevBtn.disabled = index === 0;
    nextBtn.disabled = index >= SCENES.length - 1;
    preloadAround(index);
  }

  async function showScene(next, dir = 1) {
    if (transitioning) return;
    transitioning = true;
    try {
      hydrateImages(next);
      const curr = nodes[index];
      const upcoming = nodes[next];
      if (!upcoming) return;

      const img = upcoming.querySelector("img");
      if (img?.dataset.src) {
        img.src = img.dataset.src;
        img.removeAttribute("data-src");
      }
      if (img && !img.complete) {
        try {
          await Promise.race([
            img.decode(),
            new Promise((resolve) => setTimeout(resolve, 350)),
          ]);
        } catch (_) {}
      }

      if (curr && curr !== upcoming) {
        curr.classList.remove("is-active");
        curr.classList.add(dir > 0 ? "is-exit-left" : "is-exit-right");
        setTimeout(() => curr.classList.remove("is-exit-left", "is-exit-right"), 650);
      }

      // Force text reveal restart every slide
      upcoming.querySelectorAll(".scene-kicker, .scene-title, .scene-text").forEach((el) => {
        el.style.transition = "none";
        el.style.opacity = "0";
        el.style.transform = "translateY(14px)";
      });

      upcoming.classList.remove("is-exit-left", "is-exit-right");
      void upcoming.offsetWidth;

      upcoming.querySelectorAll(".scene-kicker, .scene-title, .scene-text").forEach((el) => {
        el.style.transition = "";
        el.style.opacity = "";
        el.style.transform = "";
      });

      upcoming.classList.add("is-active");
      index = next;
      updateUI();

      const isEnd = SCENES[next]?.type === "ending" || SCENES[next]?.id === "the-end";
      const isIntimate = SCENES[next]?.tone === "intimate";
      kissRain(isEnd ? 12 : isIntimate ? 8 : 5);
      burst(window.innerWidth * 0.5, window.innerHeight * 0.35);
    } finally {
      setTimeout(() => {
        transitioning = false;
      }, 320);
    }
  }

  function goTo(next, dir = 1) {
    if (next < 0 || next >= SCENES.length || next === index) return;
    showScene(next, dir);
  }

  /* ---------- swipe + tap zones ---------- */
  let startX = 0;
  let startY = 0;
  let tracking = false;
  let lastTap = 0;

  function heartPop(x, y) {
    spawnPop("heart-pop", x, y, "♥");
    spawnPop("kiss-pop", x + 18, y - 10, "💋");
    spawnPop("petal-pop", x - 22, y + 8, "❀");
    burst(x, y);
    try {
      navigator.vibrate?.(12);
    } catch (_) {}
  }

  deck.addEventListener(
    "touchstart",
    (e) => {
      const t = e.changedTouches[0];
      startX = t.clientX;
      startY = t.clientY;
      tracking = true;
    },
    { passive: true }
  );

  deck.addEventListener(
    "touchend",
    (e) => {
      if (!tracking) return;
      tracking = false;
      const t = e.changedTouches[0];
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;

      const now = Date.now();
      if (now - lastTap < 280 && Math.abs(dx) < 12 && Math.abs(dy) < 12) {
        heartPop(t.clientX, t.clientY);
        kissRain(4);
        lastTap = 0;
        return;
      }
      lastTap = now;

      if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy)) {
        if (dx < 0) goTo(index + 1, 1);
        else goTo(index - 1, -1);
        return;
      }

      const target = e.target;
      if (target.closest("button, a, input, .letter-inner")) return;
      if (Math.abs(dx) < 18 && Math.abs(dy) < 18) {
        if (t.clientX < window.innerWidth * 0.28) goTo(index - 1, -1);
        else if (t.clientX > window.innerWidth * 0.72) goTo(index + 1, 1);
      }
    },
    { passive: true }
  );

  deck.addEventListener("dblclick", (e) => {
    heartPop(e.clientX, e.clientY);
    kissRain(4);
  });

  prevBtn.addEventListener("click", () => goTo(index - 1, -1));
  nextBtn.addEventListener("click", () => goTo(index + 1, 1));

  document.addEventListener("keydown", (e) => {
    if (story.hidden) return;
    if (e.key === "ArrowRight") goTo(index + 1, 1);
    if (e.key === "ArrowLeft") goTo(index - 1, -1);
  });

  /* ---------- flow ---------- */
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const val = (input.value || "").trim().toLowerCase();
    if (val !== PASS) {
      err.hidden = false;
      lock.classList.add("is-shake");
      setTimeout(() => lock.classList.remove("is-shake"), 420);
      input.value = "";
      input.focus();
      return;
    }
    err.hidden = true;
    lock.classList.remove("is-on");
    intro.classList.add("is-on");
    document.body.classList.remove("is-locked");
    burst(window.innerWidth / 2, window.innerHeight * 0.35);
    kissRain(10);
    try {
      navigator.vibrate?.(18);
    } catch (_) {}
  });

  startBtn.addEventListener("click", () => {
    intro.classList.remove("is-on");
    story.hidden = false;
    story.classList.add("is-on");
    document.body.classList.add("is-story");
    index = 0;
    nodes.forEach((n) => n.classList.remove("is-active"));
    nodes[0]?.classList.add("is-active");
    hydrateImages(0);
    updateUI();
    burst();
    kissRain(8);
    // Warm next few only (not the whole gallery at once)
    [0, 1, 2, 3].forEach((i) => preload(SCENES[i]?.image));
  });

  buildDeck();
  resizeSpark();
  seedDots();
  startSpark();
  warmBoot();
  kissRain(4);

  // Keep interval handle referenced so linters don't strip intent
  void floatTimer;
})();
