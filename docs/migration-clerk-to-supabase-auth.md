# Migración de Clerk a Supabase Auth

## Estado Actual

Clerk es el sistema de autenticación actual. Supabase almacena los datos de usuario con un `clerk_id` como referencia externa. Cada vez que se necesita info del usuario, se hace: Clerk → `clerk_id` → Supabase query.

### Dependencias de Clerk
- `@clerk/astro` (v2.16.13)
- `@clerk/clerk-sdk-node` (v4.13.23, dev)
- `svix` (v1.84.1, para verificar webhooks de Clerk)

### Variables de Entorno Clerk
- `PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `CLERK_WEBHOOK_SECRET`

---

## Archivos Afectados (42 archivos)

### Configuración
| Archivo | Qué hace con Clerk |
|---------|-------------------|
| `astro.config.mjs` | Registra integración `clerk()` con branding/appearance |
| `src/middleware.ts` | `clerkMiddleware` protege rutas `/account`, `/admin`, `/api/user` |
| `src/lib/clerk/client.ts` | Utilidades: `getClerkUser()`, `updateUserMetadata()`, `getUserRole()` |

### Páginas de Auth
| Archivo | Qué hace con Clerk |
|---------|-------------------|
| `src/pages/sign-in.astro` | Componente `<SignIn>` de Clerk |
| `src/pages/sign-up.astro` | Componente `<SignUp>` de Clerk |

### Webhook
| Archivo | Qué hace con Clerk |
|---------|-------------------|
| `src/pages/api/webhooks/clerk.ts` | Sincroniza usuarios Clerk → Supabase (user.created, user.updated, user.deleted) |

### Navbar (React)
| Archivo | Qué hace con Clerk |
|---------|-------------------|
| `src/components/layout/Navbar.tsx` | `<SignedIn>`, `<SignedOut>`, `<UserButton>`, `<SignInButton>` |

### Páginas de Cuenta (5 archivos)
| Archivo | Patrón |
|---------|--------|
| `src/pages/account/index.astro` | `Astro.locals.auth()` → `clerk_id` → Supabase query |
| `src/pages/account/orders.astro` | Igual |
| `src/pages/account/tickets.astro` | Igual |
| `src/pages/account/certificates.astro` | Igual |
| `src/pages/account/credits.astro` | Igual |
| `src/pages/account/seminars.astro` | Igual |

### Páginas de Admin (18+ archivos)
Todas siguen el mismo patrón:
```typescript
const auth = Astro.locals.auth();
userId = auth?.userId;
// Query Supabase by clerk_id to check role
const { data } = await supabaseAdmin.from('users').select('role').eq('clerk_id', userId).single();
isAdmin = data?.role === 'admin';
```

Archivos:
- `src/pages/admin/index.astro`
- `src/pages/admin/events/index.astro`, `[id].astro`, `new.astro`
- `src/pages/admin/seminars/index.astro`, `[id].astro`, `sessions.astro`, `attendance.astro`, `registrations.astro`, `certificates.astro`, `makeup-requests.astro`
- `src/pages/admin/tickets/index.astro`
- `src/pages/admin/ticket-types/index.astro`
- `src/pages/admin/speakers/index.astro`
- `src/pages/admin/certificates/index.astro`
- `src/pages/admin/certificate-templates/index.astro`, `[id]/edit.astro`
- `src/pages/admin/credits/index.astro`
- `src/pages/admin/attendance/index.astro`
- `src/pages/admin/reports/index.astro`
- `src/pages/admin/settings/index.astro`, `email.astro`
- `src/pages/admin/waitlist/index.astro`
- `src/pages/admin/cart-recovery/index.astro`

### API Routes
| Archivo | Patrón |
|---------|--------|
| `src/pages/api/user/seminars.ts` | `clerkUserId` desde header/query → `getUserByClerkId()` |
| `src/pages/api/seminars/register.ts` | `clerkUserId` en body → `getUserByClerkId()` |
| `src/pages/api/seminars/makeup-request.ts` | Similar |

### Queries
| Archivo | Qué hace |
|---------|----------|
| `src/lib/supabase/queries.ts` | `getUserByClerkId(clerkId)` → query `.eq('clerk_id', clerkId)` |
| `src/types/database.ts` | Tipo `User` con campo `clerk_id: string` |

---

## Plan de Migración

### Fase 1: Configurar Supabase Auth
- [ ] Habilitar email/password auth en Supabase Dashboard
- [ ] Configurar redirect URLs en Supabase Auth settings
- [ ] Crear helper `src/lib/supabase/auth.ts` con funciones de auth (signIn, signUp, signOut, getSession, getUser)
- [ ] Crear middleware de Supabase Auth que reemplace `clerkMiddleware`

### Fase 2: Migrar usuarios existentes
- [ ] Script para crear usuarios en Supabase Auth con los emails existentes en la tabla `users`
- [ ] Agregar columna `supabase_auth_id` a la tabla `users` (o reutilizar el campo `id` si coincide)
- [ ] Mapear cada usuario existente con su nuevo auth ID

### Fase 3: Reemplazar páginas de Auth
- [ ] Crear nuevas páginas `sign-in.astro` y `sign-up.astro` con formularios propios (o componentes React)
- [ ] Implementar flujo de "forgot password" con Supabase Auth
- [ ] Estilizar con los mismos colores de marca (navy #13326A)

### Fase 4: Actualizar Middleware
- [ ] Reemplazar `clerkMiddleware` en `src/middleware.ts`
- [ ] Nuevo middleware que lea session cookie de Supabase
- [ ] Misma lógica de protección de rutas (`/account`, `/admin`, `/api/user`)
- [ ] Verificar rol de admin desde la tabla `users` usando el auth ID

### Fase 5: Actualizar Navbar
- [ ] Reemplazar componentes de Clerk (`SignedIn`, `SignedOut`, `UserButton`) con lógica propia
- [ ] Componente React que use Supabase Auth para estado de sesión
- [ ] Dropdown de usuario con sign-out

### Fase 6: Actualizar páginas protegidas (account + admin)
- [ ] Reemplazar patrón `Astro.locals.auth()` → Supabase session
- [ ] Cambiar queries de `.eq('clerk_id', userId)` → `.eq('supabase_auth_id', userId)` (o similar)
- [ ] ~23 archivos con el mismo patrón — se puede hacer con buscar/reemplazar

### Fase 7: Actualizar API routes
- [ ] Cambiar autenticación en headers de `clerkUserId` → Supabase session token
- [ ] Actualizar `src/pages/api/user/seminars.ts`
- [ ] Actualizar `src/pages/api/seminars/register.ts`
- [ ] Actualizar `src/pages/api/seminars/makeup-request.ts`

### Fase 8: Limpieza
- [ ] Eliminar `src/lib/clerk/client.ts`
- [ ] Eliminar `src/pages/api/webhooks/clerk.ts`
- [ ] Remover integración `clerk()` de `astro.config.mjs`
- [ ] Desinstalar `@clerk/astro`, `@clerk/clerk-sdk-node`, `svix`
- [ ] Eliminar variables de entorno de Clerk del `.env`
- [ ] Actualizar `src/types/database.ts` — remover/renombrar campo `clerk_id`
- [ ] Limpiar `src/lib/supabase/queries.ts` — remover `getUserByClerkId()`

---

## Decisiones de Diseño

### Identificación de usuarios
**Opción A (recomendada):** Usar el UUID de Supabase Auth como ID principal. Hacer que el `id` de la tabla `users` sea el mismo que `auth.users.id` de Supabase Auth.

**Opción B:** Mantener IDs separados con columna `supabase_auth_id`.

### Formularios de login
**Opción A (recomendada):** Formularios React personalizados que llamen a `supabase.auth.signInWithPassword()` — control total del diseño.

**Opción B:** Usar Supabase Auth UI (componente pre-hecho, menos personalizable).

### Protección de rutas
El middleware leerá la cookie de sesión de Supabase, validará el JWT, y pondrá el user en `Astro.locals` para que todas las páginas lo usen.

---

## Riesgos
- Los usuarios actuales deberán hacer "forgot password" la primera vez (Clerk no expone passwords)
- Si hay usuarios con social login (Google), hay que configurarlo también en Supabase
- Downtime mínimo durante la migración en producción
