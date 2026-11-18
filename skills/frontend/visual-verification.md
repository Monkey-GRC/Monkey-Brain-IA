# Verificación visual: Rod la revisa en su propia app

`qa`, `frontend-senior` y `frontend-design` **no ven el navegador**: un PASS por specs, build y greps no prueba que una pantalla
se vea como se pidió. Quien la mira es **Rod, directamente en su app** (Platform en `:4200`, Admin en `:4201`). **No se sacan
capturas** (Rod no las usa; decisión del 2026-11-18, MD-217): ni con Chrome sin interfaz ni con la extensión, ni para él ni
«para comprobar».

## 1. Que el servidor de Rod sirva el build nuevo

Antes de decirle «ya está», `curl` al `main.js` de `:4200` (Platform) y `:4201` (Admin) y busca una clase o un texto nuevo.
Si no aparece, su `ng serve` está sirviendo un bundle viejo: díselo (2026-11-10: el login de Platform se veía distinto al del
Admin con todo en PASS por eso). Si el cambio necesita una migración, ya debe estar aplicada a su base (`backend-senior`).

## 2. Qué se le entrega a Rod

- **La lista de pantallas que debe mirar**, cada una con su ruta y cómo llegar al estado (p. ej. «`/signin` → contraseña →
  pantalla del código», «`/ajustes/seguridad/dispositivos`»), en **las dos apps** si el cambio toca el design system, y el
  recordatorio de mirarla en claro y oscuro y en es y en.
- Lo que cambió en cada una, en 1–2 líneas, y lo que se decidió sin preguntarle.
- La pregunta explícita «¿apruebas el estilo?», **pantalla por pantalla**: una aprobación cubre solo lo que Rod vio. Los comandos
  de commit se entregan **solo cuando Rod los pide**, nunca como siguiente paso de una aprobación (`monkey-dev-flow`, paso 9).
- No digas «idéntico» o «unificado» solo por el diff de archivos.
- A los agentes, criterios de aceptación visibles, y que digan qué no pudieron comprobar sin navegador.
