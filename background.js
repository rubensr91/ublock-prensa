// Service worker: activa/desactiva los rulesets estáticos de bloqueo por sitio.
// Los rulesets se aplican al instalar la extensión, antes de que cargue cualquier
// página; las reglas dinámicas solo se limpian (venían de la versión anterior).
importScripts("sites.js");

const SITES = self.ULOCK_SITES;
const DEFAULTS = self.ULOCK_DEFAULT_SETTINGS;
const LEGACY_RULE_MIN = 2000;
const LEGACY_RULE_MAX = 2500;

async function getSettings() {
  const { settings } = await chrome.storage.sync.get("settings");
  return {
    ...DEFAULTS,
    ...(settings || {}),
    sites: { ...DEFAULTS.sites, ...((settings && settings.sites) || {}) }
  };
}

async function syncRulesets() {
  const settings = await getSettings();
  const ids = Object.keys(SITES);
  const enabled = settings.enabled ? ids.filter((id) => settings.sites[id] !== false) : [];
  const disabled = ids.filter((id) => !enabled.includes(id));

  try {
    await chrome.declarativeNetRequest.updateEnabledRulesets({
      enableRulesetIds: enabled,
      disableRulesetIds: disabled
    });
  } catch (error) {
    console.error("[unlock-prensa] no se pudieron cambiar los rulesets", error);
  }

  try {
    const existing = await chrome.declarativeNetRequest.getDynamicRules();
    const removeRuleIds = existing
      .map((rule) => rule.id)
      .filter((id) => id >= LEGACY_RULE_MIN && id < LEGACY_RULE_MAX);
    if (removeRuleIds.length) {
      await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds });
    }
  } catch {}
}

chrome.runtime.onInstalled.addListener(syncRulesets);
chrome.runtime.onStartup.addListener(syncRulesets);

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "unlock:get") {
    getSettings().then(sendResponse);
    return true;
  }
  if (message?.type === "unlock:set") {
    chrome.storage.sync
      .set({ settings: message.settings })
      .then(syncRulesets)
      .then(getSettings)
      .then(sendResponse);
    return true;
  }
  return false;
});

syncRulesets();