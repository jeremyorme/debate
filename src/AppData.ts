import { AccessRights, ConflictResolution, IDb, IDbCollection } from "bonono-react";

export interface IGroup {
    name: string;
    percent: number;
}

export interface IDbEntry {
    _id: string;
    _clock: number;
    _identity: { publicKey: string };
}
export const dbEntryDefaults = { _id: '', _clock: 0, _identity: { publicKey: '' } };

export interface IGroup {
    name: string;
    percent: number;
}

export interface IDebate extends IDbEntry {
    title: string;
    description: string;
    startTime: string;
    endTime: string;
    groups: IGroup[];
}

export interface IMessage extends IDbEntry {
    description: string;
}

const byClockDescending = (a: IDbEntry, b: IDbEntry) => b._clock - a._clock;

// Handles collection entries and notifying updates
export class CollectionManager<TEntry> {
    private _collection: IDbCollection | null = null;
    private _callbacks: (() => void)[] = [];
    private _entries: TEntry[] = [];

    init(dbCollection: IDbCollection) {
        this._collection = dbCollection;
        this._collection.onUpdated(() => this._notifyUpdated());
        this._notifyUpdated();
    }

    private _notifyUpdated() {
        if (!this._collection)
            return;
        this._entries = Array.from(this._collection.all).map(kvp => kvp[1]).sort(byClockDescending);
        for (const cb of this._callbacks)
            cb();
    }

    entry(id: string): TEntry | null {
        return this._collection?.findOne({ _id: id });
    }

    entries(): TEntry[] {
        return this._entries || [];
    }

    onUpdated(callback: () => void) {
        // Add the updated callback
        this._callbacks.push(callback);

        // Return a callback that removes the updated callback
        return () => {
            const index = this._callbacks.indexOf(callback);
            if (index > -1)
                this._callbacks.splice(index, 1);
        }
    }

    addEntry(entry: TEntry) {
        this._collection?.insertOne(entry);
    }
}

// Central point for accessing all the app's data
export class AppData {
    private _db: IDb | null = null;

    async init(db: IDb) {
        this._db = db;
        await this._loadDebates();
    }

    // Debates

    private _debates: CollectionManager<IDebate> = new CollectionManager<IDebate>();

    private async _loadDebates() {
        if (!this._db)
            return;

        this._debates.init(await this._db.collection('debate', {
            publicAccess: AccessRights.ReadWrite,
            conflictResolution: ConflictResolution.FirstWriteWins
        }));
    }

    debates(): IDebate[] {
        return this._debates.entries();
    }

    onDebatesUpdated(callback: () => void) {
        return this._debates.onUpdated(callback);
    }

    addDebate(debate: IDebate) {
        this._debates.addEntry(debate);
    }

    debateTitle(debateId: string): string {
        return this._debates.entry(debateId)?.title || '<< Loading >>';
    }

    // Messages

    private _messages: Map<string, CollectionManager<IMessage>> = new Map(
        ['for', 'against'].map(s => [s, new CollectionManager<IMessage>()]));

    async loadMessages(debateId: string, side: string) {
        if (!this._db)
            return;

        const collectionName = 'debate-' + debateId + '-messages-' + side;
        this._messages.get(side)?.init(await this._db.collection(collectionName, {
            publicAccess: AccessRights.ReadWrite,
            conflictResolution: ConflictResolution.FirstWriteWins
        }));
    }

    messages(side: string): IMessage[] {
        return this._messages.get(side)?.entries() || [];
    }

    onMessages(side: string, callback: () => void) {
        return this._messages.get(side)?.onUpdated(callback);
    }

    addMessage(side: string, message: IMessage) {
        this._messages.get(side)?.addEntry(message);
    }
}