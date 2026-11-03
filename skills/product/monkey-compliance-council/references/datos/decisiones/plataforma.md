# Decisiones — Plataforma

Por qué Plataforma es como es. **Se consulta para reabrir, no para construir**: lo vigente está en [`arquitectura/plataforma/`](../../arquitectura/plataforma/README.md) y en `datos/modelo/`. Índice de todas las decisiones: [`README.md`](README.md).

## D49 · Las peticiones esperan hasta 10 s por una conexión del pool

`PrismaService.withScope` fija `maxWait` en 10 s (antes 2 s por defecto). Con la base remota a ~200 ms por consulta, una ráfaga
de peticiones paralelas agotaba la espera y el cliente recibía `500 INTERNAL_ERROR` («Unable to start a transaction in the
given time») aunque la base estuviera sana; ocurría hasta en los endpoints públicos de catálogos. Ahora se encolan. No cambia el
límite de duración de la transacción (`timeoutMs`).

**Fuente:** hallazgo de las pruebas de navegador, 2026-10-02.

---
