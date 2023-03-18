import { IDbCollection } from "bonono-react";
import { Callbacks } from "./Callbacks";
import { IDbEntry } from "./IDbEntry";

const byClockDescending = (a: IDbEntry, b: IDbEntry) => b._clock - a._clock;

// Handles collection entries and notifying updates
export class CollectionManager<TEntry> {
    private _collection: IDbCollection | null = null;
    private _callbacks: Callbacks = new Callbacks();
    private _entries: TEntry[] = [];

    init(dbCollection: IDbCollection) {
        this._collection = dbCollection;
        this._collection.onUpdated(() => this._notifyUpdated());
        this._notifyUpdated();
    }

    ready(): boolean {
        return !!this._collection;
    }

    close() {
        this._collection?.close();
        this._collection = null;
        this._entries = [];
    }

    private _notifyUpdated() {
        if (!this._collection)
            return;
        this._entries = Array.from(this._collection.all).map(kvp => kvp[1]).sort(byClockDescending);
        this._callbacks.notify();
    }

    entry(id: string): TEntry | null {
        return this._collection?.findOne({ _id: id });
    }

    entries(): TEntry[] {
        return this._entries;
    }

    onUpdated(callback: () => void) {
        return this._callbacks.on(callback);
    }

    addEntry(entry: TEntry) {
        return this._collection?.insertOne(entry);
    }
}
