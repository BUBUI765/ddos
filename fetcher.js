const axios = require('axios'); // You might need: npm install axios
const fs = require('fs');

const sources = [
    "https://api.proxyscrape.com/v2/?request=getproxies&protocol=http&timeout=10000&country=all&ssl=all&anonymity=all",
    "https://www.proxy-list.download/api/v1/get?type=http",
    "https://raw.githubusercontent.com/TheSpeedX/SOCKS-List/master/http.txt"
];

async function getProxies() {
    console.log("Searching for free proxies...");
    let allProxies = [];

    for (let url of sources) {
        try {
            const res = await axios.get(url);
            const list = res.data.split('\n').map(p => p.trim()).filter(p => p.length > 0);
            allProxies = [...allProxies, ...list];
            console.log(`✅ Found ${list.length} from source.`);
        } catch (e) {
            console.log(`❌ Source failed: ${url}`);
        }
    }

    // Remove duplicates and save
    const unique = [...new Set(allProxies)];
    fs.writeFileSync('proxies.txt', unique.join('\n'));
    console.log(`\n🔥 Success! Saved ${unique.length} proxies to proxies.txt`);
}

getProxies();
