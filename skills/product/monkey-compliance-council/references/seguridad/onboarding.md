# Requisitos de seguridad — Onboarding

Lo que el cliente declara y los archivos que sube.

Tablero, estados y reglas de uso: [`README.md`](README.md). Cómo funciona el módulo: [`arquitectura/onboarding/`](../arquitectura/onboarding/README.md).

| ID | Estado | Requisito | Cómo se hace cumplir | Verificación | Fuente |
|---|---|---|---|---|---|
| **SEG-52** | ✅ D60 | Un activo dado de baja no existe para nadie: no se valida, activa, programa, edita ni evalúa (`404`), y sus llaves guardadas se borran; los activos que descubrió se dan de baja con ella | `readAsset`/`findProbeTarget`/`queueExecution` solo ven activos `active`; `retireAsset` anula `encrypted_credentials` | `test/control-tecnico/conexion.e2e-spec.ts` («un activo dado de baja no se puede operar…») | D59, D60 |
| **SEG-53** | ✅ D61 | El servicio solo puede enlazar activos que sean **de esa conexión y de su empresa**; un id ajeno, inventado o de otra conexión se rechaza (`422`), y otra empresa ve `404`. Un activo descubierto no se opera por su cuenta | `setServiceAssets` valida contra los hijos activos de la conexión dentro de `withScope` (RLS); `readAsset`/`findProbeTarget`/`queueExecution` solo ven conexiones | `test/control-tecnico/conexion.e2e-spec.ts` («solo se pueden enlazar activos de ESA conexión…», «los activos descubiertos no son conexiones…») | D61 |

*Vienen de las secciones D. del registro anterior.*
