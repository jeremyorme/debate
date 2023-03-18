import { IDb, ICollectionOptions } from "bonono-react";
import { CollectionManager } from "./CollectionManager";

export class Collection<TEntry>
{
    private _db: IDb | null = null;
    private _manager: CollectionManager<TEntry> = new CollectionManager();

    constructor(private _name: string, private _options: Partial<ICollectionOptions>) { }

    init(db: IDb) {
        this._db = db;
    }

    async load() {
        if (!this._db)
            return;

        this._manager.init(await this._db.collection(this._name, this._options));
    }

    entries(): TEntry[] {
        return this._manager.entries();
    }

    onUpdated(callback: () => void) {
        return this._manager.onUpdated(callback);
    }

    addEntry(entry: TEntry) {
        this._manager.addEntry(entry);
    }

    entry(id: string): TEntry | null {
        return this._manager.entry(id);
    }
}
