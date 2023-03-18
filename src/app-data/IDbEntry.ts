export interface IDbEntry {
    _id: string;
    _clock: number;
    _identity: { publicKey: string };
}

export const dbEntryDefaults = { _id: '', _clock: 0, _identity: { publicKey: '' } };
