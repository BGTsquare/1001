
import { supabase } from "../supabase/client";
import { Bundle } from "@/types";

export async function getBundles(): Promise<Bundle[]> {
  const { data, error } = await supabase
    .from("bundles")
    .select(`
      *,
      books:bundle_books!inner(books(*))
    `);

  if (error) {
    throw new Error(error.message);
  }

  const bundles = data.map(bundle => ({
    ...bundle,
    books: bundle.books.map((b: any) => b.books)
  }));

  return bundles;
}

export async function getBundleById(id: string): Promise<Bundle> {
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
