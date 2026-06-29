interface GraphQLRequest {
  query: string;
  variables?: Record<string, any>;
}

export async function wpQuery({ query, variables = {} }: GraphQLRequest) {
  // Build-time vars come from import.meta.env; Vercel serverless runtime exposes process.env.
  const url =
    import.meta.env.WORDPRESS_API_URL ||
    (typeof process !== 'undefined' ? process.env.WORDPRESS_API_URL : undefined) ||
    'http://localhost/hongyu/graphql';

  // On Vercel there is no localhost WordPress to reach. If WORDPRESS_API_URL
  // hasn't been set to a public endpoint, skip the request entirely so pages
  // render their built-in fallback content cleanly — no ECONNREFUSED noise on
  // every build/SSR call. (Local builds against local WP are unaffected.)
  const onVercel = typeof process !== 'undefined' && !!process.env.VERCEL;
  const isLocalhost = /localhost|127\.0\.0\.1/.test(url);
  if (onVercel && isLocalhost) {
    console.info('[wpQuery] WORDPRESS_API_URL is not set to a public endpoint — using fallback content.');
    return null;
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables }),
    });

    const json = await response.json();
    if (json.errors) {
      console.error('GraphQL Query Errors:', json.errors);
      throw new Error('Failed to execute GraphQL query');
    }
    return json.data;
  } catch (error) {
    console.error('Fetch error from WP API:', error);
    throw error;
  }
}
