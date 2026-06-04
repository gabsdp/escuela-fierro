# Fierro Escuela — Documentación completa del proyecto

## Resumen ejecutivo
Plataforma de capacitación (LMS) para clientes de Fierro ERP (fierro.com.ar).
Los clientes acceden a cursos en video por producto (Librería, Editorial, etc.).
El equipo de Fierro administra contenido y usuarios desde un panel admin.

---

## Stack tecnológico
- **Framework:** Next.js 16 (App Router, TypeScript, Tailwind CSS 4)
- **Backend:** Supabase (auth, PostgreSQL, storage)
- **Formularios:** React Hook Form + Zod 4
- **Editor rich text:** TipTap
- **Drag & drop:** @dnd-kit (core + sortable)
- **Íconos:** lucide-react

---

## Branding / Diseño
| Elemento | Color |
|---|---|
| Fondo | #FFFFFF |
| Navbar / Headers | #1B3A7A |
| Acento principal (botones CTA) | #F5A623 |
| Acento secundario (links) | #1E6FBF |
| Texto principal | #212121 |
| Texto secundario | #666666 |
| Bordes | #E0E0E0 |
| Tipografía | Roboto (Google Fonts) |

---

## Variables de entorno (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=https://TU_PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_TU_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=sb_secret_TU_SERVICE_ROLE_KEY
```

---

## Estructura de datos (Supabase)

### profiles (extiende auth.users)
| Columna | Tipo | Notas |
|---|---|---|
| id | UUID PK FK → auth.users | |
| email | TEXT | |
| full_name | TEXT | |
| role | TEXT | 'admin' o 'student' |
| created_at | TIMESTAMPTZ | |

### courses
| Columna | Tipo | Notas |
|---|---|---|
| id | UUID PK | |
| title | TEXT | |
| product_key | TEXT | 'libreria', 'editorial', 'fierrogo_libreria', 'fierrogo_editorial', 'distribuidora' |
| description | TEXT | |
| order_index | INTEGER | |
| published | BOOLEAN | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

### user_courses (asignación de cursos a usuarios)
| Columna | Tipo | Notas |
|---|---|---|
| id | UUID PK | |
| user_id | UUID FK → profiles | |
| course_id | UUID FK → courses | |
| assigned_at | TIMESTAMPTZ | |
| assigned_by | UUID FK → profiles | |
| | | UNIQUE(user_id, course_id) |

### modules
| Columna | Tipo | Notas |
|---|---|---|
| id | UUID PK | |
| course_id | UUID FK → courses | |
| title | TEXT | |
| description | TEXT (HTML) | |
| video_url | TEXT | YouTube URL |
| order_index | INTEGER | |
| published | BOOLEAN | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

### module_files
| Columna | Tipo | Notas |
|---|---|---|
| id | UUID PK | |
| module_id | UUID FK → modules | |
| name | TEXT | |
| file_url | TEXT | URL pública en Supabase Storage |
| created_at | TIMESTAMPTZ | |

### user_progress
| Columna | Tipo | Notas |
|---|---|---|
| id | UUID PK | |
| user_id | UUID FK → profiles | |
| module_id | UUID FK → modules | |
| completed | BOOLEAN | |
| completed_at | TIMESTAMPTZ | |
| | | UNIQUE(user_id, module_id) |

### Storage bucket
- Nombre: `attachments` (público)

---

## Estructura del proyecto

```
escuela-fierro/
├── proxy.ts                          # Protección de rutas (Next.js 16)
├── schema.sql                        # SQL completo para Supabase
├── .env.local                        # Variables de entorno
├── middleware.ts                      # (renombrado a proxy.ts en Next 16)
├── lib/
│   ├── supabase/
│   │   ├── client.ts                 # Cliente browser (createBrowserClient)
│   │   ├── server.ts                 # Cliente server + admin (createServerClient)
│   │   └── middleware.ts             # updateSession() para el proxy
│   ├── schemas.ts                    # Zod schemas (login, register, course, module)
│   └── types.ts                      # TypeScript types + PRODUCT_LABELS
├── components/
│   ├── Navbar.tsx                    # Navbar del alumno (logo + logout)
│   ├── AdminNavbar.tsx               # Navbar del admin (logo + nav + logout)
│   ├── LogoutButton.tsx              # Botón de cerrar sesión reutilizable
│   ├── TipTapEditor.tsx              # Editor rich text (bold, italic, headings, lists, links)
│   └── FileUpload.tsx                # Upload de archivos a Supabase Storage
├── scripts/
│   └── create-admin.mjs              # Script para crear admin programáticamente
├── app/
│   ├── globals.css                   # Tailwind + colores Fierro + Roboto
│   ├── layout.tsx                    # Root layout con Roboto font
│   ├── page.tsx                      # Redirige a /admin o /escuela
│   ├── proxy.ts                      # (duplicado? no, el proxy va en raíz)
│   ├── login/
│   │   └── page.tsx                  # Formulario login (email + password)
│   ├── register/
│   │   └── page.tsx                  # Redirige a /login (registro público deshabilitado)
│   ├── setup/
│   │   └── page.tsx                  # Configuración inicial (crear primer admin)
│   ├── auth/
│   │   └── callback/
│   │       └── route.ts              # Callback de auth (OAuth)
│   ├── api/
│   │   └── admin/
│   │       ├── create-user/
│   │       │   └── route.ts          # API: crear usuario (service_role)
│   │       └── set-admin/
│   │           └── route.ts          # API: setear rol admin (service_role)
│   ├── escuela/
│   │   ├── layout.tsx                # Layout con Navbar de alumno
│   │   ├── page.tsx                  # Dashboard: cursos asignados con progreso
│   │   └── [course_id]/
│   │       ├── page.tsx              # Módulos del curso con progreso
│   │       └── [module_id]/
│   │           └── page.tsx          # Video + descripción + archivos + "Marcar completado"
│   └── admin/
│       ├── layout.tsx                # Layout con AdminNavbar
│       ├── page.tsx                  # Listado de cursos + módulos/alumnos + stats
│       ├── cursos/
│       │   ├── nuevo/
│       │   │   └── page.tsx          # Form crear curso (título, producto, descripción)
│       │   └── [id]/
│       │       ├── page.tsx          # Editar curso + drag & drop módulos
│       │       └── modulos/
│       │           ├── nuevo/
│       │           │   └── page.tsx  # Form crear módulo (título, video, TipTap)
│       │           └── [module_id]/
│       │               └── page.tsx  # Editar módulo + FileUpload
│       └── usuarios/
│           ├── page.tsx              # Listado usuarios + buscador
│           ├── nuevo/
│           │   └── page.tsx          # Form crear estudiante (admin crea cuentas)
│           └── [id]/
│               └── page.tsx          # Perfil usuario + asignar/quitar cursos + progreso
```

---

## Roles y flujo

### Admin
- Se crea desde `/setup` (primer admin) o desde Supabase Dashboard
- Accede a `/admin` después del login
- Crea cursos, módulos, y estudiantes
- Asigna cursos a estudiantes desde `/admin/usuarios/[id]`

### Student
- El admin lo crea desde `/admin/usuarios/nuevo`
- No hay registro público
- Solo ve cursos asignados en `/escuela`
- Si no tiene cursos → mensaje "Tu acceso está siendo configurado"

---

## Lógica de protección de rutas (proxy.ts)

### Redirecciones
- No autenticado + `/escuela` o `/admin` → `/login`
- Autenticado + `/login`:
  - Si admin → `/admin`
  - Si student → `/escuela`
- Autenticado + `/`:
  - Si admin → `/admin`
  - Si student → `/escuela`
- Student + `/admin/*` → `/escuela`

### Verificación de rol
El proxy usa `SUPABASE_SERVICE_ROLE_KEY` para consultar `profiles` sin RLS, garantizando que la verificación sea confiable.

---

## RLS (Row Level Security) en Supabase

### profiles
- Usuario ve su propio perfil
- Admin ve todos los perfiles

### courses
- Publicado = true: visible para todos
- Admin: acceso total
- Student: solo ve cursos en `user_courses` con `published = true`

### modules
- Student: solo ve módulos `published = true` de cursos asignados
- Admin: acceso total

### module_files
- Student: solo ve archivos de módulos publicados de cursos asignados
- Admin: acceso total

### user_courses
- Student: solo ve sus propias asignaciones
- Admin: acceso total

### user_progress
- Usuario ve/solo modifica su propio progreso
- Admin: acceso total

### Storage
- Lectura pública
- Solo admin puede subir/eliminar

---

## Usuarios creados en la base de datos

| Email | Rol | Password |
|---|---|---|
| admin@fierro.com.ar | admin | Fierro2024! |
| gabriela.diaz@fierro.com.ar | admin | (la que se usó en setup) |

---

## Schema SQL
El archivo `schema.sql` contiene TODO el SQL necesario para crear tablas, políticas RLS, storage bucket y el trigger `handle_new_user` que crea automáticamente el perfil al registrarse.

Para ejecutarlo: Supabase Dashboard → SQL Editor → pegar contenido → Run.

---

## Comandos útiles
```bash
npm run dev      # Iniciar servidor de desarrollo
npm run build    # Build de producción
npm run lint     # Linting

# Crear admin programáticamente
node scripts/create-admin.mjs
```

---

## Notas técnicas
- Next.js 16 renombró `middleware.ts` a `proxy.ts` con export nombrado `proxy`
- Zod 4 usa `z.infer<T>` (alias de `z.output<T>`)
- @hookform/resolvers/zod soporta Zod 4 nativamente
- TipTap usa `immediatelyRender: false` para evitar errores de hidratación
- El cliente Supabase del proxy usa service_role para omitir RLS en verificaciones de rol
