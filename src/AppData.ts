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

export class AppData {
    private _debatesCollection: IDbCollection | null = null;
    private _debateCallbacks: (() => void)[] = [];
    private _debates: IDebate[] = [];

    private _notifyDebatesUpdated() {
        if (!this._debatesCollection)
            return;
        this._debates = Array.from(this._debatesCollection.all).map(kvp => kvp[1]);
        for (const cb of this._debateCallbacks)
            cb();
    }

    async init(db: IDb) {
        this._debatesCollection = await db.collection("debate", { publicAccess: AccessRights.ReadWrite, conflictResolution: ConflictResolution.FirstWriteWins });
        this._debatesCollection.onUpdated(() => this._notifyDebatesUpdated());
        this._notifyDebatesUpdated()
    }

    debates(): IDebate[] {
        return this._debates;
    }

    onDebatesUpdated(callback: () => void) {
        this._debateCallbacks.push(callback);
    }

    addDebate(debate: IDebate) {
        this._debatesCollection?.insertOne(debate);
    }
}