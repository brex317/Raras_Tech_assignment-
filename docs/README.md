# Organization Asset Management System

A full-stack web application for managing organizational assets, built as part of the RARAS Technologies Full Stack Developer Assessment.

## Project Overview

This system enables organizations to manage their assets, organizational units, and related documentation through a modern, secure web interface. It features role-based access control, hierarchical organization management, and comprehensive asset tracking with document attachments.

## Technologies Used

| Layer | Technology |
|---|---|
| **Backend** | ASP.NET Core 8.0 Web API (C#) |
| **Frontend** | Angular 21 with Angular Material + Tailwind CSS 4 |
| **Database** | PostgreSQL 18 |
| **Architecture** | Clean Architecture (Domain → Application → Infrastructure → API) |
| **Authentication** | JWT Bearer Tokens |
| **Authorization** | Role-based (Viewer, Manager, Administrator) |
| **ORM** | Entity Framework Core 8 with Npgsql |
| **Validation** | FluentValidation |
| **Mapping** | AutoMapper |
| **Password Hashing** | BCrypt.NET |

## Architecture Overview

```
backend/
├── src/
│   ├── Domain/          # Entities, enums, interfaces (no dependencies)
│   ├── Application/     # DTOs, services, validators, interfaces
│   ├── Infrastructure/  # EF Core, repositories, JWT, file storage
│   └── API/             # Controllers, middleware, Program.cs
└── tests/

frontend/
└── src/
    └── app/
        ├── core/        # Services, guards, interceptors, models
        ├── features/    # Auth, dashboard, assets, org-units
        └── shared/      # Layout, confirm-dialog, org-unit-selector

database/
└── schema.sql           # Generated SQL schema from EF Core migrations

docs/
└── README.md            # This file
```

### Clean Architecture Layers

- **Domain Layer**: Contains entity classes (`Asset`, `User`, `Role`, `OrganizationUnit`, etc.), enums (`AssetStatus`, `AssetChangeType`, `DocumentType`), and repository interfaces. Zero external dependencies.
- **Application Layer**: Business logic services, DTOs, FluentValidation validators, AutoMapper profiles, and service interfaces. Depends only on Domain.
- **Infrastructure Layer**: EF Core DbContext, repository implementations, JWT token service, file storage service, BCrypt password hasher, database migrations and seed data. Implements interfaces from Domain and Application.
- **API Layer**: ASP.NET Core controllers, exception handling middleware, JWT authentication configuration, CORS policy, Swagger documentation. Entry point of the application.

## Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js](https://nodejs.org/) (v22.x or later)
- [PostgreSQL](https://www.postgresql.org/) (v15+ recommended; v18 used in development)
- [Angular CLI](https://angular.io/cli) (installed via npm)

## Database Setup

1. **Install PostgreSQL** and ensure the service is running.

2. **Configure the connection string** in `backend/src/API/appsettings.json`:
   ```json
   {
     "ConnectionStrings": {
       "DefaultConnection": "Host=localhost;Port=5432;Database=AssetManagementDb;Username=postgres;Password=YOUR_PASSWORD"
     }
   }
   ```

3. The application **automatically creates the database and runs migrations** on startup via `SeedData.SeedAsync()`.

## Migration Instructions

The project uses EF Core Code-First migrations. The initial migration is already included.

```bash
# Install EF Core CLI tool (if not installed)
dotnet tool install --global dotnet-ef

# List existing migrations
dotnet ef migrations list --project src/Infrastructure --startup-project src/API

# Apply migrations manually (optional — the app does this on startup)
dotnet ef database update --project src/Infrastructure --startup-project src/API

# Generate SQL script (for reference)
dotnet ef migrations script --project src/Infrastructure --startup-project src/API -o ../database/schema.sql
```

## How to Run Backend

```bash
cd backend

# Restore packages
dotnet restore

# Build
dotnet build

# Run (starts on http://localhost:5077 by default)
dotnet run --project src/API

# Or specify a custom URL
dotnet run --project src/API --urls "http://localhost:5165"
```

Swagger UI is available at: `http://localhost:5077/swagger`

## How to Run Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start dev server (runs on http://localhost:4200)
npm start
```

> **Note:** On Windows, if PowerShell blocks npm scripts, use `cmd /c "npm install"` and `cmd /c "npm start"` instead.

The Angular app connects to the backend at `http://localhost:5077/api` (configurable in `src/app/core/services/`).

## Sample Login Accounts

The database is seeded with the following test accounts:

| Email | Password | Role | Organization Unit |
|---|---|---|---|
| `admin@raras.com` | `Admin@123` | **Administrator** | RARAS Technologies HQ |
| `manager@raras.com` | `Manager@123` | **Manager** | Engineering Department |
| `viewer@raras.com` | `Viewer@123` | **Viewer** | Development Team |

## Role Permissions

| Action | Viewer | Manager | Administrator |
|---|:---:|:---:|:---:|
| View assets | ✅ | ✅ | ✅ |
| View organization units | ✅ | ✅ | ✅ |
| View/download documents | ✅ | ✅ | ✅ |
| Create/edit assets | ❌ | ✅ | ✅ |
| Assign assets to org units | ❌ | ✅ | ✅ |
| Upload/delete documents | ❌ | ✅ | ✅ |
| Create/edit organization units | ❌ | ❌ | ✅ |

## Major Design Decisions

### Materialized Path for Organization Hierarchy
Organization units use a `Path` field (e.g., `/{rootId}/{parentId}/{childId}/`) along with a `Level` integer. This enables:
- Efficient subtree queries using `LIKE` on the path
- Circular reference prevention by checking if a potential parent's path contains the current node's ID
- Simple hierarchy traversal without recursive queries

### JWT Authentication with localStorage
Tokens are stored in `localStorage` for simplicity (acceptable for an assessment). An `HttpInterceptor` automatically attaches the token to all API requests. For production, HTTP-only cookies or a more secure token storage mechanism would be recommended.

### Local File Storage with Abstraction
Documents are stored on the local filesystem in an `uploads/` directory. The `IFileStorageService` interface allows easy swapping to cloud storage (Azure Blob, S3, etc.) without changing business logic.

### Database Seeding on Startup
The application automatically runs pending migrations and seeds initial data (roles, users, organization hierarchy, asset categories, sample assets) on startup. This ensures a fresh database is immediately usable.

### Angular Standalone Components
All Angular components use the standalone pattern (no NgModules). Feature routes are lazy-loaded for optimal bundle sizes.

## Design Assumptions

- Each user belongs to exactly one organization unit and has exactly one role.
- Assets must always reference a valid organization unit.
- Organization units form a strict tree (each node has at most one parent; the root has no parent).
- File uploads are validated for type (PDF, DOC, DOCX, XLS, XLSX, JPG, JPEG, PNG, GIF) and size (max 10MB).
- Asset tags must be unique across the system.
- The system supports single-tenant usage (one organization per deployment).
