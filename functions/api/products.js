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

    // Fetch all active products from Stripe
    const productsResponse = await fetch('https://api.stripe.com/v1/products?active=true&limit=100', {
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
    
    // Fetch prices for all products
    const pricesResponse = await fetch('https://api.stripe.com/v1/prices?active=true&limit=100', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
      },
    });

    if (!pricesResponse.ok) {
      const errorText = await pricesResponse.text();
      console.error('Stripe API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch prices', details: errorText }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const pricesData = await pricesResponse.json();
    
    // Create a map of product ID to prices
    const priceMap = new Map();
    pricesData.data.forEach(price => {
      if (price.product && typeof price.product === 'string') {
        if (!priceMap.has(price.product)) {
          priceMap.set(price.product, []);
        }
        priceMap.get(price.product).push(price);
      }
    });

    // Combine products with their prices
    const products = productsData.data.map(product => {
      const prices = priceMap.get(product.id) || [];
      // Get the default price (first active price, or first price if none active)
      const defaultPrice = prices.find(p => p.active) || prices[0];
      
      // Format price for display
      let formattedPrice = '0.00';
      if (defaultPrice) {
        const amount = defaultPrice.unit_amount / 100; // Convert from cents
        formattedPrice = amount.toFixed(2);
      }

      // Generate URL slug from product name
      const slug = nameToSlug(product.name);
      const url = `/${slug}/index.html`;

      return {
        id: product.id,
        name: product.name,
        description: product.description || '',
        price: formattedPrice,
        priceId: defaultPrice?.id || null,
        currency: defaultPrice?.currency || 'eur',
        url: url,
        image: product.images && product.images.length > 0 ? product.images[0] : null,
      };
    });

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

