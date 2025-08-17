import type { BasePlugin, PluginCloseHandler, PluginCustomIdHandler, PluginInitHandler, PluginMessageHandler, PluginMethodsFactory, PluginOpenHandler, PluginPreOpenHandler, PluginStoreFactory } from "./types";

export class Plugin<TMethods = {}> {
	public name?: string;
	private _init?: PluginInitHandler;
	private _createStore?: PluginStoreFactory;
	private _exposeMethods?: PluginMethodsFactory<TMethods>;
	private _customConnectionId?: PluginCustomIdHandler;
	private _onPreReady?: PluginPreOpenHandler;
	private _onOpen?: PluginOpenHandler;
	private _onMessage?: PluginMessageHandler;
	private _onClose?: PluginCloseHandler;

	constructor(pluginName?: string) {
		this.name = pluginName;
	}

	setName(name: string): Plugin<TMethods> {
		this.name = name;
		return this;
	}

	onInit(handler: PluginInitHandler): Plugin<TMethods> {
		this._init = handler;
		return this;
	}

	withStore(storeFactory: PluginStoreFactory): Plugin<TMethods> {
		this._createStore = storeFactory;
		return this;
	}

	withMethods<TNewMethods>(methodsFactory: PluginMethodsFactory<TNewMethods>): Plugin<TNewMethods> {
		const newPlugin = this as unknown as Plugin<TNewMethods>;
		newPlugin._exposeMethods = methodsFactory;
		return newPlugin;
	}

	onCustomId(handler: PluginCustomIdHandler): Plugin<TMethods> {
		this._customConnectionId = handler;
		return this;
	}

	onPreReady(handler: PluginPreOpenHandler): Plugin<TMethods> {
		this._onPreReady = handler;
		return this;
	}

	onOpen(handler: PluginOpenHandler): Plugin<TMethods> {
		this._onOpen = handler;
		return this;
	}

	onMessage(handler: PluginMessageHandler): Plugin<TMethods> {
		this._onMessage = handler;
		return this;
	}

	onClose(handler: PluginCloseHandler): Plugin<TMethods> {
		this._onClose = handler;
		return this;
	}

	build(): BasePlugin<TMethods> {
		return {
			name: this.name,
			init: this._init,
			createStore: this._createStore,
			exposeMethods: this._exposeMethods,
			customConnectionId: this._customConnectionId,
			onPreReady: this._onPreReady,
			onOpen: this._onOpen,
			onMessage: this._onMessage,
			onClose: this._onClose
		} as BasePlugin<TMethods>;
	}
}