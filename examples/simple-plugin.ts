import { Elysia } from "elysia";
import { Plugin } from "../src/plugin-builder";
import { Websocket } from "../src/websocket";
import type { WS } from "../src/types";

const loggingPlugin = new Plugin()
	.setName("messages_count")
	.withStore(() => [
		["messages_count", 0, { global: true }],
		["messages_count", 0]
	])
	.withMethods((websocket) => ({
		increaseMessagesCount: (client?: WS) => {
			// client store
			const store: Record<string, any> = client?.data?.store || websocket?.elysia?.store;
			const messages_count = store.messages_count;
			store.messages_count = messages_count + 1;
		},
		getMessagesCount: (client?: WS) => {
			const store: Record<string, any> = client?.data?.store || websocket?.elysia?.store;
			return store.messages_count;
		}
	}))
	.onMessage((client, message, websocket) => {
		const store: Record<string, any> = websocket?.elysia?.store;
		store.messages_count++;
	})
	.build();

const ws = Websocket({
	plugins: [loggingPlugin] as const
});

ws.create("/", (route) => {
	route.on("open", (client) => {
		console.log("Client connected", client.id);
	});

	route.on("message", (client, message) => {
		console.log("Client sent message", message);
		route.broadcast(`${client.connectionId} sent message: ${message}`);
		ws.increaseMessagesCount(client);
		console.log(`Self messages count: ${ws.getMessagesCount(client)}`);
		console.log(`Global messages count: ${ws.getMessagesCount()}`);
	});

	route.on("close", (client) => {
		console.log("Client disconnected", client.id);
	});
});

const app = new Elysia()
	.use(ws.getElysia())
	.get("/", () => "Hello World")
	.listen(3000, () => {
		console.log("Server is running on port http://localhost:3000");
	});