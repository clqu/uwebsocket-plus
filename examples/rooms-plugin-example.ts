import { Websocket } from "../index";
import { roomsPlugin } from "../src/plugins/rooms";

// Rooms plugin ile WebSocket oluştur
const ws = Websocket({
	plugins: [roomsPlugin]
});

// Route oluştur
ws.create("/chat", (route) => {
	route.on("open", (ws) => {
		console.log(`🟢 Client bağlandı: ${ws.connectionId}`);

		// Client otomatik olarak "global" room'a eklendi
		console.log(`📍 Client rooms: ${ws.getRooms()}`);
	});

	route.on("message", (ws, message) => {
		try {
			const data = JSON.parse(message);

			switch (data.type) {
				case "join_room":
					// Room'a katıl
					ws.joinRoom(data.roomId);
					ws.send(JSON.stringify({
						type: "room_joined",
						roomId: data.roomId,
						success: true
					}));

					// Diğer room üyelerine bildir
					ws.broadcastToRoom(data.roomId, JSON.stringify({
						type: "user_joined",
						userId: ws.connectionId,
						roomId: data.roomId
					}), ws.connectionId);
					break;

				case "leave_room":
					// Room'dan ayrıl
					ws.leaveRoom(data.roomId);
					ws.send(JSON.stringify({
						type: "room_left",
						roomId: data.roomId,
						success: true
					}));

					// Diğer room üyelerine bildir
					ws.broadcastToRoom(data.roomId, JSON.stringify({
						type: "user_left",
						userId: ws.connectionId,
						roomId: data.roomId
					}), ws.connectionId);
					break;

				case "room_message":
					// Room'a mesaj gönder
					ws.broadcastToRoom(data.roomId, JSON.stringify({
						type: "room_message",
						roomId: data.roomId,
						userId: ws.connectionId,
						message: data.message,
						timestamp: new Date().toISOString()
					}));
					break;

				case "list_rooms":
					// Mevcut room'ları listele
					const rooms = ws.listRooms();
					ws.send(JSON.stringify({
						type: "rooms_list",
						rooms: rooms.map(room => ({
							id: room.id,
							name: room.name,
							memberCount: room.members.size,
							createdAt: room.createdAt
						}))
					}));
					break;

				case "room_members":
					// Room üyelerini listele
					const members = ws.getRoomMembers(data.roomId);
					ws.send(JSON.stringify({
						type: "room_members",
						roomId: data.roomId,
						members: members
					}));
					break;

				case "create_room":
					// Yeni room oluştur
					const created = ws.createRoom(data.roomId, data.name, data.metadata);
					ws.send(JSON.stringify({
						type: "room_created",
						roomId: data.roomId,
						success: created
					}));
					break;
			}
		} catch (error) {
			console.error("❌ Mesaj işleme hatası:", error);
			ws.send(JSON.stringify({
				type: "error",
				message: "Geçersiz mesaj formatı"
			}));
		}
	});

	route.on("close", (ws) => {
		console.log(`🔴 Client ayrıldı: ${ws.connectionId}`);
		// Plugin otomatik olarak tüm room'lardan çıkaracak
	});
});

// Sunucuyu başlat
ws.listen(3000, () => {
	console.log("🚀 WebSocket sunucusu 3000 portunda çalışıyor");
	console.log("💡 Global room plugin aktif");
});

