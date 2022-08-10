export async function until(ready: () => boolean, callback: () => void, interval = 1000): Promise<void> {
    return await new Promise(resolve => {
        const intervalID = setInterval(() => {
            if (ready()) {
                callback();
                clearInterval(intervalID);
                resolve();
            };
        }, interval);
    });
}