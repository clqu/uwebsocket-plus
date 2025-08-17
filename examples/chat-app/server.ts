import { Elysia } from "elysia";
import { Plugin } from "../../src/plugin-builder";
import { Websocket } from "../../src/websocket";

const names = ["John", "Jane", "Doe", "Smith", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis"];
const surnames = ["Doe", "Smith", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis"];

const getRandomName = () => {
	const name = names[Math.floor(Math.random() * names.length)];
	const surname = surnames[Math.floor(Math.random() * surnames.length)];
	return `${name} ${surname}`;
}

const profilePlugin = new Plugin()
	.setName("random_profile")
	.withStore(() => [
		["username", null],
		["avatar", null]
	])
	.onPreReady((client) => {
		const store: Record<string, any> = client.data.store;
		const name = client.data?.query?.username || getRandomName();
		store.username = name;
		store.avatar = `https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=${name}`;
	})
	.build();

const ws = Websocket({
	plugins: [profilePlugin] as const
});

// Ana WebSocket endpoint - sadece room listesi için
ws.create("/", (route) => {
	route.on("message", (client, data) => {
		if (data.type === "get-rooms") {
			return client.send(JSON.stringify({
				type: "rooms",
				rooms: Array.from(ws.rooms.entries())
					.filter(([room]) => room.startsWith("rooms:"))
					.map(([room, { clients }]) => ({
						name: room.replace("rooms:", ""),
						userCount: clients.length
					}))
			}));
		}
	});
});

ws.create("/:roomId", (route) => {
	route.on("open", (client) => {
		const roomId = "rooms:" + client.data.params.roomId;
		client.joinRoom(roomId);
		ws.broadcastToRoom(roomId, {
			type: "join",
			username: client.data.store.username,
			avatar: client.data.store.avatar
		});
	});

	route.on("message", (client, data) => {
		const roomId = "rooms:" + client.data.params.roomId;

		if (data.type === "get-clients") return client.send(JSON.stringify({
			type: "clients",
			clients: ws.getClients({ specificRoom: roomId })
		}));

		if (data.type === "get-clients-size") return client.send(JSON.stringify({
			type: "clients-size",
			size: ws.getClients({ specificRoom: roomId, onlySize: true })
		}));

		if (data.type === "send-message") {
			ws.broadcastToRoom(roomId, {
				type: "message",
				username: client.data.store.username,
				avatar: client.data.store.avatar,
				message: data.message
			});
		}
	});

	route.on("close", (client) => {
		const roomId = "rooms:" + client.data.params.roomId;
		ws.broadcastToRoom(roomId, {
			type: "leave",
			username: client.data.store.username,
			avatar: client.data.store.avatar
		});
	});
});

new Elysia()
	.use(ws.getElysia())
	.get("/", () => Bun.file("./index.html"))
	.listen(3000, () => {
		console.log("Server is running on port http://localhost:3000");
	});