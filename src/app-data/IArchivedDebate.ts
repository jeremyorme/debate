import { IDbEntry } from "./IDbEntry";
import { IMessage } from "./IMessage";
import { IPresentation } from "./IPresentation";

export interface IArchivedDebate extends IDbEntry {
    messagesFor: IMessage[];
    messagesAgainst: IMessage[];
    presentations: IPresentation[];
    votesFor: number;
    votesAgainst: number;
}
