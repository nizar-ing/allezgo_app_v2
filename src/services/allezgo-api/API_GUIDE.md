# API CRUD Operations by Resource

Base URL example: `https://api.allezgoo.com`

> Note: This document reflects routes currently implemented in controllers and their DTO/entity contracts.

## Common notes

- `:id` route params are passed as strings and converted to numbers in controllers (`+id`).
- No endpoints currently declare query parameters in their controllers/DTOs.
- Validation decorators come from DTO classes and apply when global validation pipe is enabled.

## Destinations (`/api/destinations`)

### DTO contracts

- `CreateDestinationDto`
    - `name: string`
    - `image_url: string`
    - `mainCities: string[]`
    - `duration: { days: number; nights: number }`
    - `departureFrom: string`
    - `airline: string`
    - `flightDetails: Record<string, any>`
    - `highlights: string[]`
    - `mealPlan: string`
    - `included: string[]`
    - `notIncluded?: string[]`
    - `visaInfo?: Record<string, any> | string`
    - `departureDates?: Record<string, any>[]`
    - `pricing: Record<string, any>`
    - `keyAttractions: string[]`
- `UpdateDestinationDto`: `Partial<CreateDestinationDto>`

### Endpoint details

| Operation | Method | URL | Status | Body (request type) | Path params | Query params | Response type |
|---|---|---|---|---|---|---|---|
| Create | `POST` | `/api/destinations` | Not implemented (commented in controller) | `CreateDestinationDto` (expected) | None | None | `Destination` (expected) |
| Read (list) | `GET` | `/api/destinations` | Implemented | None | None | None | `Destination[]` |
| Read (single) | `GET` | `/api/destinations/:id` | Implemented | None | `id: number` | None | `Destination` |
| Update | `PUT` | `/api/destinations/:id` | Not implemented (commented in controller) | `UpdateDestinationDto` (expected) | `id: number` | None | `Destination` (expected) |
| Delete | `DELETE` | `/api/destinations/:id` | Not implemented (commented in controller) | None | `id: number` | None | `void` / deleted entity (expected) |

`Destination` response shape includes:
`id`, `name`, `image_url`, `mainCities`, `duration`, `departureFrom`, `airline`, `flightDetails`, `highlights`, `mealPlan`, `included`, `notIncluded`, `visaInfo`, `departureDates`, `pricing`, `keyAttractions`, plus related `accommodations[]` and `itineraries[]` on read endpoints.

## E-Visas (`/api/e-visas`)

### DTO contracts

- `CreateEVisaDto`
    - `country: string`
    - `flagUrl: string`
    - `price?: number`
    - `duration?: string`
    - `durationMode?: { duration: string[]; price: number[]; demandeOccurrence?: string[] }`
    - `processingTime: string`
    - `description?: string | string[]`
    - `requirements: string[]`
    - `requirementsByDemande?: Record<string, string[]>`
    - `constraints: string`
- `UpdateEVisaDto`: `Partial<CreateEVisaDto>`

### Endpoint details

| Operation | Method | URL | Status | Body (request type) | Path params | Query params | Response type |
|---|---|---|---|---|---|---|---|
| Create | `POST` | `/api/e-visas` | Implemented | `CreateEVisaDto` | None | None | `EVisa` |
| Read (list) | `GET` | `/api/e-visas` | Implemented | None | None | None | `EVisa[]` |
| Read (single) | `GET` | `/api/e-visas/:id` | Implemented | None | `id: number` | None | `EVisa` |
| Update | `PATCH` | `/api/e-visas/:id` | Implemented | `UpdateEVisaDto` | `id: number` | None | `EVisa` |
| Delete | `DELETE` | `/api/e-visas/:id` | Implemented | None | `id: number` | None | `void` |

`EVisa` response shape includes:
`id`, `country`, `flagUrl`, `price`, `duration`, `durationMode`, `processingTime`, `description`, `requirements`, `requirementsByDemande`, `constraints`.

## Testimonials (`/api/testimonials`)

### DTO contracts

- `CreateTestimonialDto`
    - `imageUrl: string`
    - `name: string`
    - `citation: string`
- `UpdateTestimonialDto`: `Partial<CreateTestimonialDto>`

### Endpoint details

| Operation | Method | URL | Status | Body (request type) | Path params | Query params | Response type |
|---|---|---|---|---|---|---|---|
| Create | `POST` | `/api/testimonials` | Implemented | `CreateTestimonialDto` | None | None | `Testimonial` |
| Read (list) | `GET` | `/api/testimonials` | Implemented | None | None | None | `Testimonial[]` |
| Read (single) | `GET` | `/api/testimonials/:id` | Implemented | None | `id: number` | None | `Testimonial` |
| Update | `PATCH` | `/api/testimonials/:id` | Implemented | `UpdateTestimonialDto` | `id: number` | None | `Testimonial` |
| Delete | `DELETE` | `/api/testimonials/:id` | Implemented | None | `id: number` | None | `Testimonial` (removed entity) |

`Testimonial` response shape includes:
`id`, `imageUrl`, `name`, `citation`.

## Users (`/users`)

### DTO contracts

- `CreateUserDto`
    - `email: string` (email format)
    - `password: string` (min length 6)
    - `firstName: string`
    - `lastName: string`
- `UpdateUserDto`: `Partial<CreateUserDto>`

### Endpoint details

| Operation | Method | URL | Status | Body (request type) | Path params | Query params | Response type |
|---|---|---|---|---|---|---|---|
| Create | `POST` | `/users` | Implemented | `CreateUserDto` | None | None | `User` (contains hashed password) |
| Read (list) | `GET` | `/users` | Implemented | None | None | None | `User[]` |
| Read (single) | `GET` | `/users/:id` | Implemented | None | `id: number` | None | `User` |
| Update | `PATCH` | `/users/:id` | Implemented | `UpdateUserDto` | `id: number` | None | `User` |
| Delete | `DELETE` | `/users/:id` | Implemented | None | `id: number` | None | `User` (removed entity) |

`User` response shape includes:
`id`, `email`, `password`, `firstName`, `lastName`, `role` (`admin` or `client`), `createdAt`.

## Auth (`/api/auth`) - Non-CRUD resource

### DTO contracts

- `register` body uses `CreateUserDto`
- `login` body uses `LoginDto`
    - `email: string`
    - `password: string`

### Endpoint details

| Action | Method | URL | Status | Body (request type) | Path params | Query params | Response type |
|---|---|---|---|---|---|---|---|
| Register user | `POST` | `/api/auth/register` | Implemented | `CreateUserDto` | None | None | `Omit<User, 'password'>` |
| Login | `POST` | `/api/auth/login` | Implemented | `LoginDto` | None | None | `{ access_token: string }` |

## Documentation endpoint

- Swagger UI: `GET /api/docs`

