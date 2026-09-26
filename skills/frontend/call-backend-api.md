---
id: call-backend-api
name: Llamar a un endpoint del backend
description: Patrón exacto para que un servicio de feature llame al backend (Monkey-GRC/Backend) vía HttpClient, con el tipo de respuesta compartido y sin tocar auth manualmente.
type: skill
applies_to: frontend
---

# Skill: Llamar a un endpoint del backend

> ⚠️ **Son dos apps Angular distintas y NO son gemelas.** Esta skill describe `Frontend`
> (Monkey Admin). `Frontend-Platform` (la plataforma del cliente) diverge en lo siguiente y
> hay que comprobarlo antes de aplicar cualquier patrón de aquí:
>
> | | `Frontend` | `Frontend-Platform` |
> |---|---|---|
> | Features hoy | `auth`, `common`, `users` | `assets`, `auth` |
> | Estructura de feature | `models/` + `services/` + `presentation/` | `domain/` + `presentation/` |
> | `core/` y `shared/` | `core/{guards,interceptors,services}`, `shared/models` | `core/domain/*`, `shared/domain/*` |
> | `ApiResponse<T>` | `@shared/models/api-response.model` | `@shared/domain/models/api-response.model` |
> | i18n | ngx-translate + `public/i18n/{en,es}` | **no tiene i18n instalada** |
> | Interceptores | `auth.interceptor`, `error-handler.interceptor` | `credentials.interceptor`, `tenant-credentials.interceptor`; **sin manejo global de errores** |
> | Syncfusion | sí | no |
>
> Lo común a las dos: Angular 20 standalone sin `NgModule`, TypeScript estricto, Tailwind v4,
> sin librería de estado, y los path aliases `@core/*`, `@features/*`, `@shared/*`, `@config/*`,
> `@environments/*`.

## Contexto

- Base URL: `environment.apiUrl` (`@environments/environment`, hoy
  `http://localhost:3000/v1` en desarrollo, en las dos apps) — nunca hardcodear la URL en el
  servicio.
- Auth: cookie httpOnly, `withCredentials: true`. El interceptor global
  (`core/interceptors/auth.interceptor.ts`) ya la adjunta junto con el header
  `Accept-Language` (leído de `localStorage('lang')`). Un servicio de
  feature **no** maneja tokens ni headers de auth manualmente.
- Errores: en `Frontend`, `core/interceptors/error-handler.interceptor.ts` ya intercepta
  errores HTTP globalmente. **`Frontend-Platform` no tiene ese interceptor**: ahí el manejo
  de error es responsabilidad del servicio o del componente — el servicio no necesita un `catchError` genérico
  para eso, solo para lógica específica del caso de uso si aplica.
- Forma de respuesta: todo endpoint del backend responde envuelto en
  `ResponseDto` (`{ statusCode, message, data }` — ver el backend). En el
  frontend esto se tipa con `ApiResponse<T>` de
  `@shared/models/api-response.model` — en `Frontend-Platform` es
  `@shared/domain/models/api-response.model`.

## Patrón

```typescript
// src/app/features/<nombre>/services/<entidad>.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { ApiResponse } from '@shared/models/api-response.model';
import { <Entidad> } from '../models/<entidad>.model';

@Injectable({ providedIn: 'root' })
export class <Entidad>Service {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/<recurso>`;

  getAll(): Observable<ApiResponse<<Entidad>[]>> {
    return this.http.get<ApiResponse<<Entidad>[]>>(this.baseUrl);
  }

  create(payload: Create<Entidad>Input): Observable<ApiResponse<<Entidad>>> {
    return this.http.post<ApiResponse<<Entidad>>>(this.baseUrl, payload);
  }
}
```

## Restricciones

- No crear un `HttpClient` nuevo ni un interceptor propio por feature — ya
  está configurado globalmente en `app.config.ts`
  (`provideHttpClient(withInterceptors([authInterceptor, errorHandlerInterceptor]))`).
- No leer ni escribir cookies/tokens manualmente desde el servicio.
- Si el endpoint todavía no existe en el backend, no lo simules con datos
  fijos permanentes — repórtalo al tech-lead (puede requerir coordinar con
  `backend-senior`).
- Tipar siempre la respuesta con `ApiResponse<T>`, no `any`.
