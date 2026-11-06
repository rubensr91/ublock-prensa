# ublock-prensa

Extensión de Chrome (MV3) que quita los muros de pago **de cliente** en varios
periódicos: contadores de artículos, modales de suscripción y bloques de texto
ocultos.

## Periódicos soportados

| Sitio | Sistema de muro | Qué hace la extensión |
|---|---|---|
| El País | Arc XP (`window.paywallData`, `ArcP`) | Bloquea `arc/subs`, borra `ArcP`, neutraliza `paywallData`/`ENP` |
| El Mundo | Piano (`api-esp.piano.io`) | Bloquea el SDK, limpia contadores `psp_hist_*`/`telP`, quita `.tp-*` y `.ue-cintillo-premium` |
| El Confidencial | Piano + bloque `hidden` | Borra `.EC_payWall`/`.premiumBar`, bloquea Piano y desoculta `news-body-complete` |
| ABC | Evolok | Bloquea Evolok, borra `voc_paywall`, quita nodos de disuasión |
| La Vanguardia | Evolok | Igual que ABC |

## Instalación

1. Abre `chrome://extensions`.
2. Activa **Modo de desarrollador**.
3. **Cargar descomprimida** y elige esta carpeta.
4. Tras cambiar el código: botón **⟳ Recargar** en la tarjeta y recarga la pestaña.

## Funcionamiento

- `rules/*.json`: rulesets estáticos de `declarativeNetRequest`; bloquean los SDK
  de paywall (Piano, Evolok, Arc) antes de que se ejecuten.
- `sanitizer.js` (MAIN world, `document_start`): purga `localStorage`,
  `sessionStorage` y cookies de contadores, e impide que vuelvan a escribirse.
  También neutraliza los objetos globales de paywall de cada medio.
- `cleaner.js` (ISOLATED world): inyecta CSS y elimina/desoculta nodos del muro,
  con `MutationObserver` y reintentos durante 15 s.
- `background.js`: activa o desactiva un ruleset por sitio según los toggles.
- `popup.html` / `popup.js`: lista de sitios, interruptor global y reseteo de
  contadores de la pestaña activa.

## Limitaciones

- **Muros server-side no se pueden saltar**: si el servidor no envía el texto
  (WSJ, FT, The Economist, Mediapart), no hay nada que desbloquear en el cliente.
- El País devuelve 403 a navegadores headless, así que su verificación
  automatizada solo cubre inyección de scripts y reglas DNR.
- Los avisos de cookies (Didomi, etc.) son independientes del paywall y no se
  tocan.
- Los selectores y claves cambian cuando los medios rediseñan; hay que
  revisarlos.

## Aviso

Proyecto personal con fines educativos. El uso puede contravenir los términos de
servicio de los medios citados; la responsabilidad es de quien lo use.