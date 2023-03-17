import { AccessRights, ConflictResolution, ICollectionOptions, IDb, IDbCollection } from "bonono-react";

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

export enum VoteDirection {
    Undecided,
    For,
    Against
}

export interface IVote extends IDbEntry {
    direction: VoteDirection;
}

export interface IPresentation extends IDbEntry {
    title: string;
    url: string;
}

const byClockDescending = (a: IDbEntry, b: IDbEntry) => b._clock - a._clock;

// Holds callbacks and notifies them
class Callbacks {
    private _callbacks: (() => void)[] = [];

    notify() {
        for (const cb of this._callbacks)
            cb();
    }

    on(callback: () => void) {
        // Add the updated callback
        this._callbacks.push(callback);

        // Return a callback that removes the updated callback
        return () => {
            const index = this._callbacks.indexOf(callback);
            if (index > -1)
                this._callbacks.splice(index, 1);
        }
    }
}

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

    async load(id: string, lowerClock: number = 0, creatorPublicKey: string | null = null) {
        if (!this._db)
            return;

        const manager = this._manager(id);
        if (manager.ready())
            return;

        const collectionName = `${this._name}-${id}-${this._subName}`;
        manager.init(await this._db.collection(collectionName,
            creatorPublicKey ?
                { ...this._options, lowerClock, creatorPublicKey } :
                { ...this._options, lowerClock }));
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

const everyoneAppend = {
    publicAccess: AccessRights.ReadWrite,
    conflictResolution: ConflictResolution.FirstWriteWins
};

const everyoneUpdateOwn = {
    publicAccess: AccessRights.ReadAnyWriteOwn,
    conflictResolution: ConflictResolution.LastWriteWins
};

const selfWriteOnce = {
    publicAccess: AccessRights.Read,
    conflictResolution: ConflictResolution.FirstWriteWins
};

// Central point for accessing all the app's data
export class AppData {
    private _home: PageData = new PageData();
    private _messages: PageData = new PageData();
    private _presentations: PageData = new PageData();

    init(db: IDb, selfPublicKey: string) {
        this._home.init(db, selfPublicKey);
        this._messages.init(db, selfPublicKey);
        this._presentations.init(db, selfPublicKey);
    }

    get home() { return this._home; }
    get messages() { return this._messages; }
    get presentations() { return this._presentations; }
}

export class PageData {
    private _db: IDb | null = null;
    private _selfPublicKey: string | null = null;
    private _callbacks: Callbacks = new Callbacks();
    private _debates: Collection<IDebate> = new Collection('debate', everyoneAppend);
    private _messagesFor: SubCollection<IMessage> = new SubCollection('debate', 'messages-for', everyoneAppend);
    private _messagesAgainst: SubCollection<IMessage> = new SubCollection('debate', 'messages-against', everyoneAppend);
    private _presentations: SubCollection<IPresentation> = new SubCollection('debate', 'presentations', everyoneUpdateOwn);
    private _votes: SubCollection<IVote> = new SubCollection('debate', 'votes', everyoneUpdateOwn);

    init(db: IDb, selfPublicKey: string) {
        this._db = db;
        this._selfPublicKey = selfPublicKey;
        this._debates.init(db);
        this._messagesFor.init(db, selfPublicKey);
        this._messagesAgainst.init(db, selfPublicKey);
        this._presentations.init(db, selfPublicKey);
        this._votes.init(db, selfPublicKey);
        this._callbacks.notify();
    }

    onInit(callback: () => void) {
        const remover = this._callbacks.on(callback);
        if (this._db)
            callback();
        return remover;
    }

    get selfPublicKey() { return this._selfPublicKey; }

    get debates() { return this._debates; }
    get messagesFor() { return this._messagesFor; }
    get messagesAgainst() { return this._messagesAgainst; }
    get presentations() { return this._presentations; }
    get votes() { return this._votes; }

    // Votes helpers

    ownVoteDirection(debateId: string): VoteDirection {
        if (!this._selfPublicKey)
            return VoteDirection.Undecided;
        return this._votes.entry(debateId, this._selfPublicKey)?.direction || VoteDirection.Undecided;
    }

    votesFor(debateId: string): number {
        return this._votes.entries(debateId).reduce((c, v) => c + v.direction == VoteDirection.For ? 1 : 0, 0);
    }

    votesAgainst(debateId: string): number {
        return this._votes.entries(debateId).reduce((c, v) => c + v.direction == VoteDirection.Against ? 1 : 0, 0);
    }
}
