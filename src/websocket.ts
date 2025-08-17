import { Elysia } from "elysia";
import { TypedEventEmitter } from "./types";
import type { BasePlugin, CombinePluginMethods, CustomEventEmitter, GetClientsOptions, Options, RouteEmitter, WS, WSEvents, WSPreOpen } from "./types";
import { v4 as uuidv4 } from 'uuid';

const BROADCAST_CHANNEL = "global";

const broadcast = (message: any, ws?: WS | null, publishToSelf?: boolean, roomId?: string, clients?: Map<string, any>) => {
	const targetRoom = roomId || BROADCAST_CHANNEL;
	const client = ws || clients?.values().next().value;
	const is_sub = client?.isSubscribed && client.isSubscribed(targetRoom);
	if (!publishToSelf && is_sub) client?.send?.(message);
	client?.publish?.(targetRoom, message);
};

export class WebsocketBase {
	public elysia;
	public parentElysia: Elysia | undefined;
	public clients: Map<string, any>;
	public broadcast: (message: any) => void;
	public publishToSelf: boolean;
	public broadcastToRoom: (roomId: string, message: any) => void;
	public getClients: ({ specificRoom, onlySize }: GetClientsOptions) => WS[] | number;
	public plugins: BasePlugin<any>[];
	public rooms: Map<string, { clients: any[] }> = new Map();

	private isElysiaApp(app: any): app is Elysia {
		return app && typeof app === 'object' && 'use' in app && 'listen' in app && 'config' in app;
	}

	constructor(parentApp?: Elysia | Options<any>, options?: Options<any>) {
		this.elysia = new Elysia();

		if (this.isElysiaApp(parentApp)) {
			this.parentElysia = parentApp;
			this.publishToSelf = this.parentElysia.config.websocket?.publishToSelf || false;
			this.plugins = options?.plugins || [];
		} else {
			this.parentElysia = undefined;
			this.publishToSelf = false;
			this.plugins = (parentApp as Options<any>)?.plugins || [];
		}

		this.clients = new Map();
		this.rooms = new Map();
		this.plugins.forEach(plugin => {
			if (plugin.init) plugin.init(this);
			if (plugin.createStore) {
				const stores = plugin.createStore();
				stores.filter(([, , options]) => options?.global ?? false).forEach(([key, value]) => {
					(this.elysia.store as any)[key] = value;
				});
			}
			if (plugin.exposeMethods) {
				const methods = plugin.exposeMethods(this);
				if (methods) {
					Object.keys(methods).forEach(methodName => {
						const method = methods[methodName];
						if (method) {
							(this as any)[methodName] = method.bind(plugin);
						}
					});
				}
			}
		});
		this.broadcast = (message: any) => {
			const client = this.clients.values().next().value;
			return broadcast(message, client, this.publishToSelf, BROADCAST_CHANNEL);
		};

		this.broadcastToRoom = (roomId: string, message: any) => {
			const client = this.clients.values().next().value;
			return broadcast(message, client, this.publishToSelf, roomId);
		};

		this.getClients = ({ specificRoom, onlySize }: GetClientsOptions) => {
			if (specificRoom) {
				const room = this.rooms.get(specificRoom);
				if (onlySize) return room?.clients.length || 0;
				return room?.clients || [];
			}

			const rooms = Array.from(this.rooms.values());
			if (onlySize) return rooms.reduce((acc, room) => acc + room.clients.length, 0);
			return rooms.flatMap(room => room.clients);
		};
	}

	private initializePluginStore(ws: any): void {
		const existingData = ws.data || {};
		ws.data = {
			...existingData,
			store: {},
			params: existingData.params || {}
		};

		this.plugins.forEach(plugin => {
			if (plugin.createStore) {
				const stores = plugin.createStore();
				stores.filter(([, , options]) => !options?.global).forEach(([key, value]) => {
					ws.data.store[key] = value;
				});
			}
		});
	}

	private generateCustomConnectionId(ws: any, defaultId: string): string {
		for (const plugin of this.plugins) {
			if (plugin.customConnectionId) {
				try {
					const customId = plugin.customConnectionId(ws, defaultId);
					if (customId && typeof customId === 'string') {
						if (!this.clients.has(customId)) return customId;
					}
				} catch (error) {
					console.error(`❌ [${plugin.name || 'Plugin'}] Custom ID:`, error);
				}
			}
		}

		return defaultId;
	}

	public create(path: string, callback: (route: RouteEmitter) => void) {
		const emitter: CustomEventEmitter = new TypedEventEmitter<WSEvents>() as CustomEventEmitter;
		const roomId = path;
		emitter.roomId = roomId;

		const joinRoom = (wsBase: any) => (roomId: string) => {
			wsBase.rooms.add(roomId);
			this.rooms.set(roomId, { clients: (this.rooms.get(roomId)?.clients || []).concat(wsBase) });
			wsBase.subscribe(roomId);
		};

		const leaveRoom = (wsBase: any) => (roomId: string) => {
			wsBase.rooms.delete(roomId);
			wsBase.unsubscribe(roomId);
			if (this.rooms.get(roomId)?.clients.length === 1) this.rooms.delete(roomId);
			else this.rooms.set(roomId, {
				clients: (this.rooms.get(roomId)?.clients || [])
					.filter(client => client.connectionId !== wsBase.connectionId)
			});
		};

		const broadcastToRoom = (wsBase: any) => (roomId: string, message: any) => {
			const client = wsBase.clients.values().next().value;
			return broadcast(message, client, wsBase.publishToSelf, roomId);
		};

		const syncFunctions = (ws: any) => {
			const { rooms, connectionId, store } = ws.data.data;

			ws.rooms = rooms;
			ws.connectionId = connectionId;
			ws.data.store = store;
			ws.joinRoom = joinRoom(ws);
			ws.leaveRoom = leaveRoom(ws);
			ws.broadcastToRoom = broadcastToRoom(ws);
		};

		this.elysia.ws(path, {
			beforeHandle: async (request: any) => {
				if (request.running) return;
				request.running = true;

				await this.initializePluginStore(request);
				const defaultId = uuidv4();
				this.plugins.forEach(plugin => plugin?.onPreReady?.(request as unknown as WSPreOpen, this));
				const connectionId = this.generateCustomConnectionId(request, defaultId);

				request.data.rooms = new Set();
				request.id = connectionId;
				request.data.connectionId = connectionId;
			},
			open: async (ws: any) => {
				this.clients.set(ws.connectionId, ws);
				syncFunctions(ws);
				ws.subscribe(BROADCAST_CHANNEL);
				ws.subscribe(roomId);
				ws.subscribe(ws.connectionId);
				ws.rooms.add(BROADCAST_CHANNEL);
				ws.rooms.add(roomId);
				ws.rooms.add(ws.connectionId);

				this.plugins.forEach(plugin => {
					if (plugin.onOpen) {
						plugin.onOpen(ws as unknown as WS, this);
					}
				});

				emitter.emit("open", ws);
			},
			message: (ws: any, message) => {
				syncFunctions(ws);
				this.plugins.forEach(plugin => plugin?.onMessage?.(ws as unknown as WS, message, this));
				emitter.emit("message", ws, message);
				return;
			},
			close: (ws: any) => {
				syncFunctions(ws);
				this.plugins.forEach(plugin => plugin?.onClose?.(ws as unknown as WS, this));
				emitter.emit("close", ws);
				if (ws.rooms) {
					ws.rooms.forEach((room: string) => {
						leaveRoom(ws)(room);
					});
				}
				this.clients.delete(ws.connectionId);
			}
		});

		this.parentElysia?.use(this.elysia);

		emitter.broadcast = (message: any) => broadcast(message, null, this.publishToSelf, roomId, this.clients);
		callback(emitter as unknown as RouteEmitter);
	}

	public getElysia() {
		return this.elysia;
	}

	public listen(port: number, callback?: () => void) {
		if (this.parentElysia) throw new Error("Cannot listen on a port when using a parent Elysia instance");
		return this.elysia.listen(port, callback);
	}
}


export function Websocket<TPlugins extends readonly BasePlugin<any>[]>(
	...args:
		| [options: Options<TPlugins>]
		| [parentApp: Elysia, options?: Options<TPlugins>]
): WebsocketBase & CombinePluginMethods<TPlugins> {
	let instance: WebsocketBase;

	if (args.length === 1) {
		instance = new WebsocketBase(args[0]);
	} else {
		instance = new WebsocketBase(args[0], args[1]);
	}

	return instance as WebsocketBase & CombinePluginMethods<TPlugins>;
}