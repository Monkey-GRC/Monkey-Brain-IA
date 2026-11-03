# Deuda técnica — Autenticación

Parches vigentes de [Autenticación](../arquitectura/autenticacion/README.md). Tablero y reglas: [`README.md`](README.md).

## Registro de empresa, contrato de marcos (D47) y activación de la cuenta (D51)

### DT-37 · El límite de intentos con la clave de acceso vive en la memoria de la instancia

🟠 Importante

- **Qué está parchado:** 10 fallos por dirección cada 15 min, compartido por `redeem/lookup` y `redeem`; con varias réplicas el tope real es por réplica y se reinicia al reiniciar. Tras un proxy, `req.ip` es el del proxy salvo que se configure `trust proxy`
- **Por qué:** No hay Redis ni un limitador común en el backend
- **Qué lo cierra:** Un limitador compartido (Redis o la base) para todos los endpoints públicos, y revisar `trust proxy` en el despliegue
- **También aplica a (SEG-19):** el límite general por usuario y por empresa (`RateLimitGuard`) vive igual en la memoria de la instancia; las rutas públicas (ingreso, «olvidé mi contraseña») no tienen tope por dirección hasta que se configure `trust proxy`, porque sin él todos los clientes detrás del proxy compartirían un solo cajón
