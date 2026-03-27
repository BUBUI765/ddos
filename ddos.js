const net = require('net');

// ================== CONFIG ==================
const TARGET_IP = "104.234.6.0"; 
const TARGET_PORT = 25565;
const MAX_CONCURRENT = 300; // Lower is better for accurate ping tracking
const TIMEOUT_MS = 500;     // Higher timeout allows ping to be measured on slow links
const BATCH_DELAY = 100;    
// ============================================

let stats = { 
    success: 0, 
    failed: 0, 
    timeout: 0, 
    active: 0,
    lastPing: 0,
    avgPing: 0,
    pingCount: 0 
};

function attemptConnection() {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        const startTime = process.hrtime(); // Start the clock
        stats.active++;

        socket.setTimeout(TIMEOUT_MS);

        socket.on('connect', () => {
            const diff = process.hrtime(startTime);
            const ms = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2); // Convert to MS
            
            stats.success++;
            stats.lastPing = ms;
            
            // Calculate running average
            stats.pingCount++;
            stats.avgPing = ((parseFloat(stats.avgPing) * (stats.pingCount - 1) + parseFloat(ms)) / stats.pingCount).toFixed(2);
            
            socket.destroy();
            resolve();
        });

        socket.on('error', () => {
            stats.failed++;
            socket.destroy();
            resolve();
        });

        socket.on('timeout', () => {
            stats.timeout++;
            socket.destroy();
            resolve();
        });

        socket.connect(TARGET_PORT, TARGET_IP);
    }).finally(() => {
        stats.active--;
    });
}

async function run() {
    // UI Update Loop
    setInterval(() => {
        console.clear();
        console.log(`--- [ ADVANCED NETWORK MONITOR ] ---`);
        console.log(`Target:  ${TARGET_IP}:${TARGET_PORT}`);
        console.log(`Active:  ${stats.active} / ${MAX_CONCURRENT}`);
        console.log(`------------------------------------`);
        console.log(`✅ Success: ${stats.success}`);
        console.log(`❌ Refused: ${stats.failed}`);
        console.log(`⏳ Dropped: ${stats.timeout}`);
        console.log(`------------------------------------`);
        console.log(`📡 Last Ping: ${stats.lastPing} ms`);
        console.log(`📊 Avg Ping:  ${stats.avgPing} ms`);
        console.log(`------------------------------------`);
    }, 1000);

    while (true) {
        if (stats.active < MAX_CONCURRENT) {
            attemptConnection();
        }
        await new Promise(r => setTimeout(r, BATCH_DELAY));
    }
}

run().catch(console.error);
