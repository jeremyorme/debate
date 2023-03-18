import { IDb } from "bonono-react";
import { PageData } from "./PageData";

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

