# Deuda técnica — Plataforma

Parches vigentes de [Plataforma](../arquitectura/plataforma/README.md). Tablero y reglas: [`README.md`](README.md).

## Componente 3 — Control Técnico (D46)

### DT-5 · Llave de cifrado en el `.env`

🟠 Importante

- **Qué está parchado:** `CREDENTIALS_ENCRYPTION_KEY` (AES-256-GCM) no tiene rotación ni gestor de secretos; el formato `v1.` deja espacio para versionar la llave, pero no hay procedimiento
- **Por qué:** Alcance del sprint
- **Qué lo cierra:** Gestor de secretos / KMS en producción y un procedimiento de rotación (re-cifrar con `v2`)

## Registro de empresa, contrato de marcos (D47) y activación de la cuenta (D51)

### DT-42 · Los textos «auditoría» de Inicio y de «Mis servicios» no se cambiaron a «consultoría»

🟡 Mejora

- **Qué está parchado:** El comité pidió el cambio en la pantalla del marco y del servicio; `home` y `services-list` aún dicen «auditoría»
- **Por qué:** Fuera de lo pedido
- **Qué lo cierra:** Una pasada de textos con el comité

## Transversal

### DT-21 · Traducciones al inglés hechas por desarrollo

🟠 Importante

- **Qué está parchado:** y sin revisar. *Hecho (MD-114):* Monkey Platform ya tiene i18n (es/en) en toda la app; el inglés de `Frontend-Platform/public/i18n/en/` también lo escribió desarrollo y está sin revisar. Los términos de Cumplimiento (`compliance.json`) siguen el glosario **propuesto** en MD-109, aún no aprobado por producto. Los nombres de los tipos de conexión (`ac_01`…`ac_06`) salen de la base solo en español: Platform los traduce por código (`TECHNICAL_CONTROL.CATEGORY.*`). La pantalla legacy `assets/asset-detail` (sin ruta, MD-116) no se tradujo
- **Por qué:** El Excel solo trae español
- **Qué lo cierra:** Revisión del comité de los dos idiomas y aprobar el glosario de MD-109; traducir `automated_capabilities.category` en el backend (o llevarlo a `catalogs.json`) para no depender del mapa del frontend; instalar i18n en Platform

### DT-24 · Tailwind avisa de clases canónicas (`dark:bg-white/[0.03]` → `dark:bg-white/3`) en Platfor

🟡 Mejora

- **Qué está parchado:** Tailwind avisa de clases canónicas (`dark:bg-white/[0.03]` → `dark:bg-white/3`) en Platform
- **Por qué:** Solo estético
- **Qué lo cierra:** Una pasada de limpieza
