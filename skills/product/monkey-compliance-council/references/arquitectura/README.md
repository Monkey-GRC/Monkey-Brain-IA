# Arquitectura

Responde: **¿cómo está armado Monkey y cómo funciona cada módulo por dentro?** El índice de abajo es también el
**orden de lectura**: de arriba abajo se entiende el sistema entero. Un número con decimal (`9.1`) es un
**componente** del módulo que lo precede.

## Módulo y componente

No son lo mismo:

- **Módulo:** una parte del producto, con su propio directorio aquí. Autenticación, Onboarding, Cumplimiento…
- **Componente:** una parte de un módulo, con su pantalla, sus tablas y su flujo. Vive en un subdirectorio del
  módulo y aquí aparece numerado como `N.1`, `N.2`…

En los diagramas, «nivel 3 del C4» se titula **piezas internas** para no confundir las dos palabras.

## Índice

### Primero: el sistema completo

| # | Lee | Qué aprendes |
|---|---|---|
| **1** | [`architecture.md`](architecture.md) | Los 4 motores, el stack y los principios que no se negocian |
| **2** | [`c4-contexto.md`](c4-contexto.md) | C4 nivel 1: quién usa Monkey y con qué sistemas externos habla |
| **3** | [`c4-contenedores.md`](c4-contenedores.md) | C4 nivel 2: qué aplicaciones y bases corren, y cómo se comunican |
| **4** | [`c4-componentes.md`](c4-componentes.md) | C4 nivel 3: las features y las capas del Backend, y qué módulo documenta cada una |

### Después: los módulos, en el orden en que un cliente los recorre

| # | Módulo o componente | Qué cubre | Sus archivos |
|---|---|---|---|
| | **Acceso** | | |
| **5** | [**Autenticación**](autenticacion/README.md) | Iniciar sesión, segundo factor, activar cuenta, recuperar contraseña | [c4](autenticacion/01-c4.md) · [modelo](autenticacion/02-modelo.md) · [flujos](autenticacion/03-flujos.md) · [historias](autenticacion/04-historias.md) · [casos de uso](autenticacion/05-casos-de-uso.md) · [mejoras](autenticacion/06-mejoras.md) |
| **6** | [**Gestión de usuarios**](gestion-usuarios/README.md) | Invitar, editar y dar de baja al equipo; especialidades y reparto | [c4](gestion-usuarios/01-c4.md) · [modelo](gestion-usuarios/02-modelo.md) · [flujos](gestion-usuarios/03-flujos.md) · [historias](gestion-usuarios/04-historias.md) · [casos de uso](gestion-usuarios/05-casos-de-uso.md) · [mejoras](gestion-usuarios/06-mejoras.md) |
| **7** | [**Roles y permisos**](roles-permisos/README.md) | Los 4 roles, la matriz y las tres capas donde se hace cumplir | [c4](roles-permisos/01-c4.md) · [modelo](roles-permisos/02-modelo.md) · [flujos](roles-permisos/03-flujos.md) · [historias](roles-permisos/04-historias.md) · [casos de uso](roles-permisos/05-casos-de-uso.md) · [mejoras](roles-permisos/06-mejoras.md) |
| | **Antes de que haya clientes** | | |
| **8** | [**Empresas**](empresas/README.md) | Registrar, archivar y purgar una empresa cliente (`admin_monkey`) | [c4](empresas/01-c4.md) · [modelo](empresas/02-modelo.md) · [flujos](empresas/03-flujos.md) · [historias](empresas/04-historias.md) · [casos de uso](empresas/05-casos-de-uso.md) · [mejoras](empresas/06-mejoras.md) |
| **9** | [**Catálogo maestro**](catalogo-maestro/README.md) | Marcos, requisitos, controles, pruebas y su administración | [c4](catalogo-maestro/01-c4.md) · [modelo](catalogo-maestro/02-modelo.md) · [flujos](catalogo-maestro/03-flujos.md) · [historias](catalogo-maestro/04-historias.md) · [casos de uso](catalogo-maestro/05-casos-de-uso.md) |
| 9.1 | ↳ [Marcos](catalogo-maestro/marcos/README.md) | Qué exige cada marco y qué falta para activarlo en el producto | [SOC 2](catalogo-maestro/marcos/soc2.md) · [ISO 27001](catalogo-maestro/marcos/iso27001.md) · [PCI DSS](catalogo-maestro/marcos/pci-dss.md) · [HIPAA](catalogo-maestro/marcos/hipaa.md) · [+10](catalogo-maestro/marcos/README.md) |
| | **El recorrido del cliente** | | |
| **10** | [**Onboarding**](onboarding/README.md) | Preparación de contexto: empresa → servicio → riesgos → activos | [c4](onboarding/01-c4.md) · [flujos](onboarding/03-flujos.md) · [historias](onboarding/04-historias.md) · [casos de uso](onboarding/05-casos-de-uso.md) |
| 10.1 | ↳ [Contexto organizacional](onboarding/contexto-organizacional/README.md) | Componente 1: lo que la empresa declara de sí misma | [modelo](onboarding/contexto-organizacional/02-modelo.md) · [flujos](onboarding/contexto-organizacional/03-flujos.md) |
| 10.2 | ↳ [Contexto del servicio](onboarding/contexto-servicio/README.md) | Componente 2: el servicio y el clonado del catálogo | [modelo](onboarding/contexto-servicio/02-modelo.md) · [flujos](onboarding/contexto-servicio/03-flujos.md) |
| 10.3 | ↳ [Conexión de activos](onboarding/conexion-activos/README.md) | Componente 3: conectar → validar → activar → programar | [historias](onboarding/conexion-activos/04-historias.md) · [modelo](onboarding/conexion-activos/02-modelo.md) · [flujos](onboarding/conexion-activos/03-flujos.md) · [nube](onboarding/conexion-activos/flujo-conexion-nube.md) |
| **11** | [**Control técnico**](control-tecnico/README.md) | La medición automática continua | [c4](control-tecnico/01-c4.md) · [modelo](control-tecnico/02-modelo.md) · [flujos](control-tecnico/03-flujos.md) · [historias](control-tecnico/04-historias.md) · [casos de uso](control-tecnico/05-casos-de-uso.md) · [mejoras](control-tecnico/06-mejoras.md) |
| 11.1 | ↳ [Motores](control-tecnico/motores/README.md) | La sonda y el motor de nube. **Confidencial frente al cliente** | [sonda](control-tecnico/motores/wazuh.md) · [operación](control-tecnico/motores/wazuh-operacion.md) · [API](control-tecnico/motores/wazuh-api.md) · [marcos](control-tecnico/motores/wazuh-compliance.md) · [nube](control-tecnico/motores/prowler.md) · [cruce](control-tecnico/motores/cruce-nube-aws.md) |
| **12** | [**Cumplimiento**](cumplimiento/README.md) | El cálculo del cumplimiento y todo lo que lo mueve | [c4](cumplimiento/01-c4.md) · [modelo](cumplimiento/02-modelo.md) · [flujos](cumplimiento/03-flujos.md) · [historias](cumplimiento/04-historias.md) · [casos de uso](cumplimiento/05-casos-de-uso.md) · [mejoras](cumplimiento/06-mejoras.md) · [estudio](cumplimiento/07-estudio.md) |
| 12.1 | ↳ [Motor](cumplimiento/motor/README.md) | Las reglas puras que convierten hechos en estados | [reglas](cumplimiento/motor/reglas.md) |
| 12.2 | ↳ [Controles](cumplimiento/controles/README.md) | Lista y detalle de los controles de un servicio | [flujos](cumplimiento/controles/03-flujos.md) |
| 12.3 | ↳ [Resumen](cumplimiento/resumen/README.md) | Estado por marco y categoría, y el período auditado | [flujos](cumplimiento/resumen/03-flujos.md) |
| 12.4 | ↳ [Evidencia](cumplimiento/evidencia/README.md) | Subir, versionar y revisar documentos | [flujos](cumplimiento/evidencia/03-flujos.md) |
| 12.5 | ↳ [Veredictos](cumplimiento/veredictos/README.md) | La decisión de una persona sobre una prueba manual | [flujos](cumplimiento/veredictos/03-flujos.md) |
| 12.6 | ↳ [Exclusiones](cumplimiento/exclusiones/README.md) | Sacar un activo de una prueba, con vigencia | [flujos](cumplimiento/exclusiones/03-flujos.md) |
| 12.7 | ↳ [Observaciones](cumplimiento/observaciones/README.md) | Lo que escribe el auditor y cómo lo atiende la empresa | [flujos](cumplimiento/observaciones/03-flujos.md) |
| 12.8 | ↳ [Riesgos](cumplimiento/riesgos/README.md) | Riesgos, causas, evaluación 5×5 y tratamiento | [flujos](cumplimiento/riesgos/03-flujos.md) |
| **18** | [**Documentos**](documentos/README.md) | Políticas y procedimientos de la empresa: versiones, aprobación, aceptación del personal y la prueba documental (D133; corte mínimo construido en MD-503, D152) | — |
| | **Transversal** | | |
| **13** | [**Trazabilidad**](trazabilidad/README.md) | El rastro de auditoría y los eventos de cambio de estado | [c4](trazabilidad/01-c4.md) · [modelo](trazabilidad/02-modelo.md) · [flujos](trazabilidad/03-flujos.md) · [historias](trazabilidad/04-historias.md) · [casos de uso](trazabilidad/05-casos-de-uso.md) · [mejoras](trazabilidad/06-mejoras.md) |
| **14** | [**Aislamiento multi-tenant**](aislamiento-tenant/README.md) | RLS, `withScope` y por qué el aislamiento está en la base | [c4](aislamiento-tenant/01-c4.md) · [flujos](aislamiento-tenant/03-flujos.md) · [historias](aislamiento-tenant/04-historias.md) · [casos de uso](aislamiento-tenant/05-casos-de-uso.md) · [mejoras](aislamiento-tenant/06-mejoras.md) |
| **15** | [**Plataforma**](plataforma/README.md) | Sobre de respuesta, errores, i18n, límites, correo, archivos y cifrado | [c4](plataforma/01-c4.md) · [flujos](plataforma/03-flujos.md) · [historias](plataforma/04-historias.md) · [casos de uso](plataforma/05-casos-de-uso.md) · [mejoras](plataforma/06-mejoras.md) · [carga](plataforma/07-estudio.md) |
| 15.1 | ↳ [Infraestructura](plataforma/infraestructura/README.md) | La VPS de desarrollo: contenedores, red, despliegue, métricas y mejoras | — |
| **16** | [**Notificaciones**](notificaciones/README.md) | La campana de avisos con su resumen diario por correo (D143, D151; MD-515) y los correos que salen | [historias](notificaciones/04-historias.md) · [casos de uso](notificaciones/05-casos-de-uso.md) |
| **17** | [**Integraciones**](integraciones/README.md) | Las plataformas de terceros: catálogo, lo conectado y la frontera del conector (D110) | [historias](integraciones/04-historias.md) · [casos de uso](integraciones/05-casos-de-uso.md) |

Todos los módulos del producto están documentados. Lo que se cree de aquí en adelante nace con su directorio y su
fila en este índice.

## Qué archivo va en cada directorio

Un número significa siempre lo mismo. **El archivo que no aplica, no se crea** (por eso faltan huecos arriba).

| Archivo | Responde |
|---|---|
| `README.md` | Para qué existe, actores, tablas que posee, límites con otros, y el dueño de cada dato |
| `01-c4.md` | Contexto, contenedores y piezas internas |
| `02-modelo.md` | Sus tablas y las reglas de datos que las explican |
| `03-flujos.md` | Qué dato viaja de dónde a dónde, con las secuencias de cada operación |
| `04-historias.md` | Historias de usuario (`HU-<MÓDULO>-nn`): quién, qué, para qué y criterios de aceptación verificables; estado ✅ 🟡 ⚪ |
| `05-casos-de-uso.md` | Casos de uso (`CU-<MÓDULO>-nn`): diagrama, actor, pre y postcondición, flujo principal y alternos |
| `06-mejoras.md` | Mejoras y riesgos del módulo; lo aprobado pasa a `DT-n` o a una `D-n` |
| `07-estudio.md` | Ejercicios y estudios para comprobar lo que se afirma (carga, rendimiento) |

Un componente suele llevar solo `README.md`, `02-modelo.md` y `03-flujos.md`: el C4 es del módulo.

**Regla que no se rompe:** se **enlaza** lo que ya tiene dueño (`contracts/`, `datos/modelo/`, `D-n`, `SEG-n`,
`DT-n`) y no se copia (`STANDARD.md` §1). Si un ER ya está en `datos/modelo/`, aquí no se redibuja.

## Los registros de cada módulo

El nombre del módulo es el mismo en todo el cerebro (`STANDARD.md` §2b). Desde el `README.md` de cada módulo salen
enlaces a todo lo que se sabe de él:

| Pregunta | Dónde |
|---|---|
| ¿Cómo funciona? | Este directorio |
| ¿Qué forma tienen sus endpoints y sus enums? | [`contracts/`](../../../../../contracts/README.md): `<módulo>.md` o `<módulo>/<componente>.md`, y `enums/` |
| ¿Qué tablas tiene? | [`datos/modelo/`](../datos/modelo/) (la tabla de equivalencia § ↔ módulo está en [`datos/modelo-datos.md`](../datos/modelo-datos.md)) |
| ¿Por qué se decidió así? | [`datos/decisiones/`](../datos/decisiones/README.md) |
| ¿Qué falta decidir? | [`datos/pendientes/`](../datos/pendientes/README.md) |
| ¿Qué está parchado? | [`deuda-tecnica/`](../deuda-tecnica/README.md) |
| ¿Qué debe cumplir en seguridad? | [`seguridad/`](../seguridad/README.md) |

## Cómo mantener esto (para que no mienta)

- **Se verifica contra el código, no contra la memoria.** Cada archivo termina con «Cómo verificarlo»: el comando o
  la carpeta que confirma lo dibujado. Si no coincide, se corrige el documento.
- **Cambia una pieza, cambia su diagrama, en el mismo PR** (`STANDARD.md` §5).
- **Sin números que envejecen** (conteos de tablas, versiones, fechas de estado): `STANDARD.md` §2.
- **Lo provisional se marca como tal** (línea punteada en el diagrama) y se enlaza a su `DT-n`.
- Los diagramas son **Mermaid dentro de Markdown**: se ven en GitHub, se versionan y se revisan en un PR como
  cualquier código. Se editan a mano, no se exportan de una herramienta gráfica.
