---

## 6. Technology Stack

### 6.1 Stack Overview

The technology stack is chosen to prioritize federal hosting compatibility, team maintainability, and simplicity over novelty. Where the hosting environment is still TBD (pending ATO discovery), decisions are documented as recommendations with the rationale for each choice. Nothing in this stack requires a commercial cloud provider — all components can run on AO-managed on-premise or Azure Government hosting.

### 6.2 Recommended Stack Table

| Layer | Technology | Version | Purpose | Decision Status |
|-------|-----------|---------|---------|-----------------|
| **Runtime** | Node.js | 20 LTS | Application server runtime | Recommended |
| **Web Framework** | Express.js or Fastify | 4.x / 4.x | HTTP routing, middleware, REST API | Recommended |
| **Template Engine** | Nunjucks or EJS | Latest | Server-side rendering for public Hub and admin interface | Recommended |
| **Database** | PostgreSQL | 14+ | Primary data store, full-text search, UUID support | Strongly Recommended |
| **ORM / Query Builder** | Knex.js or Drizzle ORM | Latest | Database access, migrations, parameterized queries | Recommended |
| **Database Migrations** | Knex migrations or Flyway | — | Schema version control and deployment | Required |
| **Full-Text Search** | PostgreSQL native FTS (tsvector + GIN) | Built-in | Record search; eliminates external search service dependency | Recommended |
| **Authentication** | Passport.js (OIDC strategy) or MSAL Node | Latest | Azure AD / Entra ID OIDC integration | Recommended |
| **Session Store** | express-session + connect-pg-simple | — | Server-side session management with PostgreSQL backing | Recommended |
| **Email** | Nodemailer | Latest | SMTP-based transactional email for routing notifications | Recommended |
| **CAPTCHA** | Google reCAPTCHA v3 | v3 | Spam protection on public forms | Recommended |
| **Rate Limiting** | express-rate-limit | Latest | IP-based rate limiting on public write endpoints | Required |
| **Input Sanitization** | DOMPurify (server-side via jsdom) or sanitize-html | Latest | HTML stripping on all user text inputs | Required |
| **Validation** | Zod or Joi | Latest | Request body and query parameter validation | Required |
| **Logging** | Winston or Pino | Latest | Structured application logging | Required |
| **Environment Config** | dotenv (dev) + hosting secret manager (prod) | — | Secrets and environment configuration | Required |
| **Testing** | Jest + Supertest | Latest | Unit and integration tests | Required |
| **Reverse Proxy** | nginx | Latest | HTTPS termination, static asset serving, header security | Required |

### 6.3 Alternative Stacks (If Hosting Dictates)

If the AO-managed hosting environment favors a .NET or Python stack (e.g., for existing AO tooling support), the following alternatives map to the same architecture:

| Component | .NET Alternative | Python Alternative |
|-----------|-----------------|-------------------|
| Web Framework | ASP.NET Core 8 | FastAPI or Django |
| ORM | Entity Framework Core | SQLAlchemy / Django ORM |
| Auth | Microsoft.Identity.Web | authlib (OIDC) |
| Template Engine | Razor Pages | Jinja2 |
| Validation | FluentValidation | Pydantic |
| Email | MailKit | smtplib / anymail |

The PostgreSQL database recommendation applies regardless of the application language stack.

### 6.4 Infrastructure Dependencies

| Dependency | Role | Required By | Fallback |
|------------|------|-------------|---------|
| Azure AD / Entra ID tenant | OIDC identity provider for curator auth | Admin interface | None — alternative IdP must support OIDC |
| SMTP relay | Outbound email for routing notifications and confirmations | F05, F06, F07 | If unavailable: submission queue in admin interface serves as manual notification |
| CAPTCHA provider (reCAPTCHA v3 or hCaptcha) | Anti-spam for public forms | F05, F06, F07 | IP rate limiting only if CAPTCHA outbound calls are blocked |
| Reverse proxy / WAF | TLS termination, security headers, request forwarding | All | Could be nginx on the same host or AO WAF |

### 6.5 Not In Stack (Explicitly Excluded from MVP)

| Technology | Reason Excluded |
|-----------|-----------------|
| Elasticsearch / OpenSearch | Not needed at MVP record volumes; PostgreSQL FTS is sufficient |
| Redis | Not required for MVP session store (PostgreSQL session store is adequate); add if performance demands it |
| Message queue (RabbitMQ, SQS) | Email is fire-and-forget; no async job queue needed at MVP scale |
| Containerization (Docker/Kubernetes) | Hosting environment TBD; container support uncertain in some federal environments; application is structured to be container-ready without requiring it |
| CDN | MVP does not serve user-uploaded content; all assets are static files served by the application or nginx |
| GraphQL | REST API is sufficient; added complexity not justified |
| SPA framework (React, Vue) | Server-side rendering is sufficient; avoids JavaScript build complexity and SPA accessibility issues |
| Mobile app (iOS/Android) | Explicitly out of scope per PRD §11 |

---

*End of 05-tech-stack.md*
