export async function run(ready: () => boolean, callback: () => void, interval = 1000, timeOut = 10000): Promise<void> {
    const start = new Date().getTime();
    if(!ready() && (new Date().getTime() - start <= timeOut)) {
        console.log("retry")
        await new Promise(r => setTimeout(() => run(ready, callback, interval), interval));
     } else {
        callback();
        console.log("callback done");
    }
    return;
}