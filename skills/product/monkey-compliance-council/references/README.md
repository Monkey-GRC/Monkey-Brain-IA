# Referencias del Brain — mapa

Si buscas algo, empieza por la **carpeta** que corresponde a la parte de la aplicación. El enrutador es `../SKILL.md`; este mapa
es la versión por carpetas.

| Carpeta | Qué hay | Pregunta que responde |
|---|---|---|
| [`producto/`](producto/) | `philosophy` · `mvp-roadmap` · `council` · `flujo-end-to-end` · `sprint-onboarding` | ¿Cómo le habla Monkey al usuario? ¿Qué se construye primero? ¿Cómo se recorre un cliente de punta a punta? |
| [`arquitectura/`](arquitectura/) | `architecture` | ¿Cuáles son los 4 motores, la estructura del modelo y el stack? |
| [`datos/`](datos/README.md) | `modelo-datos` · `schema-implementacion` · `modelo-datos-decisiones` · `modelo-datos-pendientes` | ¿Qué tablas hay, cómo se implementan, por qué y qué falta decidir? |
| [`seguridad/`](seguridad/README.md) | `requisitos` (`SEG-n`) | ¿Qué debe cumplir el producto en seguridad y qué está realmente comprobado? |
| [`cumplimiento/`](cumplimiento/README.md) | `frameworks/` (14 marcos) | ¿Qué exige SOC 2, ISO 27001, PCI DSS…? |
| [`control-tecnico/`](control-tecnico/README.md) | la sonda (`wazuh*`) · el motor de nube (`cruce-nube-aws`) | ¿Cómo se integran los motores que miden y qué reglas no se rompen? |
| [`modulos/`](modulos/) | `onboarding` | ¿Qué se le pregunta al cliente y a qué entidad va cada campo? |
| [`deuda-tecnica/`](deuda-tecnica/README.md) | índice + por área | ¿Qué está parchado o a medias (`DT-n`)? |

Fuera de esta carpeta: `../../../../contracts/` (la forma exacta de cada endpoint). **Por encima de todo** están los documentos del comité en `assets/`.

**Los cuatro identificadores estables** (nunca se reutilizan ni se renumeran): `D-n` decisiones · `P-n` pendientes del comité ·
`DT-n` deuda técnica · `SEG-n` requisitos de seguridad.
