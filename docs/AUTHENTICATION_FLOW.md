# Comprehensive Authentication & Multi-Tenant RBAC Architecture

This document provides a line-by-line, function-by-function technical breakdown of the **Authentication, Authorization, Session Management, and Multi-Tenant RBAC** system in AssetIQ v2.

---

## 1. System Overview & Data Storage

### 1.1 Multi-Tenant Data Storage Model
AssetIQ utilizes a **Shared Database, Isolated Schema / Tenant ID** multi-tenancy model. Every tenant organization is represented by an [`Organization`](file:///c:/Projects/assetIQ-v2/backend/src/models/Organization.js) document in MongoDB. Every user belongs to an organization via the `organizationId` foreign key (except SuperAdmins, who manage global operations).

#### Database Schemas
- **User Schema** ([`backend/src/models/User.js`](file:///c:/Projects/assetIQ-v2/backend/src/models/User.js)):
  ```javascript
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    name: { type: String, required: true, trim: true },
    role: { 
      type: String, 
      enum: ['super_admin', 'org_admin', 'asset_manager', 'employee'], 
      required: true 
    },
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', index: true },
    organizationName: { type: String, default: '' },
    status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
    refreshToken: { type: String, select: false },
    employeeRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
    lastLogin: { type: Date }
  }
  ```
- **Organization Schema** ([`backend/src/models/Organization.js`](file:///c:/Projects/assetIQ-v2/backend/src/models/Organization.js)):
  ```javascript
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    domain: { type: String, default: '' },
    plan: {
      name: { type: String, enum: ['starter', 'professional', 'enterprise'], default: 'starter' },
      maxAssets: { type: Number, default: 50 },
      maxUsers: { type: Number, default: 5 },
      priceMonthly: { type: Number, default: 49 }
    },
    status: { type: String, enum: ['active', 'suspended', 'pending'], default: 'active' }
  }
  ```

---

## 2. Token Utility & Cookie Management

File Path: [`backend/src/utils/token.utils.js`](file:///c:/Projects/assetIQ-v2/backend/src/utils/token.utils.js)

### Function-by-Function Breakdown

#### 1. `generateAccessToken(user)`
- **Purpose**: Creates a short-lived JSON Web Token (15-minute expiration) encoding user identity & claims.
- **Implementation**:
  ```javascript
  export const generateAccessToken = (user) => {
    const payload = {
      id: user._id || user.id,
      _id: user._id || user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId || null,
      name: user.name || ''
    };
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });
  };
  ```

#### 2. `generateRefreshToken(user)`
- **Purpose**: Creates a long-lived refresh token (7-day expiration) stored on the client as an HTTP-only cookie and stored on the user record in MongoDB.
- **Implementation**:
  ```javascript
  export const generateRefreshToken = (user) => {
    const payload = { id: user._id || user.id };
    return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET, { expiresIn: '7d' });
  };
  ```

#### 3. `verifyAccessToken(token)`
- **Purpose**: Decodes and validates signature of incoming access token.
- **Implementation**:
  ```javascript
  export const verifyAccessToken = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET);
  };
  ```

#### 4. `setTokenCookies(res, accessToken, refreshToken)`
- **Purpose**: Sets secure HTTP-Only cookies on the HTTP response object to prevent XSS token theft.
- **Implementation**:
  ```javascript
  export const setTokenCookies = (res, accessToken, refreshToken) => {
    const isProduction = process.env.NODE_ENV === 'production';
    
    if (accessToken) {
      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000 // 15 minutes
      });
    }

    if (refreshToken) {
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
    }
  };
  ```

#### 5. `clearTokenCookies(res)`
- **Purpose**: Expire and clear HTTP-Only cookies on logout.
- **Implementation**:
  ```javascript
  export const clearTokenCookies = (res) => {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
  };
  ```

---

## 3. Middleware & Security Guards

File Path: [`backend/src/middlewares/auth.middleware.js`](file:///c:/Projects/assetIQ-v2/backend/src/middlewares/auth.middleware.js)

### 1. `authenticateUser`
- **Execution Flow**:
  1. Checks `req.cookies.accessToken`.
  2. Fallback check: `req.headers.authorization` (`Bearer <token>`).
  3. If missing, throws `ApiError(401, 'Authentication token missing')`.
  4. Calls `verifyAccessToken(token)`.
  5. Attaches `req.user = decoded` to the Express request lifecycle.

### 2. `requireRole(...allowedRoles)`
- **Execution Flow**:
  1. Checks if `req.user` exists.
  2. Verifies `allowedRoles.includes(req.user.role)`.
  3. If `user.role === 'super_admin'`, bypasses tenant role limits.
  4. If user role is not permitted, throws `ApiError(403, 'Forbidden: Insufficient privileges')`.

### 3. `requireSameOrg`
- **Execution Flow**:
  1. Prevents cross-tenant data tampering.
  2. Compares `req.params.organizationId` or `req.body.organizationId` with `req.user.organizationId`.
  3. Bypasses check for `super_admin`.

---

## 4. Backend Authentication Service & Controller

### 4.1 Auth Service ([`backend/src/services/auth.service.js`](file:///c:/Projects/assetIQ-v2/backend/src/services/auth.service.js))

#### `registerUser(data)`
1. Checks `User.findOne({ email: data.email.toLowerCase() })`. Throws 400 if email exists.
2. If `data.role === 'org_admin'`:
   - Creates new `Organization` document.
3. Hashes password via `bcrypt.hash(data.password, 10)`.
4. Creates `User` document.
5. Calls `generateAccessToken(user)` and `generateRefreshToken(user)`.
6. Saves `refreshToken` hash to `user.refreshToken`.

#### `loginUser(credentials)`
1. Queries `User.findOne({ email: credentials.email.toLowerCase() }).select('+password +refreshToken')`.
2. Asserts user exists and `user.status === 'active'`.
3. Verifies password: `await user.comparePassword(credentials.password)`.
4. Generates `accessToken` & `refreshToken`.
5. Updates `user.refreshToken = refreshToken` and `user.lastLogin = new Date()`.
6. Returns `{ user, accessToken, refreshToken }`.

#### `refreshTokenService(refreshToken)`
1. Calls `verifyRefreshToken(refreshToken)`.
2. Finds `User.findOne({ _id: decoded.id }).select('+refreshToken')`.
3. Asserts stored `user.refreshToken === refreshToken`.
4. Issues new token pair and updates DB record.

---

## 5. Frontend Client Integration & Axios Interceptors

### 5.1 Axios Configuration ([`frontend/src/api/axios.config.js`](file:///c:/Projects/assetIQ-v2/frontend/src/api/axios.config.js))
- **Request Interceptor**: Configured with `withCredentials: true` so HTTP-Only cookies automatically attach to cross-origin API calls.
- **Response Interceptor (Automatic 401 Recovery)**:
  ```javascript
  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        try {
          await api.post('/auth/refresh-token');
          return api(originalRequest); // Retry original request
        } catch (refreshErr) {
          useAuthStore.getState().logout();
          return Promise.reject(refreshErr);
        }
      }
      return Promise.reject(error);
    }
  );
  ```

### 5.2 Auth Store ([`frontend/src/stores/auth.store.js`](file:///c:/Projects/assetIQ-v2/frontend/src/stores/auth.store.js))
- Managed via Zustand:
  - `user`: Holds logged-in user profile (`_id`, `name`, `email`, `role`, `organizationId`).
  - `isAuthenticated`: Boolean state indicating session validity.
  - `checkAuth()`: Executes `GET /api/auth/me` on app initial boot to restore session state from HTTP-Only cookie.
