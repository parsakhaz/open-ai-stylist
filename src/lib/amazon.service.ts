import axios from 'axios';

// This is our NEW, richer product structure. It will be the single source of truth.
// Note the new fields for price, rating, etc.
export interface RichProduct {
  id: string;                // Mapped from Amazon's 'asin'
  name: string;              // Mapped from Amazon's 'product_title'
  imageUrl: string;          // Mapped from Amazon's 'product_photo'
  buyLink: string;           // Mapped from Amazon's 'product_url'
  price: string | null;      // Mapped from Amazon's 'product_price'
  originalPrice: string | null; // Mapped from 'product_original_price'
  rating: number | null;     // Mapped from 'product_star_rating'
  ratingCount: number | null;// Mapped from 'product_num_ratings'
  isPrime: boolean;          // Mapped from 'is_prime'
}

// This function calls the external RapidAPI for Amazon data
async function searchAmazonProducts(query: string) {
  // We read the API key and host from the environment variables
  const apiKey = process.env.RAPIDAPI_KEY;
  const apiHost = process.env.RAPIDAPI_HOST;

  if (!apiKey || !apiHost) {
    console.error('[amazon.service] API Key or Host is not configured in .env.local');
    return null;
  }

  const options = {
    method: 'GET',
    url: `https://${apiHost}/search`,
    params: {
      query: query,
      page: '1',
      country: 'US',
      sort_by: 'RELEVANCE',
      category_id: 'fashion,fashion-womens,fashion-mens,fashion-girls,fashion-boys,fashion-baby',
    },
    headers: {
      'x-rapidapi-key': apiKey,
      'x-rapidapi-host': apiHost,
    }
  };

  try {
    console.log(`[amazon.service] Calling Amazon API for query: "${query}"`);
    const response = await axios.request(options);
    return response.data;
  } catch (error) {
    // We log the error but return null so the application can handle it gracefully
    console.error('[amazon.service] Amazon API Error:', error);
    return null; 
  }
}

// This function transforms the raw Amazon data into our app's 'RichProduct' structure
function transformAmazonResponse(amazonData: any): RichProduct[] {
  if (!amazonData?.data?.products) {
    console.log('[amazon.service] No products found in Amazon API response.');
    return [];
  }

  // We map each product from the API to our clean RichProduct interface
  return amazonData.data.products
    .map((product: any): RichProduct => ({
      id: product.asin,
      name: product.product_title,
      imageUrl: product.product_photo,
      buyLink: product.product_url,
      price: product.product_price,
      originalPrice: product.product_original_price,
      // Ensure rating is a valid number, otherwise null
      rating: parseFloat(product.product_star_rating) || null,
      ratingCount: product.product_num_ratings || null,
      isPrime: product.is_prime || false,
    }))
    // We'll just take the top 8 results for our display
    .slice(0, 8);
}

// This is the main function we'll call from our API route.
export async function searchAndTransformProducts(query: string): Promise<RichProduct[]> {
    const amazonResponse = await searchAmazonProducts(query);
    const transformedProducts = transformAmazonResponse(amazonResponse);
    console.log(`[amazon.service] Transformed ${transformedProducts.length} products.`);
    return transformedProducts;
} 