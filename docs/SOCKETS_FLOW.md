# Comprehensive WebSockets, Real-Time Messaging & Instant Notifications Architecture

This document provides an exhaustive, line-by-line technical specification of the **WebSocket Server Architecture, Event Listeners, Emitters, Room Channels, and Client Hooks** in AssetIQ v2.

---

## 1. Socket Server Initialization & Handshake Auth

File Path: [`backend/src/config/socket.js`](file:///c:/Projects/assetIQ-v2/backend/src/config/socket.js)

### 1.1 Server Initialization (`initSocket`)
```javascript
export const initSocket = (httpServer) => {
  const allowedOrigins = process.env.CORS_ORIGIN
    ? Array.from(new Set([process.env.CORS_ORIGIN, 'http://localhost:5173', 'http://127.0.0.1:5173']))
    : ['http://localhost:5173', 'http://127.0.0.1:5173'];

  io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
      methods: ['GET', 'POST']
    }
  });
```

### 1.2 Handshake Authentication Middleware (`io.use`)
Every incoming socket connection MUST undergo JWT verification before connection acceptance.

```javascript
  io.use((socket, next) => {
    try {
      let token = null;

      // 1. Extract from HTTP-Only cookie header
      const cookieHeader = socket.handshake.headers.cookie || '';
      const tokenMatch = cookieHeader.match(/accessToken=([^;]+)/);
      if (tokenMatch) {
        token = tokenMatch[1];
      }

      // 2. Fallback to auth object or Authorization header
      if (!token) token = socket.handshake.auth?.token || null;
      if (!token && socket.handshake.headers.authorization) {
        const authHeader = socket.handshake.headers.authorization;
        if (authHeader.startsWith('Bearer ')) token = authHeader.split(' ')[1];
      }

      if (!token) return next(new Error('Authentication error: Access token missing'));

      // 3. Decode & Verify JWT
      const decoded = verifyAccessToken(token);
      if (!decoded || (!decoded._id && !decoded.id)) {
        return next(new Error('Authentication error: Invalid access token'));
      }

      // 4. Attach Identity to Socket Instance
      socket.userId = decoded._id || decoded.id;
      socket.userEmail = decoded.email || '';
      socket.userRole = decoded.role || 'employee';
      socket.orgId = decoded.organizationId || null;
      socket.userName = decoded.name || '';
      socket.user = { _id: socket.userId, email: socket.userEmail, role: socket.userRole, organizationId: socket.orgId, name: socket.userName };

      next();
    } catch (err) {
      return next(new Error(`Authentication error: ${err.message}`));
    }
  });
```

---

## 2. Room Channel Architecture & Event Listeners

### 2.1 Private User Notification Rooms (`user:<userId>`)
- **Auto Join on Connection**:
  ```javascript
  io.on('connection', (socket) => {
    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
    }
  });
  ```
- **Server Emitter Function**:
  ```javascript
  export const emitToUser = (userId, event, data) => {
    if (io && userId) {
      io.to(`user:${userId}`).emit(event, data);
    }
  };
  ```

---

### 2.2 Conversation Thread Rooms (`conversation:<conversationId>`)

#### A. Joining Conversation Room (`conversation:join`)
```javascript
socket.on('conversation:join', async (payload) => {
  const conversationId = typeof payload === 'string' ? payload : payload?.conversationId;
  const conversation = await Conversation.findById(conversationId).lean();
  
  // Single Source of Truth: Centralized Authorization Guard
  const accessCheck = await verifyConversationAccess(conversation, socket.user);
  if (!accessCheck.authorized) {
    socket.emit('error', { code: 'FORBIDDEN', message: accessCheck.reason });
    return;
  }

  socket.join(`conversation:${conversationId}`);
  socket.emit('conversation:joined', { conversationId });
});
```

#### B. Sending Real-Time Message (`message:send`) & Server-Side Filtering
```javascript
socket.on('message:send', async (data) => {
  const { conversationId, content, isInternal } = data || {};
  const conversation = await Conversation.findById(conversationId).lean();
  const accessCheck = await verifyConversationAccess(conversation, socket.user);
  if (!accessCheck.authorized) return socket.emit('error', { code: 'FORBIDDEN' });

  // Role Permissions Guard A: SuperAdmin maintenance ticket read-only
  if (conversation.contextType === 'ticket' && socket.userRole === 'super_admin') {
    return socket.emit('error', { code: 'FORBIDDEN', message: 'SuperAdmin access is read-only' });
  }

  // Role Permissions Guard B: Employees cannot post internal notes
  if (socket.userRole === 'employee' && isInternal) {
    return socket.emit('error', { code: 'FORBIDDEN', message: 'Unauthorized internal note' });
  }

  // Persist Message via Service
  const savedMessage = await conversationService.addMessageToConversation(
    conversationId,
    { content, isInternal: Boolean(isInternal) },
    socket.user
  );

  // SERVER-SIDE INTERNAL NOTE FILTERING
  if (savedMessage.isInternal) {
    const socketsInRoom = await io.in(`conversation:${conversationId}`).fetchSockets();
    for (const s of socketsInRoom) {
      if (s.userRole !== 'employee') {
        s.emit('message:new', savedMessage);
      }
    }
  } else {
    io.to(`conversation:${conversationId}`).emit('message:new', savedMessage);
  }
});
```

---

## 3. Real-Time Notification Integration

File Path: [`backend/src/services/notification.service.js`](file:///c:/Projects/assetIQ-v2/backend/src/services/notification.service.js)

Whenever business processes execute (e.g. ticket creation, status changes, procurement approvals):
1. `createNotification(data)` creates a `Notification` document in MongoDB.
2. Immediately invokes `emitToUser(data.userId, 'new-notification', notif)`:
   ```javascript
   export const createNotification = async (data) => {
     const notif = await Notification.create({ ...data });
     if (data.userId) {
       emitToUser(data.userId, 'new-notification', notif);
     }
     return notif;
   };
   ```

---

## 4. Frontend Client Hooks & Component Integration

### 4.1 Persistent Socket Instance Hook (`useSocket.js`)
File Path: [`frontend/src/hooks/useSocket.js`](file:///c:/Projects/assetIQ-v2/frontend/src/hooks/useSocket.js)

```javascript
let globalSocket = null;

export const useSocket = () => {
  const socketRef = useRef(null);
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (globalSocket) {
        globalSocket.disconnect();
        globalSocket = null;
      }
      return;
    }

    if (!globalSocket || !globalSocket.connected) {
      globalSocket = io(socketServerUrl, {
        withCredentials: true,
        transports: ['websocket', 'polling'],
        autoConnect: true
      });
    }

    socketRef.current = globalSocket;
  }, [isAuthenticated, user]);

  return socketRef;
};
```

### 4.2 Real-Time Notification Listener Hook (`useNotificationSocket.js`)
File Path: [`frontend/src/hooks/useNotificationSocket.js`](file:///c:/Projects/assetIQ-v2/frontend/src/hooks/useNotificationSocket.js)

```javascript
export const useNotificationSocket = () => {
  const socketRef = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handleNewNotification = (notification) => {
      toast.info(notification.title || 'New Notification', {
        description: notification.message
      });

      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-notification-count'] });
    };

    socket.on('new-notification', handleNewNotification);
    return () => socket.off('new-notification', handleNewNotification);
  }, [socketRef, queryClient]);
};
```

### 4.3 Chat UI Component (`TicketChat.jsx`)
File Path: [`frontend/src/components/tickets/TicketChat.jsx`](file:///c:/Projects/assetIQ-v2/frontend/src/components/tickets/TicketChat.jsx)

- On Mount: Calls `socket.emit('conversation:join', conversationId)`.
- Live Messages: Subscribes to `socket.on('message:new', handleNewMessage)` and updates thread UI instantly.
- Typing Indicators: Emits `typing` / `stop-typing` and listens for `user-typing` / `user-stop-typing`.
- On Unmount: Calls `socket.emit('conversation:leave', conversationId)` and cleans up listeners.
