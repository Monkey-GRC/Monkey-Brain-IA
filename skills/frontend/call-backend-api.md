---
id: call-backend-api
name: Llamar a un endpoint del backend
description: Patrón exacto para que un servicio de feature llame al backend (monkey-360/backend) vía HttpClient, con el tipo de respuesta compartido y sin tocar auth manualmente.
type: skill
applies_to: frontend
---

# Skill: Llamar a un endpoint del backend

## Contexto

- Base URL: `environment.apiUrl` (`@environments/environment`, hoy
  `http://localhost:3001/v1` en desarrollo) — nunca hardcodear la URL en el
  servicio.
- Auth: cookie httpOnly, `withCredentials: true`. El interceptor global
  (`core/interceptors/auth.interceptor.ts`) ya la adjunta junto con el header
  `Accept-Language` (leído de `localStorage('lang')`). Un servicio de
  feature **no** maneja tokens ni headers de auth manualmente.
- Errores: `core/interceptors/error-handler.interceptor.ts` ya intercepta
  errores HTTP globalmente — el servicio no necesita un `catchError` genérico
  para eso, solo para lógica específica del caso de uso si aplica.
- Forma de respuesta: todo endpoint del backend responde envuelto en
  `ResponseDto` (`{ statusCode, message, data }` — ver el backend). En el
  frontend esto se tipa con `ApiResponse<T>` de
  `@shared/models/api-response.model`.

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
