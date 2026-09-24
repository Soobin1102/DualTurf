import { createClient } from '@sanity/client'
import { createImageUrlBuilder } from '@sanity/image-url'

// Read-only client (used throughout the storefront)
export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'a1ui8xji',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-01-01',
  useCdn: false, // Ensure live updates without CDN caching delays
  perspective: 'published',
})

// Write-enabled client — SERVER SIDE ONLY (uses SANITY_API_TOKEN env var)
export const writeClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'a1ui8xji',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
})

// Image URL builder
const builder = createImageUrlBuilder(client)
export function urlFor(source) {
  return builder.image(source)
}

const fetchOptions = { cache: 'no-store' }

// ─── Product Queries ───────────────────────────────────────

// Fetch all products
export async function getAllProducts() {
  return client.fetch(`
    *[_type == "product" && inStock != false] | order(_createdAt desc) {
      _id,
      "id": slug.current,
      "slug": slug.current,
      name,
      "title": name,
      team,
      category,
      price,
      originalPrice,
      type,
      sleeve,
      featured,
      description,
      sizes,
      "image": images[0].asset->url,
      "images": images[].asset->url,
    }
  `, {}, fetchOptions)
}

// Fetch a single product by slug
export async function getProductBySlug(slug) {
  return client.fetch(`
    *[_type == "product" && slug.current == $slug][0] {
      _id,
      "id": slug.current,
      "slug": slug.current,
      name,
      "title": name,
      team,
      category,
      price,
      originalPrice,
      type,
      sleeve,
      featured,
      description,
      sizes,
      "image": images[0].asset->url,
      "images": images[].asset->url,
    }
  `, { slug }, fetchOptions)
}

// Fetch products by category
export async function getProductsByCategory(category) {
  let catList = [category];
  if (category === '2026-27-season-kits' || category === 'club' || category === 'club-kits') {
    catList = ['2026-27-season-kits', 'club', 'club-kits'];
  } else if (category === 'international-kits' || category === 'international') {
    catList = ['international-kits', 'international'];
  } else if (category === 'jerseys-with-shorts' || category === 'shorts' || category === 'sets') {
    catList = ['jerseys-with-shorts', 'shorts', 'sets'];
  } else if (category === 'retro-classics' || category === 'retro') {
    catList = ['retro-classics', 'retro'];
  }

  return client.fetch(`
    *[_type == "product" && (category in $catList || type in $catList) && inStock != false] | order(_createdAt desc) {
      _id,
      "id": slug.current,
      "slug": slug.current,
      name,
      "title": name,
      team,
      category,
      price,
      originalPrice,
      type,
      sleeve,
      featured,
      description,
      sizes,
      "image": images[0].asset->url,
      "images": images[].asset->url,
    }
  `, { catList }, fetchOptions)
}

// Fetch featured products (for homepage Latest Drop section)
export async function getFeaturedProducts() {
  return client.fetch(`
    *[_type == "product" && featured == true && inStock != false] | order(_createdAt desc)[0...8] {
      _id,
      "id": slug.current,
      "slug": slug.current,
      name,
      "title": name,
      team,
      category,
      price,
      originalPrice,
      "image": images[0].asset->url,
    }
  `, {}, fetchOptions)
}

// Search products by name or team
export async function searchProducts(query) {
  return client.fetch(`
    *[_type == "product" && (name match $query || team match $query) && inStock != false] {
      _id,
      "id": slug.current,
      "slug": slug.current,
      name,
      "title": name,
      team,
      category,
      price,
      originalPrice,
      "image": images[0].asset->url,
    }
  `, { query: `*${query}*` }, fetchOptions)
}
