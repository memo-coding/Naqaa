/**
 * whitelist-ip.js
 * Run with: node whitelist-ip.js
 * Automatically adds your current public IP to MongoDB Atlas whitelist.
 */

const https = require('https');
const crypto = require('crypto');

// --- FILL THESE IN ---
const ATLAS_PUBLIC_KEY  = process.env.ATLAS_PUBLIC_KEY  || 'YOUR_PUBLIC_KEY';
const ATLAS_PRIVATE_KEY = process.env.ATLAS_PRIVATE_KEY || 'YOUR_PRIVATE_KEY';
const ATLAS_PROJECT_ID  = process.env.ATLAS_PROJECT_ID  || 'YOUR_PROJECT_ID';
// ---------------------

// Step 1: Get current public IP
function getPublicIP() {
  return new Promise((resolve, reject) => {
    https.get('https://api.ipify.org?format=json', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data).ip));
    }).on('error', reject);
  });
}

// Step 2: Add IP to Atlas whitelist using Digest Auth
function addIPToAtlas(ip) {
  return new Promise((resolve, reject) => {
    const path = `/api/atlas/v1.0/groups/${ATLAS_PROJECT_ID}/accessList`;
    const body = JSON.stringify([{ ipAddress: ip, comment: 'Auto-added by script' }]);

    // First request to get the nonce
    const options = {
      hostname: 'cloud.mongodb.com',
      path,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    };

    const req1 = https.request(options, (res1) => {
      const wwwAuth = res1.headers['www-authenticate'] || '';
      const realm   = (wwwAuth.match(/realm="([^"]+)"/)   || [])[1] || '';
      const nonce   = (wwwAuth.match(/nonce="([^"]+)"/)   || [])[1] || '';
      const qop     = (wwwAuth.match(/qop="([^"]+)"/)     || [])[1] || 'auth';
      const nc      = '00000001';
      const cnonce  = crypto.randomBytes(8).toString('hex');
      const uri     = path;

      const ha1 = crypto.createHash('md5').update(`${ATLAS_PUBLIC_KEY}:${realm}:${ATLAS_PRIVATE_KEY}`).digest('hex');
      const ha2 = crypto.createHash('md5').update(`POST:${uri}`).digest('hex');
      const response = crypto.createHash('md5').update(`${ha1}:${nonce}:${nc}:${cnonce}:${qop}:${ha2}`).digest('hex');

      const authHeader = `Digest username="${ATLAS_PUBLIC_KEY}", realm="${realm}", nonce="${nonce}", uri="${uri}", nc=${nc}, cnonce="${cnonce}", qop=${qop}, response="${response}"`;

      const options2 = {
        hostname: 'cloud.mongodb.com',
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
          'Authorization': authHeader
        }
      };

      const req2 = https.request(options2, (res2) => {
        let data = '';
        res2.on('data', chunk => data += chunk);
        res2.on('end', () => {
          if (res2.statusCode === 200 || res2.statusCode === 201) {
            resolve({ success: true, ip });
          } else {
            resolve({ success: false, status: res2.statusCode, body: data });
          }
        });
      });
      req2.on('error', reject);
      req2.write(body);
      req2.end();
    });
    req1.on('error', reject);
    req1.write(body);
    req1.end();
  });
}

async function main() {
  console.log('🔍 Getting current public IP...');
  const ip = await getPublicIP();
  console.log(`📡 Your IP: ${ip}`);
  console.log('🔐 Adding to MongoDB Atlas whitelist...');
  const result = await addIPToAtlas(ip);
  if (result.success) {
    console.log(`✅ IP ${result.ip} added successfully! Wait ~30 seconds then restart backend.`);
  } else {
    console.error(`❌ Failed (${result.status}):`, result.body);
    console.log('\n💡 Make sure your ATLAS_PUBLIC_KEY, ATLAS_PRIVATE_KEY, and ATLAS_PROJECT_ID are correct.');
  }
}

main().catch(console.error);
