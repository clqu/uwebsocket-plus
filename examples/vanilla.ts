import { Websocket } from "../src/websocket";

const ws = Websocket({});

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

ws.listen(3000, () => {
	console.log("Server is running on port ws://localhost:3000");
});