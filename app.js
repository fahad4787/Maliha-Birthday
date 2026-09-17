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
  const ctx = spark.getContext("2d");
  const romanceLayer = document.getElementById("romance-layer");

  let index = 0;
  let transitioning = false;
  let blown = false;
  const nodes = [];

  const ROMANCE_ICONS = ["♥", "💋", "❀", "✿", "🌹", "♡", "💋", "♥"];

  /* ---------- sparkles (lightweight) ---------- */
  let W = 0;
  let H = 0;
  const dots = [];

  function resizeSpark() {
    W = spark.width = window.innerWidth * devicePixelRatio;
    H = spark.height = window.innerHeight * devicePixelRatio;
    spark.style.width = "100%";
    spark.style.height = "100%";
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  }

  function seedDots() {
    dots.length = 0;
    const n = Math.min(48, Math.floor(window.innerWidth / 18));
    for (let i = 0; i < n; i++) {
      dots.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        r: 0.6 + Math.random() * 1.8,
        a: 0.18 + Math.random() * 0.5,
        vy: 0.12 + Math.random() * 0.4,
        vx: -0.18 + Math.random() * 0.36,
        rose: Math.random() > 0.55,
      });
    }
  }

  function tickSpark() {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    for (const d of dots) {
      d.x += d.vx;
      d.y += d.vy;
      if (d.y > window.innerHeight) {
        d.y = -4;
        d.x = Math.random() * window.innerWidth;
      }
      ctx.beginPath();
      ctx.fillStyle = d.rose
        ? `rgba(255, 93, 143, ${d.a})`
        : `rgba(240, 196, 138, ${d.a})`;
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fill();
    }
    requestAnimationFrame(tickSpark);
  }

  function burst(x = window.innerWidth / 2, y = window.innerHeight / 2) {
    for (let i = 0; i < 36; i++) {
      dots.push({
        x,
        y,
        r: 1 + Math.random() * 2.4,
        a: 0.55 + Math.random() * 0.4,
        vy: -1.6 - Math.random() * 2.4,
        vx: -2.4 + Math.random() * 4.8,
        rose: Math.random() > 0.35,
      });
    }
  }

  /* ---------- romance FX (kisses / hearts / flowers) ---------- */
  function spawnPop(kind, x, y, icon) {
    const el = document.createElement("div");
    el.className = kind;
    el.textContent = icon;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    if (kind === "petal-pop") {
      el.style.setProperty("--dx", `${-50 + Math.random() * 100}px`);
    }
    document.body.appendChild(el);
    setTimeout(() => el.remove(), kind === "petal-pop" ? 1500 : 1100);
  }

  function kissRain(count = 8) {
    for (let i = 0; i < count; i++) {
      const x = 24 + Math.random() * (window.innerWidth - 48);
      const y = 80 + Math.random() * (window.innerHeight * 0.55);
      const pick = Math.random();
      setTimeout(() => {
        if (pick < 0.45) spawnPop("kiss-pop", x, y, "💋");
        else if (pick < 0.8) spawnPop("heart-pop", x, y, "♥");
        else spawnPop("petal-pop", x, y, Math.random() > 0.5 ? "❀" : "🌹");
      }, i * 70);
    }
  }

  function floatRomanceLoop() {
    if (!romanceLayer) return;
    const icon = ROMANCE_ICONS[Math.floor(Math.random() * ROMANCE_ICONS.length)];
    const el = document.createElement("span");
    el.className = "float-romance";
    el.textContent = icon;
    el.style.left = `${Math.random() * 92}%`;
    el.style.bottom = "-8%";
    el.style.fontSize = `${0.9 + Math.random() * 1.1}rem`;
    el.style.setProperty("--drift-x", `${-40 + Math.random() * 80}px`);
    el.style.setProperty("--spin", `${120 + Math.random() * 220}deg`);
    el.style.animationDuration = `${5.5 + Math.random() * 4}s`;
    romanceLayer.appendChild(el);
    setTimeout(() => el.remove(), 10000);
  }

  setInterval(floatRomanceLoop, 900);
  for (let i = 0; i < 5; i++) setTimeout(floatRomanceLoop, i * 280);

  window.addEventListener("resize", () => {
    resizeSpark();
    seedDots();
  });

  /* ---------- preload helpers ---------- */
  function preload(src) {
    return new Promise((resolve) => {
      if (!src) return resolve();
      const img = new Image();
      img.onload = img.onerror = () => resolve();
      img.src = src;
    });
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
    preload(SCENES[i + 1]?.image);
    preload(SCENES[i + 2]?.image);
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
        <img src="${img}" alt="" />
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
        <img src="${scene.image}" alt="Birthday cake" width="280" height="280" />
      </div>
      <div class="scene-copy">
        <p class="scene-kicker">${scene.kicker}</p>
        <h3 class="scene-title">${scene.title}</h3>
        <p class="scene-text">${scene.text || ""}</p>
        <button type="button" class="pulse-btn hold-btn" id="blow-btn">Hold to blow candles</button>
        <p class="cake-note" id="cake-note" hidden>Wish locked in. Your letter awaits…</p>
      </div>`;
  }

  function photoHTML(scene) {
    return `
      <div class="scene-media">
        <img src="${scene.image}" alt="" loading="eager" decoding="async" />
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
        el.innerHTML = photoHTML(scene);
      }
      deck.appendChild(el);
      nodes.push(el);
    });
    stepTotal.textContent = String(SCENES.length);
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
    const curr = nodes[index];
    const upcoming = nodes[next];
    if (!upcoming) {
      transitioning = false;
      return;
    }

    const img = upcoming.querySelector("img");
    if (img && !img.complete) {
      try {
        await img.decode();
      } catch (_) {}
    }

    if (curr && curr !== upcoming) {
      curr.classList.remove("is-active");
      curr.classList.add(dir > 0 ? "is-exit-left" : "is-exit-right");
      setTimeout(() => curr.classList.remove("is-exit-left", "is-exit-right"), 650);
    }

    upcoming.classList.remove("is-exit-left", "is-exit-right");
    void upcoming.offsetWidth;
    upcoming.classList.add("is-active");
    index = next;
    updateUI();
    kissRain(SCENES[next]?.type === "ending" || SCENES[next]?.id === "the-end" ? 18 : SCENES[next]?.tone === "intimate" ? 12 : 7);
    burst(window.innerWidth * 0.5, window.innerHeight * 0.35);
    setTimeout(() => {
      transitioning = false;
    }, 480);
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
        kissRain(5);
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

  // Double-click hearts on desktop too
  deck.addEventListener("dblclick", (e) => {
    heartPop(e.clientX, e.clientY);
    kissRain(5);
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
    kissRain(14);
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
    updateUI();
    burst();
    kissRain(10);
    SCENES.forEach((s) => preload(s.image));
  });

  buildDeck();
  resizeSpark();
  seedDots();
  tickSpark();
  warmBoot();
  kissRain(6);
})();
