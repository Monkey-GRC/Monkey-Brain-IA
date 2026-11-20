# Deuda técnica — Autenticación

Parches vigentes de [Autenticación](../arquitectura/autenticacion/README.md). Tablero y reglas: [`README.md`](README.md).

## Registro de empresa, contrato de marcos (D47) y activación de la cuenta (D51)

### DT-37 · El límite de intentos con la clave de acceso vive en la memoria de la instancia

🟠 Importante

- **Qué está parchado:** 10 fallos por dirección cada 15 min, compartido por `redeem/lookup` y `redeem`; con varias réplicas el tope real es por réplica y se reinicia al reiniciar. La IP real tras el proxy ya se resuelve (`TRUST_PROXY`, MD-485): en el despliegue debe valer `2` (Cloudflare + NPM); si queda vacío, `req.ip` es el del proxy y todos comparten un solo cajón
- **Por qué:** No hay Redis ni un limitador común en el backend
- **Qué lo cierra:** Un limitador compartido **en Redis** (D124) para todos los endpoints públicos (la parte de `trust proxy` se cerró en MD-485; falta poner `TRUST_PROXY=2` en el despliegue). Ticket: **MD-218**
- **También aplica a (SEG-19):** el límite general por usuario y por empresa (`RateLimitGuard`) vive igual en la memoria de la instancia; las rutas públicas (ingreso, «olvidé mi contraseña») no tienen tope por dirección hasta que se aplique el limitador por dirección (la IP real ya está disponible con `TRUST_PROXY`), porque sin él todos los clientes detrás del proxy compartirían un solo cajón

## Carga del login y de la sesión (`arquitectura/autenticacion/06-mejoras.md`, D124)

### DT-111 · `bcrypt` sin tope de comparaciones simultáneas ante ráfagas de login

🟡 Mejora

- **Qué está parchado:** Cada comparación con costo 12 usa ~200–300 ms del pool de libuv (4 hilos por defecto, compartido con DNS y archivos); una ráfaga de logins retrasa el resto de la API (M3)
- **Por qué:** Se dejó el pool por defecto y sin límite de concurrencia
- **Qué lo cierra:** `UV_THREADPOOL_SIZE` mayor y un semáforo de comparaciones por instancia; el costo no cambia (D124). Ticket: **MD-218**
