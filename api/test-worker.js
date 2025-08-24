export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Test endpoint semplice
    if (url.pathname === '/test') {
      return new Response(JSON.stringify({ 
        status: 'ok',
        message: 'Worker funziona!'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Endpoint contact
    if (url.pathname === '/api/contact' && request.method === 'POST') {
      try {
        const data = await request.json();
        
        // Log per debug
        console.log('Ricevuto:', data);
        
        // Risposta di test
        return new Response(JSON.stringify({ 
          success: true,
          message: 'Test ricevuto correttamente',
          data: data
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({ 
          success: false,
          error: error.message
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    // Default 404
    return new Response('Not Found', { status: 404 });
  }
};