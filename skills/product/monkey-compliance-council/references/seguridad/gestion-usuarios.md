# Requisitos de seguridad — Gestión de usuarios

El alta y la baja de una cuenta del equipo.

Tablero, estados y reglas de uso: [`README.md`](README.md). Cómo funciona el módulo: [`arquitectura/gestion-usuarios/`](../arquitectura/gestion-usuarios/README.md).

| ID | Estado | Requisito | Cómo se hace cumplir | Verificación | Fuente |
|---|---|---|---|---|---|
| **SEG-23** | 🟠 | Un usuario desactivado pierde el acceso y se cierran sus sesiones (CC6.3) | El guard comprueba el estado del usuario en cada petición | `test/autenticacion/autenticacion.e2e-spec.ts`: con el usuario `inactive` su sesión abierta deja de servir y no puede volver a entrar. **Falta el endpoint para desactivarlo (MD-132)** | §5.6 |

*Vienen de las secciones C. del registro anterior.*
