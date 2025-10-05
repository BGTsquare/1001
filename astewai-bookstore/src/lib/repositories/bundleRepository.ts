
import { createClient } from "../supabase/client";
import { Bundle } from "@/types";

export interface BundleSearchOptions {
  query?: string;
  priceRange?: [number, number];
  limit?: number;
  offset?: number;
  sortBy?: 'created_at' | 'title' | 'price';
  sortOrder?: 'asc' | 'desc';
}

export interface BundleStats {
  total: number;
  featured: number;
  popular: number;
}

export async function getBundles(options: BundleSearchOptions = {}): Promise<Bundle[]> {
  const supabase = createClient();
  
  const {
    query,
    priceRange,
    limit,
    offset,
    sortBy = 'created_at',
    sortOrder = 'desc'
  } = options;

  let bundleQuery = supabase
    .from("bundles")
    .select(`
      *,
      books:bundle_books!inner(books(*))
    `);

  // Apply filters
  if (query) {
    bundleQuery = bundleQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%`);
  }

  if (priceRange) {
    bundleQuery = bundleQuery
      .gte('price', priceRange[0])
      .lte('price', priceRange[1]);
  }

  // Apply sorting
  bundleQuery = bundleQuery.order(sortBy, { ascending: sortOrder === 'asc' });

  // Apply pagination
  if (limit !== undefined && offset !== undefined) {
    bundleQuery = bundleQuery.range(offset, offset + limit - 1);
  }

  const { data, error } = await bundleQuery;

  if (error) {
    console.warn(`Bundles fetch error: ${error.message}`);
    // Return empty array if database is not fully set up
    return [];
  }

  const bundles = data.map(bundle => ({
    ...bundle,
    books: bundle.books.map((b: any) => b.books)
  }));

  return bundles;
}

export async function getBundleStats(): Promise<BundleStats> {
  const supabase = createClient();
  
  const { count: total, error: totalError } = await supabase
    .from("bundles")
    .select('*', { count: 'exact', head: true });

  if (totalError) {
    console.warn(`Bundle stats fetch error: ${totalError.message}`);
    // Return default stats if database is not fully set up
    return {
      total: 0,
      featured: 0,
      popular: 0,
      recent: 0
    };
  }

  // For now, calculate featured and popular based on total
  // In a real app, you'd have specific fields or logic for this
  const featured = Math.floor((total || 0) * 0.4);
  const popular = Math.floor((total || 0) * 0.3);

  return {
    total: total || 0,
    featured,
    popular
  };
}

export async function getBundleById(id: string): Promise<Bundle> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("bundles")
    .select(`
      *,
      books:bundle_books!inner(books(*))
    `)
    .eq("id", id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const bundle = {
    ...data,
    books: data.books.map((b: any) => b.books)
  };

  return bundle;
}
