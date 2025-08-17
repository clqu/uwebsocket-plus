// @ts-nocheck
import type { ElysiaWS } from "elysia/ws";
import { EventEmitter } from 'node:events';
import type { WebsocketBase } from "./websocket";

export type WSEvents = {
	open: (ws: WS) => void;
	message: (ws: WS, message: any) => void;
	close: (ws: WS) => void;
};

export interface PluginStore {
	[key: string]: any;
}

export type PluginMethods<T = {}> = T;

export interface BasePlugin<TMethods = {}> {
	name?: string;
	init?(websocket: WebsocketBase): void;
	createStore?(): [string, any, { global?: boolean }?][];
	exposeMethods?(websocket: WebsocketBase): TMethods;
	customConnectionId?: PluginCustomIdHandler;
	onPreReady?: PluginPreOpenHandler;
	onOpen?: PluginOpenHandler;
	onMessage?: PluginMessageHandler;
	onClose?: PluginCloseHandler;
}

export type PluginPreOpenHandler = (ws: WSPreOpen, websocket: WebsocketBase) => void;
export type PluginOpenHandler = (ws: WS, websocket: WebsocketBase) => void;
export type PluginMessageHandler = (ws: WS, message: any, websocket: WebsocketBase) => void;
export type PluginCloseHandler = (ws: WS, websocket: WebsocketBase) => void;
export type PluginCustomIdHandler = (ws: WSPreOpen, defaultId: string) => string | null;
export type PluginInitHandler = (websocket: WebsocketBase) => void;
export type PluginStoreFactory = () => [string, any, { global?: boolean }?][];
export type PluginMethodsFactory<T = {}> = (websocket: WebsocketBase) => T;

export type CombinePluginMethods<T extends readonly BasePlugin<any>[]> =
	T extends readonly [BasePlugin<infer M1>, ...infer Rest]
	? Rest extends readonly BasePlugin<any>[]
	? M1 & CombinePluginMethods<Rest>
	: M1
	: {};

export interface Options<TPlugins extends readonly BasePlugin<any>[] = BasePlugin<any>[]> {
	plugins?: TPlugins;
}

export type WS = ElysiaWS<any> & {
	joinRoom: (roomId: string) => void;
	leaveRoom: (roomId: string) => void;
	getRooms: (options?: { findById?: string }) => string[] | boolean;
	data: {
		store: PluginStore;
		params: { [key: string]: any };
		headers?: { [key: string]: string };
		query?: { [key: string]: string };
	};
	rooms: Set<string>;
	connectionId: string;
};

export type WSPreOpen = Omit<WS, "joinRoom" | "leaveRoom" | "getRooms"> & {
	data: {
		store: PluginStore;
		params: { [key: string]: any };
		headers?: { [key: string]: string };
		query?: { [key: string]: string };
	};
};

export type RouteEmitter = {
	roomId: string;
	on(event: "open", callback: (client: WS) => void): void;
	on(event: "message", callback: (client: WS, message: any) => void): void;
	on(event: "close", callback: (client: WS) => void): void;
	broadcast(message: any): void;
	broadcastToRoom(roomId: string, message: any): void;
	getRooms(): string[];
	data: WSPreOpen["data"];
};

export type EventType<T> = T | keyof WSEvents;
export class TypedEventEmitter<Events extends Record<string, (...args: any[]) => void>>
	extends EventEmitter {
	// @ts-ignore
	override on<K extends keyof Events>(event: EventType<K>, listener: Events[K]): this {
		return super.on(event as string | symbol, listener as (...args: any[]) => void);
	}

	// @ts-ignore
	override once<K extends keyof Events>(event: EventType<K>, listener: Events[K]): this {
		return super.once(event as string | symbol, listener as (...args: any[]) => void);
	}

	// @ts-ignore
	override off<K extends keyof Events>(event: EventType<K>, listener: Events[K]): this {
		return super.off(event as string | symbol, listener as (...args: any[]) => void);
	}

	override emit<K extends keyof Events>(
		event: K | string | symbol,
		...args: any[]
	): boolean {
		return super.emit(event as string | symbol, ...args);
	}
}

export type CustomEventEmitter = TypedEventEmitter<WSEvents> & {
	broadcast: (message: any) => void;
	roomId: string;
};

export type GetClientsOptions = {
	specificRoom?: string;
	onlySize?: boolean;
};