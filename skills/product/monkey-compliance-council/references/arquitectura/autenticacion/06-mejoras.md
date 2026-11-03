# Autenticación · Mejoras

Responde: **¿qué conviene cambiar y qué riesgo de carga tiene este sistema?** Son propuestas; lo que se apruebe pasa a
`deuda-tecnica/` (`DT-n`). Las cifras son estimaciones hasta que exista la prueba de carga.

| # | Mejora | Prio | Esfuerzo |
|---|---|---|---|
| M1 | Validar la sesión con una sola consulta o una caché corta | A | S |
| M2 | Límite de peticiones compartido entre instancias y por IP en rutas públicas | A | M |
| M3 | Aislar el costo de `bcrypt` ante ráfagas de login | B | S |

## M1 · La sesión cuesta dos transacciones por petición
`ValidateSessionUseCase` lee la sesión y luego el usuario, cada una en su propia transacción con `set_config`, y esto
ocurre antes de **cualquier** caso de uso. A 100 peticiones por segundo son 200 transacciones por segundo que no
aportan al negocio. Salidas: una sola consulta con `JOIN`, o una caché de 10 a 30 s por sesión. La caché retrasa
hasta ese tiempo la revocación: lo decide seguridad (SEG-18; `05-usuarios.md` §5.3 ya habla de una caché de 5 min).

## M2 · El límite vive en la memoria de un proceso
`RateLimitGuard` cuenta en memoria: con dos instancias el tope real se duplica y al reiniciar se pierde. No cubre
las rutas públicas (login, recuperación) porque requiere la IP real detrás del proxy (`DT-37`). Salida: contador
compartido (Redis o el proxy inverso) y límite por IP en login y `password/forgot`.

## M3 · `bcrypt` con costo 12 y ráfagas de login
Cada comparación gasta ~200–300 ms de CPU en el pool de hilos de libuv (4 por defecto), que comparten el DNS y los
archivos. Con 500 logins en 30 s el pool se llena y el resto de la API se retrasa. Salidas: subir `UV_THREADPOOL_SIZE`
y limitar los logins simultáneos; bajar el costo solo si seguridad lo aprueba.

Estudio de carga del Backend completo: [`../plataforma/07-estudio.md`](../plataforma/07-estudio.md).
