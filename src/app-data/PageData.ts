import { AccessRights, ConflictResolution, IDb } from "bonono-react";
import { Callbacks } from "./Callbacks";
import { Collection } from "./Collection";
import { IArchivedDebate } from "./IArchivedDebate";
import { IDebate } from "./IDebate";
import { IMessage } from "./IMessage";
import { IPresentation } from "./IPresentation";
import { IStartCode } from "./IStartCode";
import { IVote, VoteDirection } from "./IVote";
import { SubCollection } from "./SubCollection";

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

export class PageData {
    private _db: IDb | null = null;
    private _selfPublicKey: string | null = null;
    private _callbacks: Callbacks = new Callbacks();
    private _debates: Collection<IDebate> = new Collection('debate', everyoneAppend);
    private _messagesFor: SubCollection<IMessage> = new SubCollection('debate', 'messages-for', everyoneAppend);
    private _messagesAgainst: SubCollection<IMessage> = new SubCollection('debate', 'messages-against', everyoneAppend);
    private _presentations: SubCollection<IPresentation> = new SubCollection('debate', 'presentations', everyoneUpdateOwn);
    private _votes: SubCollection<IVote> = new SubCollection('debate', 'votes', everyoneUpdateOwn);
    private _startCodes: SubCollection<IStartCode> = new SubCollection('debate', 'startcodes', selfWriteOnce, true);
    private _archivedDebates: SubCollection<IArchivedDebate> = new SubCollection('debate', 'archived', selfWriteOnce, true);

    init(db: IDb, selfPublicKey: string) {
        this._db = db;
        this._selfPublicKey = selfPublicKey;
        this._debates.init(db);
        this._messagesFor.init(db, selfPublicKey);
        this._messagesAgainst.init(db, selfPublicKey);
        this._presentations.init(db, selfPublicKey);
        this._votes.init(db, selfPublicKey);
        this._startCodes.init(db, selfPublicKey);
        this._archivedDebates.init(db, selfPublicKey);
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
    get startCodes() { return this._startCodes; }
    get archivedDebates() { return this._archivedDebates; }

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
