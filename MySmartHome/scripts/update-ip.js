const fs = require('fs');
const path = require('path');
const os = require('os');

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  const candidates = [];

  for (const interfaceName in interfaces) {
    const addresses = interfaces[interfaceName];
    for (const addr of addresses) {
      if (addr.family === 'IPv4' && !addr.internal) {
        candidates.push(addr.address);
      }
    }
  }

  // Prioritize common home network subnets
  // Filter out potential gateway IPs ending in .1
  const preferred = candidates.find(ip => 
    (ip.startsWith('192.168.1.') || ip.startsWith('192.168.0.')) && 
    !ip.endsWith('.1')
  );
  if (preferred) return preferred;

  // Fallback: exclude VirtualBox and prefer non-.1 IPs
  const nonVirtual = candidates.find(ip => 
    !ip.startsWith('192.168.56.') && 
    !ip.endsWith('.1')
  );
  if (nonVirtual) return nonVirtual;

  return candidates.length > 0 ? candidates[0] : 'localhost';
}

const updateConfig = () => {
  const configPath = path.join(__dirname, '../src/config.ts');
  const ip = getLocalIP();
  
  try {
    let content = fs.readFileSync(configPath, 'utf8');
    
    // Regex to match API_BASE_URL: 'http://<ip>:8000'
    const regex = /API_BASE_URL:\s*'http:\/\/[\d\w\.]+:\d+'/g;
    const newContent = content.replace(regex, `API_BASE_URL: 'http://${ip}:8000'`);
    
    if (content !== newContent) {
      fs.writeFileSync(configPath, newContent, 'utf8');
      console.log(`[Auto-Config] Updated API_BASE_URL to http://${ip}:8000`);
    } else {
      console.log(`[Auto-Config] IP is already up to date: ${ip}`);
    }
  } catch (error) {
    console.error('[Auto-Config] Error updating config:', error);
  }
};

updateConfig();
