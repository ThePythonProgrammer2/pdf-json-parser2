import mitt, { type Emitter, type Handler, type WildcardHandler } from "mitt";
export type EventMap = Record<string, unknown>;
export type EventHandler<T = unknown> = Handler<T>;
export type WildcardEventHandler<Events extends EventMap> = WildcardHandler<Events>;
export declare class CrossEventEmitter<Events extends EventMap = EventMap> {
    private emitter;
    constructor();
    on<Key extends keyof Events>(type: Key, handler: EventHandler<Events[Key]>): this;
    off<Key extends keyof Events>(type: Key, handler?: EventHandler<Events[Key]>): this;
    emit<Key extends keyof Events>(type: Key, event: Events[Key]): this;
    once<Key extends keyof Events>(type: Key, handler: EventHandler<Events[Key]>): this;
    onAny(handler: WildcardEventHandler<Events>): this;
    offAny(handler?: WildcardEventHandler<Events>): this;
    removeAllListeners<Key extends keyof Events>(type?: Key): this;
    listeners<Key extends keyof Events>(type: Key): Array<EventHandler<Events[Key]>>;
    listenerCount<Key extends keyof Events>(type: Key): number;
    hasListeners<Key extends keyof Events>(type: Key): boolean;
    eventNames(): Array<keyof Events>;
    addListener<Key extends keyof Events>(type: Key, handler: EventHandler<Events[Key]>): this;
    removeListener<Key extends keyof Events>(type: Key, handler: EventHandler<Events[Key]>): this;
    getRawEmitter(): Emitter<Events>;
}
export declare function createEventEmitter<Events extends EventMap = EventMap>(): CrossEventEmitter<Events>;
export { mitt };
