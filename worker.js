/**
 * Cloudflare Worker for Stripe Checkout
 * Creates a Stripe Checkout Session from cart items
 */

// Product ID to Stripe Price ID mapping
const PRODUCT_TO_PRICE = {
  'prod_THxs9v5Opt7nLE': 'price_1SZf53JzbynpJBQqWdug6P97', // Sunrise
  'prod_THxuZf4QLqQZjx': 'price_1SLNylJzbynpJBQqPL5pPWK8', // Time For Everything
  'prod_THxtUYehCZREGs': 'price_1SLNy5JzbynpJBQqiLd3QalZ', // The Entity
  'prod_THxt1F5RED4cA0': 'price_1SLNxbJzbynpJBQqMRoBOH3T', // The Beginning of the End
  'prod_THxsLAj73IHzkE': 'price_1SLNwZJzbynpJBQqjstSupa2', // Stop Act Natural
  'prod_THxrYIKdiioCj0': 'price_1SLNvyJzbynpJBQqC8Gvk16d', // Reflections Of Another Time
  'prod_THxro1C7XRM9az': 'price_1SLNvOJzbynpJBQqh8dCHeA7', // Pearse Station
  'prod_THxqRtGSS6Vmpe': 'price_1SLNuwJzbynpJBQqFoyipIAg', // Past The Fairy Tree
  'prod_THxqmYzRyyk3nj': 'price_1SLNuQJzbynpJBQqgEElijwB', // Infinite Possibilities
  'prod_THxpTmKXkUy4hv': 'price_1SLNtjJzbynpJBQqk0V7yY6t', // Dream Junction
  'prod_THxmI6LnBR3JaD': 'price_1SLNrHJzbynpJBQqL5kAnOSb', // Away with the Faries
  'prod_THxmm6GeFBK9cj': 'price_1SLNqUJzbynpJBQq1mQXF8F3', // A Place To Escape To
  'prod_THiit7KwAsGYoi': 'price_1SL9HWJzbynpJBQq2zeTXRWj', // Big Rock Candy Mountain
  'prod_THihQygkuRpT4G': 'price_1SL9G3JzbynpJBQqbgg2V6sx', // Garden of Kevinity
  'prod_THigAUxOVR7lIH': 'price_1SL9F2JzbynpJBQqit6MxmXe', // If Only I Was a Giant Dinosaur
  'prod_THieNC4E5rjJ2I': 'price_1SL9DJJzbynpJBQqDRvk32na', // Club Mc Meowly's
  'prod_THhx0dGKpMBzjA': 'price_1SL8XwJzbynpJBQqZ8nX6WcD', // Mc Meowly's Lounge
  'prod_THhw4MKoZ3jkk9': 'price_1SZvQiJzbynpJBQqc6fCn44y', // Oh Dorothy (€1 test price)
  'prod_THDi4qLDA9Ty2E': 'price_1SKfH6JzbynpJBQq34qDcpcy', // Big Rock Candy Mountain A4
};

/**
 * CORS headers for allowing requests from the website
 */
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request, env) {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders,
      });
    }

    // Only allow POST requests
    if (request.method !== 'POST') {
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
      const stripeSecretKey = env.STRIPE_SECRET_KEY;
      if (!stripeSecretKey) {
        return new Response(
          JSON.stringify({ error: 'Stripe API key not configured' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Parse request body
      const body = await request.json();
      const { cart, successUrl, cancelUrl } = body;

      // Validate cart
      if (!cart || !Array.isArray(cart) || cart.length === 0) {
        return new Response(
          JSON.stringify({ error: 'Cart is empty or invalid' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Get the origin from the request to construct URLs if not provided
      const origin = new URL(request.url).origin;
      const defaultSuccessUrl = successUrl || `${origin}/cart/index.html?success=true`;
      const defaultCancelUrl = cancelUrl || `${origin}/cart/index.html?canceled=true`;

      // Build line items for Stripe Checkout
      const lineItems = [];
      for (const item of cart) {
        const priceId = PRODUCT_TO_PRICE[item.id];
        if (!priceId) {
          return new Response(
            JSON.stringify({ error: `Product ID ${item.id} not found` }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        lineItems.push({
          price: priceId,
          quantity: 1,
        });
      }

      // Build form data for Stripe API
      const formData = new URLSearchParams();
      formData.append('mode', 'payment');
      formData.append('success_url', defaultSuccessUrl);
      formData.append('cancel_url', defaultCancelUrl);
      formData.append('currency', 'eur');
      
      // Collect billing address (required)
      formData.append('billing_address_collection', 'required');
      
      // Collect shipping address - allow common international shipping destinations
      // Add or remove country codes as needed (ISO 3166-1 alpha-2 codes)
      const allowedCountries = ['IE', 'GB', 'US', 'CA', 'AU', 'NZ', 'FR', 'DE', 'IT', 'ES', 'NL', 'BE', 'AT', 'CH', 'SE', 'NO', 'DK', 'FI', 'PL', 'PT'];
      allowedCountries.forEach(country => {
        formData.append('shipping_address_collection[allowed_countries][]', country);
      });
      
      // Collect phone number (required)
      formData.append('phone_number_collection[enabled]', 'true');
      
      // Add line items
      lineItems.forEach((item, index) => {
        formData.append(`line_items[${index}][price]`, item.price);
        formData.append(`line_items[${index}][quantity]`, item.quantity.toString());
      });

      // Create Stripe Checkout Session
      const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${stripeSecretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      if (!stripeResponse.ok) {
        const errorText = await stripeResponse.text();
        console.error('Stripe API error:', errorText);
        return new Response(
          JSON.stringify({ error: 'Failed to create checkout session', details: errorText }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const session = await stripeResponse.json();

      // Return the checkout URL
      return new Response(
        JSON.stringify({ url: session.url }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } catch (error) {
      console.error('Worker error:', error);
      return new Response(
        JSON.stringify({ error: 'Internal server error', message: error.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  },
};

