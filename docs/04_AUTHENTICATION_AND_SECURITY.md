# 04 — Authentication and Security Architecture

## 1. Authentication Overview

AssetOwl uses a secure cookie-based JSON Web Token (JWT) architecture with short-lived access tokens and database-backed refresh tokens.

```
┌──────────────┐                                  ┌──────────────┐                                  ┌──────────────┐
│   BROWSER    │                                  │   EXPRESS    │                                  │   MONGODB    │
└──────┬───────┘                                  └──────┬───────┘                                  └──────┬───────┘
       │                                                 │                                                 │
       │ 1. POST /api/auth/login {email, password}       │                                                 │
       ├────────────────────────────────────────────────►│                                                 │
       │                                                 │ 2. Find User by email                           │
       │                                                 ├────────────────────────────────────────────────►│
       │                                                 │ 3. bcrypt.compare(password, user.passwordHash)  │
       │                                                 │ 4. Generate Access Token & Refresh Token        │
       │                                                 │ 5. Save Refresh Token document                  │
       │                                                 ├────────────────────────────────────────────────►│
       │ 6. Response: Set-Cookie (accessToken,           │                                                 │
       │    refreshToken) + User Profile JSON            │                                                 │
       │◄────────────────────────────────────────────────┤                                                 │
       │                                                 │                                                 │
       │ 7. Authenticated Request (Cookies sent auto)    │                                                 │
       ├────────────────────────────────────────────────►│ 8. authMiddleware verifies accessToken        │
       │                                                 │    Attaches req.user -> calls next()            │
```

---

## 2. Token Architecture & Storage

| Token | Validity | Secret Variable | Storage Location | Cookie Attributes |
|---|---|---|---|---|
| **Access Token** | 15 Minutes (`15m`) | `JWT_SECRET` | `accessToken` Cookie | `HttpOnly`, `SameSite: lax` (dev) / `strict` (prod), `secure: isProduction`, `maxAge: 15min` |
| **Refresh Token** | 7 Days (`7d`) | `REFRESH_TOKEN_SECRET` | `refreshToken` Cookie + MongoDB `RefreshToken` collection | `HttpOnly`, `SameSite: lax` (dev) / `strict` (prod), `secure: isProduction`, `maxAge: 7days` |

### Critical Security Principles
1. **HttpOnly Cookies**: JavaScript running in the browser cannot read or access either the `accessToken` or `refreshToken` cookies, protecting against token exfiltration via Cross-Site Scripting (XSS).
2. **Local Storage Metadata Only**: `localStorage.getItem('assetowl_user')` is used strictly for storing non-sensitive user profile metadata (e.g. `name`, `email`, `role`, `organizationId`) so the UI can render header navigation without blocking render screens.
3. **Database-Backed Refresh Token Invalidation**: When a user logs out (`POST /api/auth/logout`), the refresh token is deleted from MongoDB and the cookies are cleared.

---

## 3. Password Hashing Mechanism

- **Algorithm**: `bcryptjs` using 10 salt rounds (`bcrypt.genSalt(10)`).
- **Storage Field**: Stored as `passwordHash` in the `User` document.
- **Verification**: Evaluated with `await bcrypt.compare(candidatePassword, user.passwordHash)`.
- **Pre-Save Hook**: Note that `User.js` does NOT use an implicit pre-save hook; hashing is performed explicitly prior to `User.create()` in the authentication controller and seeders.

---

## 4. Automatic Token Refresh Interceptor

The frontend Axios client (`frontend/src/api/axios.config.js`) features a queue-based 401 response interceptor:

1. A REST request receives a `401 Unauthorized` due to an expired 15-minute access token.
2. The interceptor intercepts the error, flags `isRefreshing = true`, and queues any concurrent failing requests into `failedQueue`.
3. It makes a request to `POST /api/auth/refresh` (the browser automatically provides the `refreshToken` cookie).
4. The backend verifies the refresh token, validates against the `RefreshToken` collection, and sets a new `accessToken` cookie.
5. The frontend processes the queue and replays the original failed requests seamlessly with zero UI disruption.
6. If the refresh token is also expired or invalid, the queue is rejected, local user state is cleared, and the user is redirected to `/login`.

---

## 5. Socket.IO Authentication & Stale Cookie Mitigation

1. During WebSocket handshake, Socket.IO inspects `socket.handshake.headers.cookie`.
2. It parses the `accessToken` cookie and runs `jwt.verify(token, JWT_SECRET)`.
3. On verification success, `socket.userId`, `socket.userRole`, and `socket.orgId` are attached to the socket instance.
4. **Stale Cookie Behavior**: If the developer restarts the backend with a different `JWT_SECRET` (or switches between dev and prod environments), an older browser cookie will produce `Socket auth warning: invalid signature`. The middleware gracefully catches the error and logs a debug warning without crashing. Logging out or clearing cookies immediately establishes a fresh session.
