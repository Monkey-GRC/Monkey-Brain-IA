# Prowler como motor de nube de Monkey

**Interno: nombra al motor. Nada de esto sale al cliente** (`philosophy.md`, D70). En el producto es «evaluación automática».

Prowler es el motor de nube de Monkey (D100): evalúa la configuración de una **cuenta de nube** (AWS, suscripción de Azure, proyecto de GCP) y
entrega resultados crudos que Monkey traduce a su modelo. Wazuh (`wazuh.md`) es el otro motor y sigue con servidores, BD y endpoints: configuración (SCA), monitoreo de amenazas en tiempo real y respuesta ante incidentes. **Prowler cubre todo lo de la nube** (AWS, Azure, GCP y demás). Los dos entregan el mismo formato (`check_results`); el catálogo, los checks y el mapeo a controles son de Monkey
(`README.md` de esta carpeta).

**Estado de la decisión:** rol cerrado en D100 (2026-10-31); construido y probado en desarrollo (D53–D58). Siguen abiertas la unidad de evaluación, la conexión y el catálogo (`P14` B a E).

## Qué hay verificado

| Hecho | Fuente |
|---|---|
| Imagen `toniblyx/prowler` fijada por versión (hoy `5.44.0`); el trabajador se niega a arrancar con `latest`. Un escaneo completo de AWS (655 checks, 2 regiones) tarda unos 2 minutos. | D55, D57 |
| El motor omite los checks sin recursos: de 655 ejecutados, 139 devolvieron filas. **Lo que no devuelve es `not_applicable`**, no «no ejecutado». | D56, `cruce-nube-aws.md` |
| Catálogo cargado: 662 checks, 3.413 mapeos del motor a los 6 marcos ofrecidos, 569 asignaciones propuestas a las 11 pruebas `T-CLD`. 104 checks no encajan en ninguna prueba. **Con la VF18 (D129)** el catálogo pasa a la 5.45.0 con 1.621 checks en 20 plataformas y los vínculos ratificados de `TEST_CHECKS` reemplazan a estas propuestas. | D56, D129 |
| GCP: escaneado a mano con la misma versión (110 checks, 21 hallazgos en un proyecto de pruebas sin recursos); la salida tiene el mismo formato y el parser la acepta. Catálogo con 98 de 110 checks asignados a pruebas `T-CLD` (`monkey_proposed`). Azure: sin probar (`P14` C5). | `cruce-nube-gcp.md` |
| Microsoft 365: el proveedor `m365` de la misma imagen (144 checks en 10 servicios), con PowerShell y sus módulos ya instalados; se autentica con un certificado y **no acepta tokens ni federación** (se mide en [`cruce-nube-m365.md`](cruce-nube-m365.md); aún no contra un tenant real, `DT-138`). | D154 |

## Reglas que no se rompen

| Regla | Por qué |
|---|---|
| **El motor es una caja negra**, sin lógica de compliance propia. | El control es atómico y de Monkey; el motor solo aporta resultados (`modelo-datos.md` §8). |
| **El mapeo a SOC 2 lo pone Monkey, no el motor.** Va por la prueba: check → prueba → control → punto de enfoque → requisito. El mapeo del motor se guarda con procedencia `engine_native`; **gana siempre el comité** (`committee_ratified`). | D56 |
| **Credenciales temporales de un rol asumido (1 h)**, nunca llaves de larga vida; el cliente crea un rol de solo lectura con `ExternalId`. **Excepciones documentadas:** el canal de llaves (D53) y Microsoft 365, cuyo proveedor del motor solo acepta el certificado de la conexión (D154). | D53, D58, SEG-26, SEG-46 |
| **Lo ejecuta un trabajador aislado**, no el backend: un contenedor efímero por cliente y por corrida, sin capacidades, sin acceso a la base ni a la API, siempre eliminado. El backend nunca toca Docker. | D57, SEG-47 |
| **Solo se evalúan las regiones que el cliente declara.** Un check de cuenta repetido por región cuenta como una evaluación. | D53 |
| **Una corrida que no conecta es `failed`** (problema de conexión), nunca un incumplimiento. | D57 |
| **Los textos del motor son internos**: nombran al proveedor en algunos casos y no salen al cliente; los hallazgos se le explican con la plantilla de 7 campos. | D56, `P14` D3, `P14` E2 |

## Dónde seguir

| Pregunta | Archivo |
|---|---|
| ¿Qué dio el escaneo de AWS y cómo cubre las pruebas `T-CLD`? | [`cruce-nube-aws.md`](cruce-nube-aws.md) |
| ¿Y el catálogo de Microsoft 365 y qué checks cuentan? | [`cruce-nube-m365.md`](cruce-nube-m365.md) |
| ¿Cómo conecta el cliente su cuenta y quién hace qué? | [`flujo-conexion-nube.md`](../../onboarding/conexion-activos/flujo-conexion-nube.md) |
| ¿Cómo se guarda en el modelo (recurso hijo, procedencia, ejecuciones)? | `D56`, `modelo/08-control-tecnico.md` |
| ¿Cómo se ejecuta y con qué aislamiento? | `D57` y `Backend/src/runner/` |
| ¿Qué falta o está parchado? | `deuda-tecnica/control-tecnico.md` (DT-43, DT-44, DT-45, DT-50, DT-52) |
| ¿Qué sigue abierto? | `P14` (unidad de evaluación, conexión y legal; el rol de cada motor se cerró en D100 y el catálogo en D129); los puntajes globales los cerraron D141 y D146 |
