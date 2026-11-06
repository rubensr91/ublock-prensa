const SITES = globalThis.ULOCK_SITES;
const DEFAULTS = globalThis.ULOCK_DEFAULT_SETTINGS;
const status = document.getElementById("status");

let settings = { ...DEFAULTS, sites: { ...DEFAULTS.sites } };

const KEY_RE =
  /(paywall|premium|psp_hist|telP|lastVisit|_pc_|voc_paywall|voc_pw|evolok|evl_|arcp|cX_|tp_|piano|meter|dissua)/i;

function render() {
  const container = document.getElementById("sites");
  container.textContent = "";

  for (const [id, site] of Object.entries(SITES)) {
    const label = document.createElement("label");
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = settings.sites[id] !== false;
    input.disabled = !settings.enabled;
    input.addEventListener("change", () => {
      settings.sites[id] = input.checked;
      save();
    });
    label.append(input, document.createTextNode(site.label));
    container.appendChild(label);
  }

  document.querySelector('[data-setting="enabled"]').checked = settings.enabled;
}

async function load() {
  const stored = await chrome.storage.sync.get("settings");
  const data = stored.settings || {};
  settings = {
    ...DEFAULTS,
    ...data,
    sites: { ...DEFAULTS.sites, ...(data.sites || {}) }
  };
  render();
}

async function save() {
  await chrome.storage.sync.set({ settings });
  status.textContent = "Guardado";
}

document.querySelector('[data-setting="enabled"]').addEventListener("change", (event) => {
  settings.enabled = event.target.checked;
  render();
  save();
});

document.getElementById("reset").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    status.textContent = "No hay pestaña activa";
    return;
  }

  try {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      world: "MAIN",
      func: (patternSource) => {
        const re = new RegExp(patternSource, "i");
        const doomed = [];
        for (const storage of [localStorage, sessionStorage]) {
          try {
            for (let i = 0; i < storage.length; i++) {
              const key = storage.key(i);
              if (key && re.test(key)) doomed.push([storage, key]);
            }
          } catch {}
        }
        for (const [storage, key] of doomed) {
          try { storage.removeItem(key); } catch {}
        }
        const host = location.hostname;
        const bare = host.replace(/^www\./, "");
        for (const cookie of document.cookie.split("; ").filter(Boolean)) {
          const name = cookie.split("=")[0];
          if (!re.test(name)) continue;
          for (const domain of ["", `; domain=${host}`, `; domain=.${bare}`]) {
            document.cookie = `${name}=; path=/${domain}; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
          }
        }
        return { removed: doomed.length };
      },
      args: [KEY_RE.source]
    });
    status.textContent = `Contadores borrados: ${result?.result?.removed ?? 0}`;
  } catch {
    status.textContent = "Abre una página soportada (El País, El Mundo, ABC, La Vanguardia o El Confidencial)";
  }
});

document.getElementById("reload").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) await chrome.tabs.reload(tab.id);
  window.close();
});

load();