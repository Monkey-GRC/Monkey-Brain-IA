# Enums — Empresas

> Índice de todos los enums: [`enums.md`](../enums.md). Por el cable viaja el **valor**; la etiqueta (es/en) la resuelve i18n. Formato: [`README.md`](../README.md#formato-de-un-enum).

## `isolation_strategy`
**Columna:** `companies.isolation_strategy` · **Quién lo fija:** `admin_monkey` al registrar la empresa. No se revierte sin migrar datos.

| Valor | Etiqueta (es) |
|---|---|
| `shared` | Compartida (RLS) |
| `dedicated` | Dedicada |

## `company_status`
**Columna:** `companies.status`

| Valor | Etiqueta (es) | Qué significa |
|---|---|---|
| `active` | Activa | |
| `suspended` | Suspendida | |
| `deactivated` | Archivada | Sin acceso hasta el borrado definitivo; solo `admin_monkey` (D97) |

## `company_deactivation_reason`
**Dónde se usa:** motivo al archivar una empresa (D97).

| Valor | Etiqueta (es) |
|---|---|
| `non_payment` | Falta de pago |
| `client_request` | El cliente ya no desea el servicio |
| `other` | Otro |

## `access_key_status`
**Columna:** `access_keys.status` · **También es el estado de los códigos de activación de cuentas (D95).**

| Valor | Etiqueta (es) |
|---|---|
| `pending` | Pendiente |
| `used` | Usada |
| `expired` | Expirada |
| `revoked` | Revocada |

## `access_key_delivery_status`
**Columna:** `access_key.delivery_status` en la respuesta del registro y del reenvío (D99). **No se guarda en la base.**

| Valor | Etiqueta (es) | Qué significa |
|---|---|---|
| `sent` | Enviada | El servicio de correo aceptó el mensaje |
| `failed` | No se pudo enviar | |
