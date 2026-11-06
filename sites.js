// Configuración compartida por los content scripts, el service worker y el popup.
// Se carga como script clásico (no módulo) en los tres contextos.
globalThis.ULOCK_SITES = {
  elpais: {
    label: "El País",
    hosts: ["elpais.com"],
    block: ["||elpais.com/arc/subs/"],
    storage: ["ArcP", "pmuser"],
    selectors: [
      "[pmwall-layer=true]",
      ".pmConsentWall",
      "#pmConsentWall",
      "[class*=paywall]",
      "[id*=paywall]"
    ],
    globals: ["paywallData", "ENP"]
  },
  elmundo: {
    label: "El Mundo",
    hosts: ["elmundo.es"],
    block: ["piano.io", "uecdn.es/piano"],
    storage: [
      "psp_hist_d",
      "psp_hist_m",
      "psp_hist_h",
      "psp_hist_ses",
      "telP",
      "telPId",
      "lastVisit30",
      "lastVisitMonth1",
      "_cX_atfr",
      "counter_page_view"
    ],
    selectors: [
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
    globals: ["uePaywallVisible", "uePiano", "PianoESPConfig"]
  },
  elconfidencial: {
    label: "El Confidencial",
    hosts: ["elconfidencial.com"],
    block: ["piano.io", "uecdn.es/piano"],
    storage: ["_pc_", "tp_", "EC_payWall"],
    selectors: [
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
    globals: ["uePaywallVisible"]
  },
  abc: {
    label: "ABC",
    hosts: ["abc.es"],
    block: ["evolok"],
    storage: ["voc_paywall", "voc_pw_meter", "evl_"],
    selectors: [
      "[class*=evolok]",
      "[id*=evolok]",
      "#dissuasion",
      ".dissuasion",
      "[class*=dissuasion]",
      "[class*=paywall]",
      "dialog.ob-em-modal"
    ],
    globals: ["voc_pw_meter"]
  },
  lavanguardia: {
    label: "La Vanguardia",
    hosts: ["lavanguardia.com"],
    block: ["evolok"],
    storage: ["evl_", "voc_paywall"],
    selectors: [
      "[class*=evolok]",
      "[id*=evolok]",
      "#dissuasion",
      ".dissuasion",
      "[class*=dissuasion]",
      "[class*=paywall]",
      ".lv-audio-subscribe"
    ],
    globals: ["evolok"]
  }
};

globalThis.ULOCK_DEFAULT_SETTINGS = {
  enabled: true,
  sites: Object.fromEntries(Object.keys(globalThis.ULOCK_SITES).map((id) => [id, true]))
};