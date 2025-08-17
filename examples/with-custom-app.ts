import { Elysia } from "elysia";
import { Websocket } from "../src/websocket";

const app = new Elysia()
	.get("/", () => "Hello World");

const ws = Websocket(app);

ws.create("/", (route) => {
	route.on("open", (client) => {
		console.log("Client connected", client.id);
	});

	route.on("message", (client, message) => {
		console.log("Client sent message", message);
		route.broadcast(`${client.connectionId} sent message: ${message}`);
	});

	route.on("close", (client) => {
		console.log("Client disconnected", client.id);
	});
});

app.listen(3000, () => {
	console.log("Server is running on port http://localhost:3000");
});