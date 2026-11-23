---
id: add-cloud-engine
name: Integrar el motor de nube (Prowler) en el backend
description: Cómo extender el control técnico de la nube (nuevo proveedor, nuevo canal de credenciales o nuevo ejecutor del motor) sin romper el aislamiento ni la confidencialidad. Consultar prowler.md y D53–D58, D100 antes de implementar.
type: recipe
applies_to: backend
---

# Skill: Integrar el motor de nube (Prowler)

> **Antes de escribir una línea, lee** `arquitectura/control-tecnico/motores/prowler.md` y `D53`–`D58` y `D100`
> (`../product/monkey-compliance-council/references/datos/`), `SEG-26`, `SEG-46`, `SEG-47` y `deuda-tecnica/control-tecnico.md`
> (`DT-43`, `DT-44`, `DT-45`, `DT-50`, `DT-52`). Prowler maneja **todo lo de la nube** (AWS, Azure, GCP y demás); la sonda (Wazuh) es otro
> motor, con `add-wazuh-integration.md`. Lo que siga abierto en `P14` (B, C y E) y `P49` **se pregunta, no se resuelve**; qué checks cuentan lo dice `TEST_CHECKS` de la VF18 (D129).

Esto **no** es una feature con endpoints de cara al cliente. La nube vive en tres piezas ya construidas; extiéndelas, no las rodees:

| Pieza | Dónde | Regla |
|---|---|---|
| **Validación de la conexión** | `src/features/technical-control/infrastructure/probes/runner-connection.probe.ts` (`PROBE_MODE=runner`, D58) | El backend **no toca** la cuenta del cliente ni guarda llaves: encola una validación y espera la respuesta del trabajador. Lo que es culpa nuestra (trabajador caído) es «no disponible» (503), nunca un error del cliente. |
| **El trabajador** | `src/runner/` (entrypoint aparte, misma imagen) | Dominio (`RunnerApi`, `CredentialBroker`, `ScanEngine`) → caso de uso `run-next-execution` (no sabe de nubes) → adaptadores (HTTP a `/internal/runner`, Docker y uno por nube en `infrastructure/providers/`). **No importa nada de `src/features` y no tiene acceso a la base.** |
| **La lectura del resultado** | `src/features/technical-control/infrastructure/engine/ocsf-parser.ts` (`EngineOutputParser`) | Normaliza la salida del motor a `check_results`. **Falla en voz alta** (DT-50): una fila mal formada o un estado desconocido se informa con su posición, nunca se descarta. |

## Qué se extiende y cómo

- **Otro proveedor (Azure…):** una carpeta `src/runner/infrastructure/providers/<nube>/` con su broker de credenciales, su perfil del motor
  (argumentos y entorno; lo común está en `engine-common.ts`) y, si aplica, su inventario; se registra en `cloud-adapters.ts`. En el backend: su
  canal en `connection_method`, sus reglas al declarar el activo y su catálogo de checks (`npm run cloud:extract -- <carpeta> <versión> --platform <nube>`).
  GCP es el ejemplo completo (D112, `cruce-nube-gcp.md`). Azure sigue sin probar (`P14` C5): no se promete su cobertura.
- **Otro ejecutor** (una tarea en la nube en lugar de Docker): un `ScanEngine` nuevo. El bucle del trabajador no cambia.
- **Más checks o pruebas:** el seed (`npm run cloud:extract | cloud:load | cloud:verify`, D56). El mapeo lo pone Monkey y **gana el comité**
  (`mapping_provenance`); el seed nunca pisa una asignación `committee_ratified`.

## Reglas que no se rompen

- **Credenciales temporales de un rol asumido (1 h)**, con `ExternalId`; el trabajador rechaza un rol de otra cuenta que la declarada (SEG-46).
- **El motor corre en una imagen fijada por versión o digest**, nunca `latest`, en un contenedor efímero por cliente y por corrida: sin
  capacidades, sin montajes del servidor, en la red por defecto de Docker, siempre eliminado.
- **El backend nunca monta el socket de Docker.** Solo el trabajador habla con el ejecutor.
- **Reclamar una ejecución sin tenant** va por una función `SECURITY DEFINER` angosta (D57, SEG-08); no abras RLS.
- **Un activo no puede tener dos ejecuciones abiertas** (índice único parcial).
- **Las regiones** se validan con una expresión estricta antes de llegar a la línea de comandos, y solo se evalúan las declaradas (D53).
- **Una corrida que no conecta es `failed`** (problema de conexión), nunca un incumplimiento. Cada razón de fallo es una clave i18n en español
  e inglés que **no nombra al proveedor** (`add-i18n-error.md`).
- **Un check que el motor no devuelve es `not_applicable`**, no «no ejecutado» (D56).
- **Los textos del motor son internos.** Al cliente le llegan explicados con la plantilla de 7 campos de `philosophy.md`, sin nombrar a Prowler.
- **Nunca** pegues llaves, tokens ni `runner.env` en chats, issues o este repo.

## Antes de pasar a QA

- Pruebas del caso de uso con puertos falsos, del parser con salida real y del trabajador contra Docker (como las de `src/runner/`).
- Confirma que ninguna pantalla, error, correo ni texto de IA nombra al proveedor (SEG-39, D70).
- Cierra o actualiza lo relacionado en el mismo PR: `DT-n`, `SEG-n`, contrato y `P14`/`P49`.
