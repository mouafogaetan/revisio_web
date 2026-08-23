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

  // Récupérer le chemin demandé
  // Le chemin complet est dans req.url
  const path = req.url;
  
  // Cibler le dépôt GitHub contenant les données
  const targetBase = 'https://mouafogaetan.github.io/revisio_data';
  const targetUrl = `${targetBase}${path}`;
  
  console.log(`🔄 Proxy: ${targetUrl}`);
  
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