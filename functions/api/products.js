/**
 * Cloudflare Pages Function for fetching Stripe Products
 * Returns a list of all active products with their prices
 */

/**
 * CORS headers for allowing requests from the website
 */
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

/**
 * Convert product name to URL slug
 * e.g., "Time For Everything" -> "time-for-everything"
 */
function nameToSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

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
    // Get Stripe API key from environment variable
    const stripeSecretKey = env.STRIPE_API_KEY_PRODUCTS;
    if (!stripeSecretKey) {
      return new Response(
        JSON.stringify({ error: 'Stripe API key not configured. Please set STRIPE_API_KEY_PRODUCTS in Cloudflare Pages environment variables.' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Fetch all active products from Stripe with default_price expanded
    // This avoids needing separate price read permissions
    const productsResponse = await fetch('https://api.stripe.com/v1/products?active=true&limit=100&expand[]=data.default_price', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
      },
    });

    if (!productsResponse.ok) {
      const errorText = await productsResponse.text();
      console.error('Stripe API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch products', details: errorText }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const productsData = await productsResponse.json();

    // Process products with their default prices
    const products = productsData.data.map(product => {
      // Get the default price (expanded or as ID)
      let defaultPrice = null;
      if (product.default_price) {
        // If expanded, it's an object; if not, it's just an ID
        defaultPrice = typeof product.default_price === 'object' 
          ? product.default_price 
          : null;
      }
      
      // Format price for display
      let formattedPrice = '0.00';
      let priceId = null;
      let currency = 'eur';
      
      if (defaultPrice && defaultPrice.unit_amount) {
        const amount = defaultPrice.unit_amount / 100; // Convert from cents
        formattedPrice = amount.toFixed(2);
        priceId = defaultPrice.id;
        currency = defaultPrice.currency || 'eur';
      } else if (product.default_price && typeof product.default_price === 'string') {
        // If we only have the price ID, we can't get the amount without fetching prices
        // In this case, we'll need to try fetching prices per product or use a fallback
        priceId = product.default_price;
      }

      // Generate URL slug from product name
      const slug = nameToSlug(product.name);
      const url = `/${slug}/index.html`;

      // Get product images - Stripe returns an array of image URLs
      let imageUrl = null;
      if (product.images && Array.isArray(product.images) && product.images.length > 0) {
        imageUrl = product.images[0];
      }

      return {
        id: product.id,
        name: product.name,
        description: product.description || '',
        price: formattedPrice,
        priceId: priceId,
        currency: currency,
        url: url,
        image: imageUrl,
        images: product.images || [], // Include all images in case we want to use them later
      };
    });
    
    // If we have products without prices (because default_price wasn't expanded),
    // try to fetch prices individually for those products
    const productsWithoutPrices = products.filter(p => p.price === '0.00' && p.priceId);
    if (productsWithoutPrices.length > 0) {
      // Try to fetch prices for products that need them
      for (const product of productsWithoutPrices) {
        try {
          const priceResponse = await fetch(`https://api.stripe.com/v1/prices/${product.priceId}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${stripeSecretKey}`,
            },
          });
          
          if (priceResponse.ok) {
            const priceData = await priceResponse.json();
            if (priceData.unit_amount) {
              const amount = priceData.unit_amount / 100;
              product.price = amount.toFixed(2);
              product.currency = priceData.currency || 'eur';
            }
          }
        } catch (e) {
          // If we can't fetch individual prices, that's okay - we'll show 0.00
          console.warn(`Could not fetch price for ${product.id}:`, e);
        }
      }
    }

    // Sort products by name
    products.sort((a, b) => a.name.localeCompare(b.name));

    // Return the products
    return new Response(
      JSON.stringify({ products }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Products function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}

