export async function until(ready: () => boolean, callback: () => void, interval = 1000): Promise<void> {
    return await new Promise(resolve => {
        let maxAttempts = 5;
        const start = new Date();
        const intervalID = setInterval(() => {
            if (ready()) {
                callback();
                clearInterval(intervalID);
                resolve();
            };
            maxAttempts--;
            if (maxAttempts == 0) {
                const seconds = (new Date()).getTime() - start.getTime();
                console.log(`reached max attempts of ${maxAttempts} after ${seconds} seconds`);
                clearInterval(intervalID);
                resolve();
            }
        }, interval);
    });
}