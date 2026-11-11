import { NextResponse } from 'next/server';
import { writeClient, client } from '@/lib/sanity';

// Helper: verify admin token
function isAdminAuthorized(request) {
  const token = request.headers.get('x-admin-token');
  if (!token) return false;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const decoded = Buffer.from(token, 'base64').toString('utf-8');
  return decoded.startsWith('dualturf-admin:') && decoded.endsWith(`:${adminPassword}`);
}

// GET /api/admin/products — fetch all products from Sanity (including out-of-stock)
export async function GET(request) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const products = await client.fetch(`
      *[_type == "product"] | order(_createdAt desc) {
        _id,
        "id": slug.current,
        "slug": slug.current,
        name,
        team,
        category,
        price,
        originalPrice,
        type,
        sleeve,
        featured,
        clearanceSale,
        inStock,
        description,
        sizes,
        "image": images[0].asset->url,
        "imageAssetId": coalesce(images[0].asset->_id, images[0].asset._ref),
        "images": images[].asset->url,
        "imageList": images[]{
          "assetId": coalesce(asset->_id, asset._ref),
          "url": asset->url
        },
        _createdAt,
        _updatedAt,
      }
    `, {}, { cache: 'no-store' });

    return NextResponse.json({ success: true, products });
  } catch (error) {
    console.error('Admin GET /api/admin/products error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch products' }, { status: 500 });
  }
}

// POST /api/admin/products — create a new product in Sanity
export async function POST(request) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    if (!process.env.SANITY_API_TOKEN) {
      return NextResponse.json({ success: false, message: 'SANITY_API_TOKEN not configured on server.' }, { status: 500 });
    }

    const body = await request.json();
    const { name, price, originalPrice, team, category, type, sleeve, featured, clearanceSale, inStock, description, sizes, imageUrls, imageAssetIds } = body;

    // Build image references from uploaded asset IDs
    const assetsToUse = imageAssetIds || imageUrls || [];
    const images = assetsToUse.map(assetId => ({
      _type: 'image',
      _key: assetId || Math.random().toString(36).substring(2, 9),
      asset: { _type: 'reference', _ref: assetId },
    }));

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 96);

    const doc = {
      _type: 'product',
      name,
      slug: { _type: 'slug', current: slug },
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      team: team || '',
      category: category || '',
      type: type || 'fan',
      sleeve: sleeve || 'short',
      featured: Boolean(featured),
      clearanceSale: Boolean(clearanceSale),
      inStock: inStock !== false,
      description: description || '',
      sizes: sizes || ['S', 'M', 'L', 'XL', 'XXL'],
      images,
    };

    const created = await writeClient.create(doc);
    return NextResponse.json({ success: true, product: created });
  } catch (error) {
    console.error('Admin POST /api/admin/products error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to create product' }, { status: 500 });
  }
}

// PATCH /api/admin/products — update an existing product by Sanity _id
export async function PATCH(request) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    if (!process.env.SANITY_API_TOKEN) {
      return NextResponse.json({ success: false, message: 'SANITY_API_TOKEN not configured on server.' }, { status: 500 });
    }

    const { _id, ...fields } = await request.json();
    if (!_id) return NextResponse.json({ success: false, message: 'Missing _id' }, { status: 400 });

    // Build patch object — only include defined fields
    const patch = {};
    if (fields.name !== undefined) {
      patch.name = fields.name;
      patch['slug.current'] = fields.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .slice(0, 96);
    }
    if (fields.price !== undefined) patch.price = Number(fields.price);
    if (fields.originalPrice !== undefined) patch.originalPrice = fields.originalPrice ? Number(fields.originalPrice) : null;
    if (fields.team !== undefined) patch.team = fields.team;
    if (fields.category !== undefined) patch.category = fields.category;
    if (fields.type !== undefined) patch.type = fields.type;
    if (fields.sleeve !== undefined) patch.sleeve = fields.sleeve;
    if (fields.featured !== undefined) patch.featured = Boolean(fields.featured);
    if (fields.clearanceSale !== undefined) patch.clearanceSale = Boolean(fields.clearanceSale);
    if (fields.inStock !== undefined) patch.inStock = Boolean(fields.inStock);
    if (fields.description !== undefined) patch.description = fields.description;
    if (fields.sizes !== undefined) patch.sizes = fields.sizes;
    if (fields.imageAssetIds !== undefined) {
      patch.images = fields.imageAssetIds.map(assetId => ({
        _type: 'image',
        _key: assetId || Math.random().toString(36).substring(2, 9),
        asset: { _type: 'reference', _ref: assetId },
      }));
    }

    const updated = await writeClient.patch(_id).set(patch).commit();
    return NextResponse.json({ success: true, product: updated });
  } catch (error) {
    console.error('Admin PATCH /api/admin/products error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to update product' }, { status: 500 });
  }
}

// DELETE /api/admin/products — delete a product by Sanity _id
export async function DELETE(request) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    if (!process.env.SANITY_API_TOKEN) {
      return NextResponse.json({ success: false, message: 'SANITY_API_TOKEN not configured on server.' }, { status: 500 });
    }

    const { _id } = await request.json();
    if (!_id) return NextResponse.json({ success: false, message: 'Missing _id' }, { status: 400 });

    await writeClient.delete(_id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin DELETE /api/admin/products error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to delete product' }, { status: 500 });
  }
}

// POST /api/admin/products/upload — upload an image asset to Sanity
// This is handled via a sub-route but we accept a special action param
export async function PUT(request) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    if (!process.env.SANITY_API_TOKEN) {
      return NextResponse.json({ success: false, message: 'SANITY_API_TOKEN not configured.' }, { status: 500 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    if (!file) return NextResponse.json({ success: false, message: 'No file provided' }, { status: 400 });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const asset = await writeClient.assets.upload('image', buffer, {
      filename: file.name,
      contentType: file.type,
    });

    return NextResponse.json({ success: true, assetId: asset._id, url: asset.url });
  } catch (error) {
    console.error('Admin image upload error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Upload failed' }, { status: 500 });
  }
}
