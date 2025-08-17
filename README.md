# 🚀 UWebSocket+

A powerful, plugin-based WebSocket library built on top of Elysia with TypeScript support. UWebSocket+ provides a advanced room management, real-time messaging, and extensible plugin architecture.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-1.2.15+-ff69b4.svg)](https://bun.sh)

## ✨ Features

- 🏠 **Room Management** - Create and join multiple chat rooms
- 👥 **User Management** - Real-time user presence and avatar support
- 🔌 **Plugin System** - Extensible architecture with custom plugins
- ⚡ **High Performance** - Built with Bun and Elysia for maximum speed
- 🔒 **Type Safety** - Full TypeScript support with strict typing
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile

## 🎯 Quick Start

### Prerequisites

- [Bun](https://bun.sh) v1.2.15 or higher
- Node.js 18+ (for compatibility)

### Installation

```bash
# Clone the repository
git clone https://github.com/clqu/uwebsocket-plus.git
cd uwebsocket-plus

# Install dependencies
bun install
```

### Running the Server

```bash
# Start the WebSocket server
bun run examples/chat-app/server.ts
```

### Opening the Chat App

Open `examples/chat-app/index.html` in your browser and start chatting!

## 🏗️ Architecture

### Core Components

- **WebsocketBase** - Main WebSocket management class
- **Plugin System** - Extensible plugin architecture
- **Room Management** - Advanced room creation and management
- **Client Management** - Real-time client tracking and presence

### Plugin System

UWebSocket+ features a powerful plugin system that allows you to extend functionality:

```typescript
import { Plugin } from "./src/plugin-builder";

const myPlugin = new Plugin()
    .setName("my-plugin")
    .withStore(() => [["counter", 0]])
    .withMethods((websocket) => ({
        incrementCounter: () => {
            // Custom method logic
        }
    }))
    .onOpen((client) => {
        console.log(`Client ${client.connectionId} connected`);
    })
    .onMessage((client, message) => {
        console.log(`Message from ${client.connectionId}:`, message);
    })
    .build();
```

## 📚 API Reference

### WebsocketBase

```typescript
// Create a new WebSocket instance
const ws = new WebsocketBase(options);

// Create a room
ws.create("/room-name", (route) => {
    route.on("open", (client) => {
        // Handle client connection
    });
    
    route.on("message", (client, message) => {
        // Handle incoming messages
    });
    
    route.on("close", (client) => {
        // Handle client disconnection
    });
});
```

### Client Methods

```typescript
// Join a room
client.joinRoom("room-id");

// Leave a room
client.leaveRoom("room-id");

// Get client's rooms
const rooms = client.getRooms();

// Broadcast to a room
websocket.broadcastToRoom("room-id", {
    type: "message",
    content: "Hello, room!"
});
```

### Plugin Methods

```typescript
// Get clients in a specific room
const clients = websocket.getClients({ specificRoom: "room-id" });

// Get client count only
const count = websocket.getClients({ specificRoom: "room-id", onlySize: true });

// Get all clients
const allClients = websocket.getClients({});
```

## 🎮 Examples

### Basic Chat Server

```typescript
import { Elysia } from "elysia";
import { Websocket } from "./src/websocket";

const ws = Websocket({});

ws.create("/:roomId", (route) => {
    route.on("open", (client) => {
        const roomId = route.roomId;
        client.joinRoom(roomId);
        
        ws.broadcastToRoom(roomId, {
            type: "join",
            username: client.data.store.username
        });
    });

    route.on("message", (client, message) => {
        const data = JSON.parse(message);
        
        if (data.type === "send-message") {
            ws.broadcastToRoom(route.roomId, {
                type: "message",
                username: client.data.store.username,
                message: data.message
            });
        }
    });
});

const app = new Elysia()
    .use(ws.getElysia())
    .listen(3000);
```

### Custom Plugin

```typescript
const profilePlugin = new Plugin()
    .setName("profile")
    .withStore(() => [
        ["username", null],
        ["avatar", null]
    ])
    .onPreReady((client) => {
        const name = generateRandomName();
        client.data.store.username = name;
        client.data.store.avatar = `https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=${name}`;
    })
    .build();

const ws = Websocket({
    plugins: [profilePlugin] as const
});
```

## 🎨 Frontend Integration

The included chat application demonstrates how to integrate with the WebSocket server:

```javascript
// Connect to a room
const ws = new WebSocket(`ws://localhost:3000/${roomName}`);

// Send a message
ws.send(JSON.stringify({
    type: "send-message",
    message: "Hello, world!"
}));

// Get online users
ws.send(JSON.stringify({
    type: "get-clients"
}));

// Get user count
ws.send(JSON.stringify({
    type: "get-clients-size"
}));
```

## 🛠️ Development

### Project Structure

```
uwebsocket-plus/
├── src/
│   ├── websocket.ts      # Core WebSocket implementation
│   ├── plugin-builder.ts # Plugin system
│   └── types.ts          # TypeScript definitions
├── examples/
│   ├── chat-app/         # Complete chat application
│   │   ├── server.ts     # Backend server
│   │   └── index.html    # Frontend UI
│   └── simple-plugin.ts  # Plugin example
└── README.md
```

### Building

```bash
# Type check
bun run tsc --noEmit

# Run tests (if available)
bun test

# Lint code
bun run lint
```

### Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit your changes: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin feature/new-feature`
5. Submit a pull request

## 🔧 Configuration

### Server Options

```typescript
interface Options<TPlugins> {
    plugins?: TPlugins;
    publishToSelf?: boolean;
}
```

### Message Types

The system supports various message types:

- `join` - User joined a room
- `leave` - User left a room
- `message` - Chat message
- `get-clients` - Request client list
- `get-clients-size` - Request client count
- `send-message` - Send a message

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Support

- 📧 Email: mail@clqu.dev
- 🐛 Issues: [GitHub Issues](https://github.com/clqu/uwebsocket-plus/issues)

## 🙏 Acknowledgments

- Built with [Bun](https://bun.sh) - The fast JavaScript runtime
- Powered by [Elysia](https://elysiajs.com) - Ergonomic framework for humans
- UI inspired by [Discord](https://discord.com) - Modern chat interface

---

⭐ **Star us on GitHub** — it helps!

[🚀 Get Started](#-quick-start) | [📚 Documentation](#-api-reference) | [🎮 Examples](#-examples) | [🤝 Contributing](#-development)