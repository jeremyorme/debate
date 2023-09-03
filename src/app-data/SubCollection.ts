import { IDb, ICollectionOptions, AccessRights } from "bonono";
import { CollectionManager } from "./CollectionManager";
import { IStartCode } from "./IStartCode";

export class SubCollection<TEntry>
{
    private _db: IDb | null = null;
    private _selfPublicKey: string | null = null;
    private _managers: Map<string, CollectionManager<TEntry>> = new Map();

    constructor(
        private _name: string,
        private _subName: string,
        private _options: Partial<ICollectionOptions>,
        private _singular: boolean = false) { }

    init(db: IDb, selfPublicKey: string) {
        this._db = db;
        this._selfPublicKey = selfPublicKey;
    }

    private _manager(id: string): CollectionManager<TEntry> {
        let manager = this._managers.get(id);
        if (!manager) {
            manager = new CollectionManager();
            this._managers.set(id, manager);
        }
        return manager;
    }

    async load(id: string, startCode: IStartCode | null = null, creatorPublicKey: string | null = null) {
        if (!this._db)
            return;

        const manager = this._manager(id);
        if (manager.ready())
            return;

        let collectionName = `${this._name}-${id}-${this._subName}`
        if (startCode)
            collectionName += `-${startCode.value}`;
        manager.init(await this._db.collection(collectionName,
            creatorPublicKey ?
                { ...this._options, creatorPublicKey } :
                { ...this._options }));
    }

    close(id: string) {
        this._managers.get(id)?.close();
        this._managers.delete(id);
    }

    entries(id: string): TEntry[] {
        return this._manager(id).entries() || [];
    }

    onUpdated(id: string, callback: () => void) {
        return this._manager(id).onUpdated(callback);
    }

    addEntry(id: string, entry: TEntry) {
        const e: any = { ...entry };
        if (this._options.publicAccess == AccessRights.ReadAnyWriteOwn && this._selfPublicKey)
            e._id = this._selfPublicKey;
        else if (this._singular)
            e._id = 'default';

        return this._manager(id).addEntry(e);
    }

    entry(id: string, subId: string = 'default'): TEntry | null {
        return this._manager(id).entry(subId);
    }
}
