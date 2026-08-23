// api/proxy.js
export default async function handler(req, res) {
  // Autoriser CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Récupérer le chemin demandé depuis l'URL
  const url = req.url;
  const targetUrl = `https://mouafogaetan.github.io/revisio_data${url}`;
  
  console.log(`🔄 Proxy: ${targetUrl}`);
  
  try {
    const response = await fetch(targetUrl, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    const data = await response.text();
    
    // Ajouter les headers CORS
    res.setHeader('Content-Type', response.headers.get('content-type') || 'application/json');
    res.status(response.status).send(data);
  } catch (error) {
    console.error('❌ Proxy error:', error);
    res.status(500).json({ error: 'Proxy error', message: error.message });
  }
}

// Configuration pour Vercel
export const config = {
  api: {
    externalResolver: true,
  },
};