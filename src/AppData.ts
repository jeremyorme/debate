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

const makeCollectionKey = (debateId: string, pageId: string) => {
    return `${debateId}:${pageId}`;
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
        return this._entries || [];
    }

    onUpdated(callback: () => void) {
        return this._callbacks.on(callback);
    }

    addEntry(entry: TEntry) {
        this._collection?.insertOne(entry);
    }
}

// Central point for accessing all the app's data
export class AppData {
    private _db: IDb | null = null;
    private _selfPublicKey: string | null = null;
    private _callbacks: Callbacks = new Callbacks();

    async init(db: IDb, selfPublicKey: string) {
        this._db = db;
        this._selfPublicKey = selfPublicKey;
        this._callbacks.notify();
    }

    onInit(callback: () => void) {
        return this._callbacks.on(callback);
    }

    // Debates

    private _debates: CollectionManager<IDebate> = new CollectionManager<IDebate>();

    async loadDebates() {
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

    debate(debateId: string): IDebate | null {
        return this._debates.entry(debateId);
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

    // Votes

    private _votes: Map<string, CollectionManager<IVote>> = new Map();

    private _votesCollection(debateId: string, pageId: string): CollectionManager<IVote> {
        const key = makeCollectionKey(debateId, pageId);
        let votesCollection = this._votes.get(key);
        if (!votesCollection) {
            votesCollection = new CollectionManager<IVote>();
            this._votes.set(key, votesCollection);
        }
        return votesCollection;
    }

    async loadVotes(debateId: string, pageId: string) {
        if (!this._db)
            return;

        const collectionName = 'debate-' + debateId + '-votes';
        const collection = this._votesCollection(debateId, pageId);
        if (collection.ready())
            return;
        collection.init(await this._db.collection(collectionName, {
            publicAccess: AccessRights.ReadAnyWriteOwn,
            conflictResolution: ConflictResolution.LastWriteWins
        }));
    }

    closeVotes(debateId: string, pageId: string) {
        const key = makeCollectionKey(debateId, pageId);
        this._votes.get(key)?.close();
        this._votes.delete(key);
    }

    votes(debateId: string, pageId: string): IVote[] {
        return this._votesCollection(debateId, pageId).entries() || [];
    }

    onVotes(debateId: string, pageId: string, callback: () => void) {
        return this._votesCollection(debateId, pageId).onUpdated(callback);
    }

    addVote(debateId: string, pageId: string, message: IVote) {
        if (this._selfPublicKey)
            this._votesCollection(debateId, pageId).addEntry({ ...message, _id: this._selfPublicKey });
    }

    ownVoteDirection(debateId: string, pageId: string): VoteDirection {
        if (!this._selfPublicKey)
            return VoteDirection.Undecided;
        return this._votesCollection(debateId, pageId).entry(this._selfPublicKey)?.direction || VoteDirection.Undecided;
    }

    votesFor(debateId: string, pageId: string): number {
        return this.votes(debateId, pageId).reduce((c, v) => c + v.direction == VoteDirection.For ? 1 : 0, 0);
    }

    votesAgainst(debateId: string, pageId: string): number {
        return this.votes(debateId, pageId).reduce((c, v) => c + v.direction == VoteDirection.Against ? 1 : 0, 0);
    }

    // Presentations

    private _presentations: CollectionManager<IPresentation> = new CollectionManager<IPresentation>();

    async loadPresentations(debateId: string) {
        if (!this._db)
            return;

        const collectionName = 'debate-' + debateId + '-presentations';
        this._presentations.init(await this._db.collection(collectionName, {
            publicAccess: AccessRights.ReadAnyWriteOwn,
            conflictResolution: ConflictResolution.LastWriteWins
        }));
    }

    presentations(): IPresentation[] {
        return this._presentations.entries() || [];
    }

    onPresentations(callback: () => void) {
        return this._presentations.onUpdated(callback);
    }

    addPresentation(presentation: IPresentation) {
        if (this._selfPublicKey)
            this._presentations.addEntry({ ...presentation, _id: this._selfPublicKey });
    }
}