# Deuda técnica — Plataforma

Parches vigentes de [Plataforma](../arquitectura/plataforma/README.md). Tablero y reglas: [`README.md`](README.md).

## Componente 3 — Control Técnico (D46)

### DT-5 · Llave de cifrado en el `.env`

🟠 Importante

- **Qué está parchado:** `CREDENTIALS_ENCRYPTION_KEY` (AES-256-GCM) no tiene rotación ni gestor de secretos; el formato `v1.` deja espacio para versionar la llave, pero no hay procedimiento
- **Por qué:** Alcance del sprint
- **Qué lo cierra:** Gestor de secretos / KMS en producción y un procedimiento de rotación (re-cifrar con `v2`)

## Registro de empresa, contrato de marcos (D47) y activación de la cuenta (D51)

## Transversal

### DT-21 · Traducciones al inglés hechas por desarrollo

🟠 Importante

- **Qué está parchado:** y sin revisar. *Hecho (MD-114):* Monkey Platform ya tiene i18n (es/en) en toda la app; el inglés de `Frontend-Platform/public/i18n/en/` también lo escribió desarrollo y está sin revisar. Los términos de Cumplimiento (`compliance.json`) siguen el glosario **propuesto** en MD-109, aún no aprobado por producto. Los textos de los tipos de conexión (`ac_01`…`ac_06`), las descripciones de los marcos, «Ninguna»/«Otra» y el grupo «Responsables» ya los traduce el backend por código (MD-211, D111). El contenido del catálogo del comité sigue solo en español: DT-100. La pantalla legacy `assets/asset-detail` (sin ruta, MD-116) no se tradujo
- **Por qué:** El Excel solo trae español
- **Qué lo cierra:** Revisión del comité de los dos idiomas y aprobar el glosario de MD-109

## Frontends (Monkey Admin y Monkey Platform)

Parches que dejó el rediseño visual y las capas de `Frontend` y `Frontend-Platform`. El sistema de diseño vive en
[`skills/frontend/design-system/`](../../../../frontend/design-system/README.md); el código tal como está, en `context/frontend.md`.

### DT-99 · Lint de los frontends: reglas apagadas y dependencias de desarrollo con avisos

🟡 Mejora

- **Qué está parchado:** (1) ESLint 9.39 sigue instalado porque `angular-eslint` 20 solo acepta `eslint` 8 o 9, y npm lo marca «sin soporte»; (2) la regla `no-non-null-assertion` está apagada en los `*.spec.ts` (unos 440 casos en Platform, sobre `querySelector` y resultados de prueba); (3) en Admin, `prefer-inject` está apagada en `core/services/auth.service.ts` (constructor con parámetros); (4) `npm audit` deja 22 avisos moderados, solo en herramientas de desarrollo (nada en `--omit=dev`): `minimatch` vía `typescript-eslint` (`@typescript-eslint/typescript-estree` 8.72.x) y `glob` vía `@angular/cli` 20
- **Por qué:** subir `eslint` a 10 exige `angular-eslint` 21 o 22, y estos exigen `@angular/cli` 21 o 22; no se subió ninguna dependencia a una versión mayor en este cambio
- **Qué lo cierra:** subir los dos frontends a Angular 21 o superior (con `angular-eslint`, `eslint` 10 y `@angular/cli` actualizados), con lo que se cierran (1) y (4); para (2), escribir los `!` de los specs con un ayudante tipado que lance si el elemento falta y quitar la excepción; para (3), migrar el constructor a `inject()`


### DT-121 · Specs de los frontends que aseveran clases de estilo

🟡 Mejora

- **Qué está parchado:** unos 15 specs comprueban clases CSS en vez de comportamiento o `data-*`: `modal`, `data-table`, `donut`, `confirm-dialog`, `expandable-text`, `table-toolbar`, `option-chips` (compartidos) y `discovered-assets`, `control-evidence`, `control-tests`, `detail-card`, `overview`, `company-dashboard`, `integrations-list`, `home` (Platform)
- **Por qué:** MD-499 corrigió los que tocó con más carga; el resto se dejó para no abrir otra vuelta de revisión antes de la demo
- **Qué lo cierra:** MD-526 (calidad de pruebas): asertar `data-*`, roles o `data-state`; la clase solo vale cuando es el comportamiento (`line-clamp-2`)
