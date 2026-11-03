# Aislamiento multi-tenant · Flujos

Responde: **¿qué pasa exactamente en una consulta, y qué pasa si alguien se equivoca?**

## 1 · Una consulta normal

```mermaid
sequenceDiagram
    autonumber
    participant UC as Caso de uso
    participant R as Repositorio Prisma
    participant PG as PostgreSQL
    UC->>R: método(scope, …) con el TenantScope del Principal
    R->>PG: BEGIN
    R->>PG: set_config('app.tenant_id', …, true)
    R->>PG: set_config('app.user_id', …, true)
    R->>PG: set_config('app.user_role', …, true)
    R->>PG: SELECT … (sin WHERE tenant_id)
    PG->>PG: la política RLS añade el filtro por app.tenant_id
    PG-->>R: solo las filas de esta empresa
    R->>PG: COMMIT (las tres variables desaparecen)
```

La consulta **no lleva el filtro escrito**. Lo pone la base. Eso es lo que hace que olvidarlo sea imposible.

## 2 · Los tres errores posibles y qué pasa con cada uno

```mermaid
flowchart TB
    e1["Consultar fuera de withScope"] --> r1["app.tenant_id vacío:<br/>la política no encaja y no devuelve filas"]
    e2["Pedir un id de otra empresa"] --> r2["RLS no lo encuentra:<br/>se responde 404, no 403"]
    e3["Escribir una FK a un padre de otra empresa"] --> r3["⚠️ RLS NO lo impide:<br/>la validación de FK ignora las políticas"]
```

El tercero es el único peligroso, y por eso hay una regla de aplicación: **antes de escribir una fila con una FK a
otra tabla de tenant, se lee el padre con el cliente ya sujeto a RLS**. Si no lo ve, no es suyo. La lista completa
de reglas que RLS no puede imponer está en `datos/modelo/04-monkey-admin.md` §4.4.

## 3 · `404` y no `403`

Un recurso de **otra empresa** responde `404`: decir `403` revelaría que existe. Un recurso **de la propia empresa**
que no le corresponde a ese usuario sí responde `403` (`contracts/conventions.md`). La diferencia es deliberada y la
aplican los dos módulos de permisos: este y [Roles y permisos](../roles-permisos/README.md).

## 4 · El rastro también está aislado

`audit_logs` y `compliance_events` llevan RLS: el rastro de una empresa no se lee desde otra (SEG-34). Con una
particularidad: el rastro se escribe **sin `RETURNING`**, porque una acción de plataforma sin tenant no pasaría la
política de lectura de la fila que acaba de insertar.

## 5 · Cómo se prueba

La prueba real no es un test unitario: es conectarse como `monkey_app` sin fijar la empresa y comprobar que no se ve
nada.

```sql
-- sin empresa declarada: 0 filas
select count(*) from tenant.client_controls;
-- con empresa declarada: las suyas
select set_config('app.tenant_id', '<uuid>', false);
select count(*) from tenant.client_controls;
```

`npm run test:e2e` hace lo mismo desde la API: crea dos empresas y comprueba que ninguna ve a la otra.

## Cómo verificarlo

`Backend/test/` (pruebas de aislamiento) y `datos/schema-implementacion.md` §5.
