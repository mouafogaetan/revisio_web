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

  const targetBase = process.env.VITE_API_URL || 'https://mouafogaetan.github.io/revisio_data';
  const requestUrl = new URL(req.url || '/', 'http://localhost');
  const rawPath = requestUrl.pathname;
  const cleanPath = rawPath.replace(/^\/api\/revisio_data/, '') || '/';
  const targetUrl = new URL(cleanPath.replace(/^\/+/, ''), `${targetBase}/`);
  targetUrl.search = requestUrl.search;

  console.log(`🔄 Proxy: ${requestUrl.pathname}${requestUrl.search} -> ${targetUrl.toString()}`);
  
  try {
    const response = await fetch(targetUrl, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    // Vérifier si la réponse est OK
    if (!response.ok) {
      console.error(`❌ Erreur HTTP: ${response.status} pour ${targetUrl}`);
      res.status(response.status).json({ 
        error: `HTTP ${response.status}`,
        message: `Impossible de récupérer les données depuis ${targetUrl}`
      });
      return;
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';

    // Les fichiers image / assets ne sont pas du JSON ; on les renvoie bruts.
    if (!contentType.includes('application/json') && !contentType.includes('+json')) {
      const buffer = Buffer.from(await response.arrayBuffer());
      res.setHeader('Content-Type', contentType);
      res.status(200).send(buffer);
      return;
    }
    
    const data = await response.text();
    
    // Vérifier que le contenu est du JSON
    try {
      JSON.parse(data);
    } catch (e) {
      console.error('❌ La réponse n\'est pas du JSON valide:', data.substring(0, 200));
      res.status(500).json({ 
        error: 'Invalid JSON response',
        message: 'Le serveur a renvoyé une réponse invalide'
      });
      return;
    }
    
    // Ajouter les headers CORS
    res.setHeader('Content-Type', 'application/json');
    res.status(200).send(data);
  } catch (error) {
    console.error('❌ Proxy error:', error.message);
    res.status(500).json({ 
      error: 'Proxy error', 
      message: error.message 
    });
  }
}

export const config = {
  api: {
    externalResolver: true,
  },
};