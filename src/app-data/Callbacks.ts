// Holds callbacks and notifies them
export class Callbacks {
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
