const https = require('https');

async function quickDeploymentCheck() {
  return new Promise((resolve, reject) => {
    console.log('🔍 Checking api.js file deployment status...');
    
    const options = {
      hostname: 'it-era.pages.dev',
      port: 443,
      path: '/admin/js/api.js',
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const hasFixedLogic = data.includes("endpoint.startsWith('http')");
        const contentLength = data.length;
        const lastModified = res.headers['last-modified'];
        
        console.log(`📄 File Length: ${contentLength} chars`);
        console.log(`📅 Last Modified: ${lastModified || 'Not available'}`);
        console.log(`🔧 Has Fixed Logic: ${hasFixedLogic ? '✅ YES' : '❌ NO'}`);
        
        if (hasFixedLogic) {
          console.log('🎉 DEPLOYMENT COMPLETE! Fixed version is now live!');
          resolve(true);
        } else {
          console.log('⏳ Still waiting for deployment...');
          resolve(false);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Request failed:', error.message);
      reject(error);
    });
    
    req.setTimeout(10000, () => {
      console.log('⏰ Request timeout');
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

quickDeploymentCheck().catch(console.error);