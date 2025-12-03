/**
 * Cloudflare Pages Function for proxying Stripe file images
 * Converts Stripe file links to direct image URLs
 */

/**
 * CORS headers for allowing requests from the website
 */
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequest(context) {
  const { request, env } = context;
  
  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
    });
  }

  // Only allow GET requests
  if (request.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    // Get the file link from query parameter
    const url = new URL(request.url);
    const fileLink = url.searchParams.get('url');
    
    if (!fileLink) {
      return new Response(
        JSON.stringify({ error: 'Missing url parameter' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if it's a Stripe file link
    if (!fileLink.includes('files.stripe.com/links/')) {
      return new Response(
        JSON.stringify({ error: 'Invalid file link' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Fetch the file from Stripe
    // Note: File links are download links, so we fetch and proxy the content
    // Stripe file links are typically public, but we can add auth if needed
    const stripeSecretKey = env.STRIPE_API_KEY_PRODUCTS;
    const headers = {
      'User-Agent': 'Mozilla/5.0',
    };
    
    // If we have an API key, we might need it for some file links
    // But file links are usually public, so try without first
    const fileResponse = await fetch(fileLink, {
      method: 'GET',
      headers: headers,
      redirect: 'follow',
    });

    if (!fileResponse.ok) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch image' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get the image data
    const imageData = await fileResponse.arrayBuffer();
    const contentType = fileResponse.headers.get('content-type') || 'image/jpeg';

    // Return the image with appropriate headers
    return new Response(imageData, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      },
    });
  } catch (error) {
    console.error('Image proxy error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}

