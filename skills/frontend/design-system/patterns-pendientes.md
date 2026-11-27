---
id: design-system-patterns-pending
name: Pantallas que no cumplen el catálogo de patrones
description: Lista por receta (R1 a R8) de las pantallas de Admin y Platform que hoy no cumplen patterns.md, con ruta:línea, para corregirlas por tickets. No es una guía: la guía es patterns.md.
type: reference
---

# Pantallas que hoy no cumplen las recetas de `patterns.md`

Para abrir tickets; nada se corrigió. Conteo con `grep` sobre los árboles de trabajo del 2026-11-27. Cada archivo se cita por su
nombre (único en su app; `rg --files -g <nombre>` lo encuentra) y sus líneas.

| Receta | Casos |
|---|---|
| R1 Etiqueta de un dato | 88 |
| R2 Padding de la caja de estado | 76 |
| R3 Tarjeta dentro de un detalle | 16 a mano + 6 `app-card` a pasar a `flat` |
| R4 Guardar / Cancelar | 18 |
| R5 «Ver más» como botón | 3 |
| R6 Título de un bloque | 48 |
| R7 Texto largo | 12 |
| R8 Código + nombre | 2 (+4 con «·») |

**R1 (88).** `ink-faint`, `font-semibold` u otro tamaño en la etiqueta.
- P: `service-form.html:78, 82, 525, 529, 543, 551, 565, 573, 581, 595, 603, 621, 640, 646, 652, 657` · `service-detail.html:36, 40, 44, 53, 61, 65, 80, 84, 88` · `organizational-context.html:250, 254, 269, 273, 288, 298, 319, 323` · `notification-detail.html:18, 23, 27, 32, 37, 117` · `document-detail-panel.html:91, 106, 115, 119, 123` · `service-card.html:43-46` · `risk-wizard.html:182, 190, 224, 228` · `discovered-assets.html:118, 119, 121, 125` · `cause-detail-panel.html:75, 83, 87` · `control-detail-panel.html:255, 259, 264` · `control-score.html:21, 36, 50` · `control-exceptions-section.html:24, 29, 33` · `risk-assessment.html:19, 21, 30` · `team-groups.html:99, 101, 103` · `connection-result-step.ts:21, 25, 29` · `control-period.ts:27, 31` · `control-periodicity-form.html:10, 14` · `integration-connections.ts:35, 37`.
- A: `catalog-detail.html:326, 327, 341, 342, 359`.

**R2 (76).** `p-3` o `p-3.5` salvo donde se indica.
- P: `agent-install-panel.html:14, 68, 79, 95, 149, 160, 176` · `discovered-assets.html:23, 28, 36, 99` · `asset-card.html:71, 75, 79` · `aws-access-step.ts:19, 31, 54` · `cloud-connection-panel.html:27, 46` · `connect-server-form.html:29, 66` · `m365-access-step.ts:15, 18` · `service-form.html:326, 672` · `control-periodicity-form.html:5, 31` · `team-groups.html:44, 80` · `team-people.html:10, 116` · `risk-wizard.html:239, 273` (`p-2.5`) · `risk-form.html:5` · `organizational-context.html:340` · `control-approval.html:5` · `control-detail-panel.html:97` · `cause-detail-panel.html:62` · `risk-detail-panel.html:64` · `risk-assessment.html:6` · `control-evidence.html:53` · `control-level-form.html:5` · `control-occurrence-form.html:5` · `control-plan-form.html:5` · `control-reason-form.html:5` · `control-result-form.html:5` · `control-return-form.html:5` · `evaluation-period-form.html:5` · `document-detail-panel.html:80` · `asset-edit-form.html:80` · `aws-account-step.ts:42` · `aws-check-step.ts:28` · `connection-result-step.ts:35` · `gcp-access-step.ts:35` · `gcp-check-step.ts:25` · `gcp-project-step.ts:33` · `m365-check-step.ts:39` · `m365-data-step.ts:31` · `assignment-owner-form.html:4` · `assignment-delegate-form.html:4` · `responsibles.html:70` · `group-members.html:3` · `team-invite-form.html:4` · `connection-progress.html:27` · `execution-progress.html:28` · `document-reader.html:102` · `publish-version-form.html:4` · `assign-people-form.html:4`.
- A: `catalog-detail.html:82` (`px-3 py-1.5`), `113, 355` · `catalog-form.html:6` · `home.html:50` · `company-archive-form.html:5` · `company-form.html:97` · `company-quota-form.html:21`.

**R3 (16 + 6).**
- Cajas a mano dentro de un detalle (P): `team-people.html:121, 131, 163, 210` · `test-findings.html:13` (esqueleto), `50, 62` · `control-tests.ts:84, 104` · `control-evidence.html:124, 143, 203` · `risk-assessment.html:37, 112` · `risk-detail-panel.html:113` · `cause-detail-panel.html:128`.
- `app-card` con sombra dentro de un panel, a `flat` cuando exista (P): `control-approval.html:10` · `control-level-section.html:2` · `control-detail-panel.html:245, 274` · `control-applicability-section.html:28` · `notification-detail.html:93`.

**R4 (18).** Primaria primero, `-sm`, a la izquierda o separadas.
- P: `control-detail-panel.html:125, 172` · `risk-assessment.html:42, 59, 118` · `link-picker.ts:26` · `group-members.html:34` · `team-org-chart.html:84, 100, 129` · `responsibles.html:26` · `asset-edit-form.html:84` · `connect-server-form.html:70` (`justify-between`) · confirmación en línea, además debe ser `app-confirm-dialog`: `asset-card.html:41` · `agent-install-panel.html:177`.
- A: `catalog-detail.html:165` · `item-picker.html:38` · confirmación en línea: `catalog-detail.html:82`.

**R5 (3).** P: `control-history.html:78` (`mk-btn-secondary-sm`) · `asset-card.html:21` (`mk-btn-secondary-sm`) · `team-org-chart.html:74` (texto azul sin `mk-link`). Aparte, sin forma de ver lo que falta (falta función, no solo estilo): P `group-members.html:56`, `assignment-owner-form.html:12`, `assignment-delegate-form.html:12`, `notification-card.html:35`; A `home.html:98`.

**R6 (48).**
- (a) Línea `border-b` a mano en vez de `app-detail-section` (11): P `team-people.html:164, 211` · `team-groups.html:107` · `team-org-chart.html:51, 63, 156, 169, 182`; A `catalog-detail.html:21, 46, 144`.
- (b)/(c) Otro tamaño o peso (37), P salvo indicación: `h2 text-sm` `service-form.html:515, 536, 558, 588, 614, 632` · `organizational-context.html:232, 242, 261, 280, 311` · `h2 text-lg` `service-new-connection.html:22` · `integration-permissions.ts:21` · `integration-connections.ts:18` · `integration-catalog.ts:43` · `integration-security.ts:19` · `connect-server-form.html:3` · `h2 text-lg font-medium` `settings-group.ts:11` (P y A) · `notification-preferences.html:8, 53` · `h3 text-lg` `team-groups.html:95` · `risk-wizard.html:81, 175` · `h3 text-sm` `overview.html:101` · `integration-coverage.ts:36, 46` · `integration-permissions.ts:31` · `integration-security.ts:27` · `team-groups.html:49, 57` · `control-period.ts:38` · `h4 text-sm` `control-tests.ts:48` · `control-evidence.html:49` · `cloud-connection-panel.html:3` · `asset-edit-form.html:2` · `agent-install-panel.html:2`.
- A decidir (§0.3), no contados: título encima de la tarjeta en `overview.html:93` · `compliance-general.ts:82` · `team-blocks.html:3, 66` · `company-dashboard.html:26, 41, 57`.

**R7 (12).** P: `control-detail-panel.html:118, 161` · `risk-wizard.html:264` · `risk-form.html:19` (`mk-input !h-auto`) · `organizational-context.html:73` · `service-form.html:162, 178`. A (`mk-input !h-auto`): `catalog-form.html:16, 20, 53` · `company-archive-form.html:25` · `company-reactivate-form.html:10`.

**R8 (2 + 4).** P: `control-manual-tests.html:3` (texto plano «CÓDIGO · nombre») · `risk-wizard.html:146` (código en una caja a mano). Con badge pero con «·» entre código y nombre: P `cause-detail-panel.html:106, 139` · `risk-detail-panel.html:124`; A `catalog-detail.html:349`.
