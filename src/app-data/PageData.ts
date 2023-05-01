import { AccessRights, ConflictResolution, IDb } from "bonono-react";
import { Callbacks } from "./Callbacks";
import { Collection } from "./Collection";
import { IArchivedDebate } from "./IArchivedDebate";
import { IDebate, IGroup } from "./IDebate";
import { ILikes } from "./ILikes";
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

export interface IVoteTotals {
    votesFor: number;
    votesAgainst: number;
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

    private _debateLikes: Collection<ILikes> = new Collection('debatelikes', everyoneUpdateOwn);
    private _messageForLikes: SubCollection<ILikes> = new SubCollection('debatelikes', 'messages-for', everyoneUpdateOwn);
    private _messageAgainstLikes: SubCollection<ILikes> = new SubCollection('debatelikes', 'messages-against', everyoneUpdateOwn);
    private _presentationLikes: SubCollection<ILikes> = new SubCollection('debatelikes', 'presentations', everyoneUpdateOwn);

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

        this._debateLikes.init(db);
        this._messageForLikes.init(db, selfPublicKey);
        this._messageAgainstLikes.init(db, selfPublicKey);
        this._presentationLikes.init(db, selfPublicKey);

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

    get debateLikes() { return this._debateLikes; }
    get messageForLikes() { return this._messageForLikes; }
    get messageAgainstLikes() { return this._messageAgainstLikes; }
    get presentationLikes() { return this._presentationLikes; }

    // Votes helpers

    ownVoteDirection(debateId: string): VoteDirection {
        if (!this._selfPublicKey)
            return VoteDirection.Undecided;
        return this._votes.entry(debateId, this._selfPublicKey)?.direction || VoteDirection.Undecided;
    }

    ownVoteGroupIdx(debateId: string): number {
        if (!this._selfPublicKey)
            return -1;
        const groupIdx = this._votes.entry(debateId, this._selfPublicKey)?.groupIdx;
        return (groupIdx || groupIdx == 0) ? groupIdx : -1;
    }

    debateGroups(debateId: string): IGroup[] {
        let groups = this._debates.entry(debateId)?.groups || [];

        // Sum group.percent to get total percent
        const totalPercent = groups.reduce((t, g) => t + g.percent, 0.);

        // If all vote share not accounted for, add default group with remainder
        if (totalPercent < 100)
            groups.push({ name: 'Default', percent: 100 - totalPercent });

        // If vote share exceeds total, scale groups to sum to 100%
        else if (totalPercent > 100)
            groups = groups.map(g => ({ ...g, percent: g.percent * 100. / totalPercent }));

        return groups;
    }

    voteTotals(debateId: string): IVoteTotals {
        const groups = this.debateGroups(debateId);

        // Count group votes
        const groupVotesTotal: number[] = groups.map(_ => 0);
        const groupVotesFor: number[] = groups.map(_ => 0);
        const groupVotesAgainst: number[] = groups.map(_ => 0);
        this._votes.entries(debateId).forEach(vote => {
            if (vote.groupIdx < groupVotesFor.length) {
                ++groupVotesTotal[vote.groupIdx];
                if (vote.direction == VoteDirection.For)
                    ++groupVotesFor[vote.groupIdx];
                else if (vote.direction == VoteDirection.Against)
                    ++groupVotesAgainst[vote.groupIdx];
            }
        });

        // Aggregate total votes
        const votesTotal = groupVotesTotal.reduce((t, c) => t + c);

        // Compute % of total votes cast by each group
        const groupVotesPercentActual = groupVotesTotal.map(c => votesTotal > 0. ? 100. * c / votesTotal : 0.);

        // Compute vote weighting needed to scale each group's votes to have the
        // correct percentage contribution to the final result.
        // If a group has no votes then its weighting is set to zero.
        const groupVoteWeights = groupVotesPercentActual.map((c, i) => c > 0. ? groups[i].percent / c : 0.);

        // Return the sum of the votes from all groups with weightings applied
        return {
            votesFor: groupVotesFor.reduce((t, c, i) => t + c * groupVoteWeights[i], 0.),
            votesAgainst: groupVotesAgainst.reduce((t, c, i) => t + c * groupVoteWeights[i], 0.)
        };
    }
}
