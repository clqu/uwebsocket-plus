# 🚀 UWebSocket+

A powerful, plugin-based WebSocket library built on TypeScript and Elysia.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-1.2.15+-ff69b4.svg)](https://bun.sh)

## ✨ Features

- 🏠 **Room Management** - Multi-room chat support
- 👥 **User Management** - Real-time user presence
- 🔌 **Plugin System** - Extensible architecture
- ⚡ **High Performance** - Built with Bun and Elysia
- 🔒 **Type Safety** - Full TypeScript support

## 📦 Installation

```bash
bun add uwebsocket-plus
# or
npm install uwebsocket-plus
```

## 🎯 Quick Start

### Simple WebSocket Server

```typescript
import { Websocket } from "uwebsocket-plus";

const ws = Websocket({});

ws.create("/", (route) => {
    route.on("open", (client) => {
        console.log("Client connected:", client.connectionId);
    });

    route.on("message", (client, message) => {
        route.broadcast(`${client.connectionId}: ${message}`);
    });
});

ws.listen(3000);
```

### Elysia Integration

```typescript
import { Elysia } from "elysia";
import { Websocket } from "uwebsocket-plus";

const app = new Elysia();
const ws = Websocket(app);

ws.create("/chat", (route) => {
    route.on("message", (client, message) => {
        route.broadcast(message);
    });
});

app.listen(3000);
```

### Room System

```typescript
ws.create("/:roomId", (route) => {
    route.on("open", (client) => {
        const roomId = client.data.params.roomId;
        client.joinRoom(roomId);
        
        ws.broadcastToRoom(roomId, {
            type: "join",
            user: client.connectionId
        });
    });

    route.on("message", (client, message) => {
        const roomId = client.data.params.roomId;
        ws.broadcastToRoom(roomId, {
            type: "message",
            user: client.connectionId,
            data: message
        });
    });
});
```

## 🔌 Plugin System

```typescript
import { Plugin, Websocket } from "uwebsocket-plus";

const myPlugin = new Plugin()
    .setName("my-plugin")
    .withStore(() => [["counter", 0]])
    .withMethods((ws) => ({
        increment: () => ws.elysia.store.counter++
    }))
    .onMessage((client, message) => {
        console.log("Message:", message);
    })
    .build();

const ws = Websocket({
    plugins: [myPlugin] as const
});

// Use plugin method
ws.increment();
```

## 📚 API

### WebSocket Methods

- `ws.create(path, callback)` - Create WebSocket endpoint
- `ws.broadcast(message)` - Send message to all clients
- `ws.broadcastToRoom(roomId, message)` - Send message to room
- `ws.getClients(options)` - Get client list
- `ws.listen(port)` - Start server

### Client Methods

- `client.joinRoom(roomId)` - Join room
- `client.leaveRoom(roomId)` - Leave room
- `client.send(message)` - Send message to client
- `client.data.store` - Client data store
- `client.connectionId` - Unique connection ID

### Plugin Methods

- `setName(name)` - Set plugin name
- `withStore(factory)` - Define data store
- `withMethods(factory)` - Add custom methods
- `onOpen/onMessage/onClose(handler)` - Event handlers

## 🎮 Frontend

```javascript
const ws = new WebSocket('ws://localhost:3000/room1');

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('Message:', data);
};

ws.send(JSON.stringify({
    type: 'chat',
    message: 'Hello!'
}));
```

## 📄 License

MIT License - [LICENSE](LICENSE)

## 🔗 Links

- 🐛 [Issues](https://github.com/clqu/uwebsocket-plus/issues)
- 📧 [Contact](mailto:mail@clqu.dev)
- 🌟 [GitHub](https://github.com/clqu/uwebsocket-plus)