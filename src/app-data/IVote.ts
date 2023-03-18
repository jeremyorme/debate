import { IDbEntry } from "./IDbEntry";

export enum VoteDirection {
    Undecided,
    For,
    Against
}

export interface IVote extends IDbEntry {
    direction: VoteDirection;
}
