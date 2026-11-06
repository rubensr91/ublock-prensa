// ISOLATED world: oculta/elimina los modales del muro y libera el scroll.
// Config propia: Chrome deduplica un mismo fichero entre content scripts de
// mundos distintos, así que este script no puede depender de sites.js.
(() => {
  "use strict";

  const HOSTS = {
    elpais: ["elpais.com"],
    elmundo: ["elmundo.es"],
    elconfidencial: ["elconfidencial.com"],
    abc: ["abc.es"],
    lavanguardia: ["lavanguardia.com"]
  };

  const SELECTORS = {
    elpais: [
      "[pmwall-layer=true]",
      ".pmConsentWall",
      "#pmConsentWall",
      "[class*=paywall]",
      "[id*=paywall]"
    ],
    elmundo: [
      ".tp-modal",
      ".tp-backdrop",
      ".tp-container",
      ".tp-popup",
      ".tp-sticky",
      ".tp-generic",
      ".ue-cintillo-premium",
      ".ue-c-main-header__subscription--fixed",
      "[class*=paywall]"
    ],
    elconfidencial: [
      ".EC_payWall",
      ".premiumBar",
      ".tp-modal",
      ".tp-backdrop",
      ".tp-container",
      ".tp-popup",
      ".tp-sticky",
      ".tp-generic",
      "[class*=premiumBar]",
      "[class*=cintillo]",
      "[class*=paywall]"
    ],
    abc: [
      "[class*=evolok]",
      "[id*=evolok]",
      "#dissuasion",
      ".dissuasion",
      "[class*=dissuasion]",
      "[class*=paywall]",
      "dialog.ob-em-modal"
    ],
    lavanguardia: [
      "[class*=evolok]",
      "[id*=evolok]",
      "#dissuasion",
      ".dissuasion",
      "[class*=dissuasion]",
      "[class*=paywall]",
      ".lv-audio-subscribe"
    ]
  };

  const host = location.hostname;
  const id = Object.keys(HOSTS).find((key) =>
    HOSTS[key].some((h) => host === h || host.endsWith("." + h))
  );
  if (!id) return;

  const EXTRA_SELECTORS = [
    ".tp-modal",
    ".tp-backdrop",
    ".tp-container",
    ".tp-popup",
    ".tp-sticky",
    ".tp-generic",
    ".mc_bg",
    ".pw-overlay",
    "#paywall",
    "[data-paywall]",
    ".subs-modal",
    "[class*=regwall]",
    "[class*=reg-wall]"
  ];
  const selectors = [...new Set([...(SELECTORS[id] || []), ...EXTRA_SELECTORS])];

  const STYLE_ID = "ulock-style";

  const injectStyle = () => {
    if (document.getElementById(STYLE_ID)) return;
    const root = document.head || document.documentElement;
    if (!root) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
${selectors.join(",\n")} { display: none !important; visibility: hidden !important; pointer-events: none !important; }
.innerArticle__body [hidden], .innerArticle__body .news-body-complete { display: block !important; height: auto !important; overflow: visible !important; visibility: visible !important; }
[style*="blur"], [style*="grayscale"], [style*="filter:blur"] { filter: none !important; }
html, body { overflow: auto !important; }
body.tpl-modal, body.didomi-popup-open { overflow: auto !important; }
`;
    root.appendChild(style);
  };

  const clean = () => {
    const article = document.querySelector("article");
    for (const selector of selectors) {
      let nodes;
      try { nodes = document.querySelectorAll(selector); } catch { continue; }
      for (const node of nodes) {
        if (article && node.contains(article)) continue;
        node.remove();
      }
    }
    // El Confidencial esconde el tramo final del artículo en un contenedor
    // con `hidden`; lo devolvemos a la vista.
    if (id === "elconfidencial") {
      const body = document.querySelector(".innerArticle__body");
      if (body) {
        for (const node of body.querySelectorAll("[hidden], .news-body-complete")) {
          node.removeAttribute("hidden");
          node.hidden = false;
          node.style.display = "block";
          node.style.height = "auto";
          node.style.overflow = "visible";
        }
      }
      if (document.body) document.body.classList.remove("bodyBlocked");
    }
    for (const node of document.querySelectorAll("[style]")) {
      const filter = node.style.filter || "";
      if (filter.includes("blur") || filter.includes("grayscale")) node.style.filter = "none";
    }
    if (document.body) {
      document.body.classList.remove("tpl-modal");
      document.body.style.removeProperty("overflow");
    }
    document.documentElement.style.removeProperty("overflow");
  };

  let scheduled = false;
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      clean();
    });
  };

  const start = () => {
    document.documentElement.dataset.ulock = id;
    injectStyle();
    clean();
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", clean, { once: true });
    }
    try {
      new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true });
    } catch {}
    let ticks = 0;
    const timer = setInterval(() => {
      clean();
      if (++ticks >= 15) clearInterval(timer);
    }, 1000);
  };

  chrome.storage.sync.get("settings").then(({ settings }) => {
    const data = settings || {};
    const enabled = data.enabled !== false;
    const siteEnabled = !data.sites || data.sites[id] !== false;
    if (!enabled || !siteEnabled) return;
    if (document.documentElement) start();
    else document.addEventListener("DOMContentLoaded", start, { once: true });
  });
})();