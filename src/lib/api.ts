interface GraphQLRequest {
  query: string;
  variables?: Record<string, any>;
}

export async function wpQuery({ query, variables = {} }: GraphQLRequest) {
  const url = import.meta.env.WORDPRESS_API_URL || 'http://localhost/hongyu/graphql';
  
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
