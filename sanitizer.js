// MAIN world, document_start: limpia contadores y neutraliza objetos de paywall
// antes de que el JS del periódico los lea.
(() => {
  "use strict";

  const SITES = globalThis.ULOCK_SITES;
  if (!SITES) return;

  const id = Object.keys(SITES).find((key) => {
    const hosts = SITES[key].hosts;
    const host = location.hostname;
    return hosts.some((h) => host === h || host.endsWith("." + h));
  });
  if (!id) return;
  const site = SITES[id];

  const KEY_RE =
    /(paywall|premium|psp_hist|telP|lastVisit|_pc_|voc_paywall|voc_pw|evolok|evl_|arcp|cX_|tp_|piano|meter|dissua)/i;
  const isPaywallKey = (key) => typeof key === "string" && (site.storage.includes(key) || KEY_RE.test(key));

  const wipe = (storage) => {
    try {
      const doomed = [];
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key && isPaywallKey(key)) doomed.push(key);
      }
      for (const key of doomed) storage.removeItem(key);
    } catch {}
  };

  try { wipe(localStorage); } catch {}
  try { wipe(sessionStorage); } catch {}

  const expireCookie = (name) => {
    const past = "max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    const host = location.hostname;
    const bare = host.replace(/^www\./, "");
    for (const domain of ["", `; domain=${host}`, `; domain=.${bare}`]) {
      try { document.cookie = `${name}=; path=/${domain}; ${past}`; } catch {}
    }
  };

  try {
    const names = document.cookie.split("; ").filter(Boolean).map((c) => c.split("=")[0]);
    for (const name of names) if (isPaywallKey(name)) expireCookie(name);
  } catch {}

  // Impide que el sitio vuelva a escribir sus claves de contador.
  try {
    const proto = Storage.prototype;
    const rawSet = proto.setItem;
    proto.setItem = function (key, value) {
      if (isPaywallKey(key)) return;
      return rawSet.call(this, key, value);
    };
  } catch {}

  // Impide reescribir las cookies de paywall que acabamos de borrar.
  try {
    const desc = Object.getOwnPropertyDescriptor(Document.prototype, "cookie");
    if (desc && desc.set && desc.get) {
      Object.defineProperty(document, "cookie", {
        configurable: true,
        get() {
          return desc.get.call(document);
        },
        set(value) {
          const name = String(value).split("=")[0].trim();
          if (isPaywallKey(name)) return;
          desc.set.call(document, value);
        }
      });
    }
  } catch {}

  // El País (Arc XP): paywallData.contentBlocked + ENP + ArcP.
  if (site.globals.includes("paywallData") || site.globals.includes("ENP")) {
    const neutralizeEnp = (enp) => {
      const info = enp && enp.paywallInfo;
      if (!info) return enp;
      info.isFreemiumArticle = false;
      info.isPremiumArticle = false;
      info.isExcludedPaywall = true;
      return enp;
    };
    const neutralizePaywall = (data) => {
      if (!data) return data;
      try {
        data.contentBlocked = false;
        data.paywallCounter = 0;
        data.isPremium = false;
        data.premium = false;
      } catch {}
      return data;
    };

    try {
      let enp = neutralizeEnp(window.ENP);
      Object.defineProperty(window, "ENP", {
        configurable: true,
        enumerable: true,
        get() {
          return enp;
        },
        set(value) {
          enp = neutralizeEnp(value);
        }
      });
    } catch {}

    try {
      let data = neutralizePaywall(window.paywallData);
      Object.defineProperty(window, "paywallData", {
        configurable: true,
        enumerable: true,
        get() {
          return data;
        },
        set(value) {
          data = neutralizePaywall(value);
        }
      });
    } catch {}

    try { window.ArcP?.reset?.(); } catch {}
  }

  // El Mundo / El Confidencial (Piano): fuerza el flag de paywall visible a false.
  if (site.globals.includes("uePaywallVisible")) {
    try {
      let visible = false;
      Object.defineProperty(window, "uePaywallVisible", {
        configurable: true,
        enumerable: true,
        get() {
          return visible;
        },
        set() {
          visible = false;
        }
      });
    } catch {}
  }

  // ABC: el medidor propio marca "No" cuando no hay muro.
  if (site.globals.includes("voc_pw_meter")) {
    try { window.voc_pw_meter = "No"; } catch {}
  }

})();