'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import styles from '../admin.module.css';

function getToken() {
  return typeof window !== 'undefined' ? sessionStorage.getItem('dualturf_admin_token') : '';
}

const CATEGORIES = [
  { title: 'Club Kits (2026-27)', value: '2026-27-season-kits' },
  { title: 'International Kits', value: 'international-kits' },
  { title: 'Sets (Jersey with Shorts)', value: 'jerseys-with-shorts' },
  { title: 'Retro Classics', value: 'retro-classics' },
];

const TYPES = [
  { title: 'Master Version', value: 'master' },
  { title: 'Player Version', value: 'player' },
];

const ALL_SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

const EMPTY_FORM = {
  name: '', price: '', originalPrice: '', team: '',
  category: '2026-27-season-kits', type: 'master', sleeve: 'short',
  featured: false, clearanceSale: false, inStock: true, description: '',
  sizes: ['S', 'M', 'L', 'XL', 'XXL'],
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null); // null = create, object = edit
  const [form, setForm] = useState(EMPTY_FORM);
  const [uploadedImages, setUploadedImages] = useState([]); // [{ assetId, url }]
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const fileInputRef = useRef();

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/products', {
        headers: { 'x-admin-token': getToken() },
      });
      const data = await res.json();
      if (data.success) setProducts(data.products || []);
    } catch (err) {
      console.error('Fetch products error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setUploadedImages([]);
    setError('');
    setShowModal(true);
  };

  const openEdit = (product) => {
    setEditing(product);
    setForm({
      name: product.name || '',
      price: product.price || '',
      originalPrice: product.originalPrice || '',
      team: product.team || '',
      category: product.category || 'club',
      type: product.type || 'fan',
      sleeve: product.sleeve || 'short',
      featured: !!product.featured,
      clearanceSale: !!product.clearanceSale,
      inStock: product.inStock !== false,
      description: product.description || '',
      sizes: product.sizes || ['S', 'M', 'L', 'XL', 'XXL'],
    });
    const existingList = product.imageList && product.imageList.length > 0
      ? product.imageList.filter(img => img && (img.url || img.assetId))
      : (product.images || []).map((url) => ({ assetId: product.imageAssetId || null, url }));
    setUploadedImages(existingList);
    setError('');
    setShowModal(true);
  };

  const removeImage = (indexToRemove) => {
    setUploadedImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (!process.env.NEXT_PUBLIC_SANITY_API_TOKEN && !getToken()) {
      setError('Sanity API token not configured. Image upload unavailable.');
      return;
    }

    setUploading(true);
    for (const file of files) {
      try {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch('/api/admin/products', {
          method: 'PUT',
          headers: { 'x-admin-token': getToken() },
          body: fd,
        });
        const data = await res.json();
        if (data.success) {
          setUploadedImages(prev => [...prev, { assetId: data.assetId, url: data.url }]);
        } else {
          setError(data.message || 'Upload failed');
        }
      } catch (err) {
        setError('Upload error: ' + err.message);
      }
    }
    setUploading(false);
  };

  const toggleSize = (size) => {
    setForm(prev => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter(s => s !== size)
        : [...prev.sizes, size],
    }));
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.price) {
      setError('Name and price are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const imageAssetIds = uploadedImages.map(i => i.assetId).filter(Boolean);

      if (editing) {
        // PATCH
        const res = await fetch('/api/admin/products', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'x-admin-token': getToken() },
          body: JSON.stringify({
            _id: editing._id,
            ...form,
            price: Number(form.price),
            originalPrice: form.originalPrice ? Number(form.originalPrice) : null,
            imageAssetIds,
          }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
      } else {
        // POST
        const res = await fetch('/api/admin/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-admin-token': getToken() },
          body: JSON.stringify({
            ...form,
            price: Number(form.price),
            originalPrice: form.originalPrice ? Number(form.originalPrice) : null,
            imageAssetIds,
          }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
      }
      setShowModal(false);
      fetchProducts();
    } catch (err) {
      setError(err.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product) => {
    try {
      const res = await fetch('/api/admin/products', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': getToken() },
        body: JSON.stringify({ _id: product._id }),
      });
      const data = await res.json();
      if (data.success) {
        setProducts(prev => prev.filter(p => p._id !== product._id));
        setDeleteConfirm(null);
      } else {
        alert(data.message || 'Delete failed');
      }
    } catch (err) {
      alert('Delete error: ' + err.message);
    }
  };

  const filtered = products.filter(p =>
    !search || p.name?.toLowerCase().includes(search.toLowerCase()) || p.team?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Products</h1>
          <p className={styles.pageSub}>{products.length} products in Sanity</p>
        </div>
        <button onClick={openCreate} className={styles.btnPrimary}>+ Add Product</button>
      </div>

      <div className={styles.controls}>
        <input
          type="text"
          placeholder="Search by name or team..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className={styles.searchInput}
        />
        <button onClick={fetchProducts} className={styles.btnOutline}>🔄 Refresh</button>
      </div>

      {loading ? (
        <div className={styles.loading}>Loading products...</div>
      ) : filtered.length === 0 ? (
        <div className={styles.empty}>No products found.</div>
      ) : (
        <>
          {/* Desktop Multi-column Table */}
          <div className={`${styles.section} ${styles.desktopOnly}`} style={{ padding: 0, overflow: 'hidden' }}>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th style={{ width: 56 }}>Image</th>
                    <th>Name</th>
                    <th>Team</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Featured</th>
                    <th>🔥 Sale</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(product => (
                    <tr key={product._id}>
                      <td>
                        {product.image ? (
                          <img src={product.image} alt={product.name} className={styles.productThumb} />
                        ) : (
                          <div className={styles.productThumbPlaceholder}>⚽</div>
                        )}
                      </td>
                      <td style={{ fontWeight: 600, minWidth: 150, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {product.name}
                      </td>
                      <td style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{product.team || '—'}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <span className={`${styles.badge} ${styles.badgeGray}`}>{product.category || '—'}</span>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <span style={{ color: '#c4ff3d', fontWeight: 700 }}>₹{product.price}</span>
                        {product.originalPrice && (
                          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', marginLeft: '0.35rem', textDecoration: 'line-through' }}>
                            ₹{product.originalPrice}
                          </span>
                        )}
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <span className={`${styles.badge} ${product.inStock !== false ? styles.badgeGreen : styles.badgeRed}`}>
                          {product.inStock !== false ? 'In Stock' : 'Out'}
                        </span>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {product.featured ? (
                          <span className={`${styles.badge} ${styles.badgeYellow}`}>⭐ Featured</span>
                        ) : (
                          <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.8rem' }}>—</span>
                        )}
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {product.clearanceSale ? (
                          <span className={`${styles.badge} ${styles.badgeRed}`}>🔥 Sale</span>
                        ) : (
                          <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.8rem' }}>—</span>
                        )}
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button onClick={() => openEdit(product)} className={styles.btnOutline} style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}>
                            ✏️ Edit
                          </button>
                          <button onClick={() => setDeleteConfirm(product)} className={styles.btnDanger} style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}>
                            🗑
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Tap-to-Expand Accordion List */}
          <div className={styles.mobileOnly}>
            <div className={styles.accordionList}>
              {filtered.map(product => {
                const isExpanded = expandedId === product._id;
                return (
                  <div
                    key={product._id}
                    className={`${styles.accordionItem} ${isExpanded ? styles.accordionItemOpen : ''}`}
                  >
                    <div
                      className={styles.accordionHeader}
                      onClick={() => setExpandedId(prev => (prev === product._id ? null : product._id))}
                    >
                      <div className={styles.accordionMainInfo}>
                        {product.image ? (
                          <img src={product.image} alt={product.name} className={styles.productThumb} />
                        ) : (
                          <div className={styles.productThumbPlaceholder}>⚽</div>
                        )}
                        <div className={styles.accordionTitleCol}>
                          <div className={styles.accordionTitle}>{product.name}</div>
                          <div className={styles.accordionSubInfo}>
                            <span className={styles.priceHighlight}>₹{product.price}</span>
                            {product.category && (
                              <span className={`${styles.badge} ${styles.badgeGray}`}>{product.category}</span>
                            )}
                            <span className={`${styles.badge} ${product.inStock !== false ? styles.badgeGreen : styles.badgeRed}`}>
                              {product.inStock !== false ? 'In Stock' : 'Out'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className={styles.accordionChevron}>
                        {isExpanded ? '▲' : '▼'}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className={styles.accordionBody}>
                        <div className={styles.accordionDetailsGrid}>
                          {product.team && (
                            <div className={styles.accordionDetail}>
                              <span className={styles.accordionDetailLabel}>Team</span>
                              <span>{product.team}</span>
                            </div>
                          )}
                          <div className={styles.accordionDetail}>
                            <span className={styles.accordionDetailLabel}>Version</span>
                            <span>{product.type || 'fan'}</span>
                          </div>
                          <div className={styles.accordionDetail}>
                            <span className={styles.accordionDetailLabel}>Sleeve</span>
                            <span>{product.sleeve === 'full' ? 'Full Sleeve' : 'Short Sleeve'}</span>
                          </div>
                          {product.originalPrice && (
                            <div className={styles.accordionDetail}>
                              <span className={styles.accordionDetailLabel}>Original MRP</span>
                              <span style={{ textDecoration: 'line-through', color: 'rgba(255,255,255,0.4)' }}>
                                ₹{product.originalPrice}
                              </span>
                            </div>
                          )}
                          {product.featured && (
                            <div className={styles.accordionDetail}>
                              <span className={styles.accordionDetailLabel}>Homepage</span>
                              <span className={`${styles.badge} ${styles.badgeYellow}`}>⭐ Featured Drop</span>
                            </div>
                          )}
                          {product.clearanceSale && (
                            <div className={styles.accordionDetail}>
                              <span className={styles.accordionDetailLabel}>Clearance</span>
                              <span className={`${styles.badge} ${styles.badgeRed}`}>🔥 On Sale</span>
                            </div>
                          )}
                        </div>

                        {product.sizes && product.sizes.length > 0 && (
                          <div style={{ marginTop: '0.6rem' }}>
                            <span className={styles.accordionDetailLabel}>Sizes: </span>
                            <span style={{ fontSize: '0.8rem', color: '#ffffff' }}>{product.sizes.join(', ')}</span>
                          </div>
                        )}

                        {product.description && (
                          <p className={styles.accordionDesc}>{product.description}</p>
                        )}

                        <div className={styles.accordionActions}>
                          <button
                            onClick={() => openEdit(product)}
                            className={styles.btnOutline}
                            style={{ flex: 1 }}
                          >
                            ✏️ Edit Details
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(product)}
                            className={styles.btnDanger}
                            style={{ padding: '0.6rem 1rem' }}
                          >
                            🗑
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className={styles.modalOverlay} onClick={() => setDeleteConfirm(null)}>
          <div className={styles.modal} style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
            <p className={styles.modalTitle}>Delete Product?</p>
            <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)' }}>
              This will permanently delete <strong style={{ color: '#fff' }}>{deleteConfirm.name}</strong> from Sanity. This cannot be undone.
            </p>
            <div className={styles.formActions}>
              <button onClick={() => setDeleteConfirm(null)} className={styles.btnOutline}>Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} className={styles.btnDanger}>🗑 Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <p className={styles.modalTitle}>{editing ? 'Edit Product' : 'Add New Product'}</p>

            <div className={styles.formGrid}>
              <div className={`${styles.formField} ${styles.fullWidth}`}>
                <label className={styles.formLabel}>Product Name *</label>
                <input className={styles.formInput} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Real Madrid Home - Master Version" />
              </div>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Price (₹) *</label>
                <input type="number" className={styles.formInput} value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} placeholder="799" />
              </div>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Original / MRP Price (₹)</label>
                <input type="number" className={styles.formInput} value={form.originalPrice} onChange={e => setForm(p => ({ ...p, originalPrice: e.target.value }))} placeholder="1299" />
              </div>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Team / Club</label>
                <input className={styles.formInput} value={form.team} onChange={e => setForm(p => ({ ...p, team: e.target.value }))} placeholder="Real Madrid" />
              </div>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Category</label>
                <select className={styles.formSelect} value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.title}</option>)}
                </select>
              </div>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Version Type</label>
                <select className={styles.formSelect} value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                  {TYPES.map(t => <option key={t.value} value={t.value}>{t.title}</option>)}
                </select>
              </div>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Sleeve</label>
                <select className={styles.formSelect} value={form.sleeve} onChange={e => setForm(p => ({ ...p, sleeve: e.target.value }))}>
                  <option value="short">Short Sleeve</option>
                  <option value="full">Full Sleeve</option>
                </select>
              </div>
              <div className={`${styles.formField} ${styles.fullWidth}`}>
                <label className={styles.formLabel}>Available Sizes</label>
                <div className={styles.checkGroup}>
                  {ALL_SIZES.map(s => (
                    <div
                      key={s}
                      className={`${styles.checkChip} ${form.sizes.includes(s) ? styles.checkChipActive : ''}`}
                      onClick={() => toggleSize(s)}
                    >
                      {s}
                    </div>
                  ))}
                </div>
              </div>
              <div className={`${styles.formField} ${styles.fullWidth}`}>
                <label className={styles.formLabel}>Description</label>
                <textarea className={styles.formTextarea} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Optional product description..." />
              </div>
              <div className={`${styles.formField} ${styles.fullWidth}`}>
                <div className={styles.toggleRow}>
                  <span className={styles.toggleLabel}>Featured on Homepage</span>
                  <button type="button" className={`${styles.toggle} ${form.featured ? styles.on : ''}`} onClick={() => setForm(p => ({ ...p, featured: !p.featured }))} />
                </div>
                <div className={styles.toggleRow}>
                  <span className={styles.toggleLabel}>🔥 Clearance Sale</span>
                  <button type="button" className={`${styles.toggle} ${form.clearanceSale ? styles.on : ''}`} onClick={() => setForm(p => ({ ...p, clearanceSale: !p.clearanceSale }))} />
                </div>
                <div className={styles.toggleRow}>
                  <span className={styles.toggleLabel}>In Stock</span>
                  <button type="button" className={`${styles.toggle} ${form.inStock ? styles.on : ''}`} onClick={() => setForm(p => ({ ...p, inStock: !p.inStock }))} />
                </div>
              </div>

              {/* Image Upload */}
              <div className={`${styles.formField} ${styles.fullWidth}`}>
                <label className={styles.formLabel}>Product Images</label>
                <div className={styles.imageUploadArea} onClick={() => fileInputRef.current?.click()}>
                  <p className={styles.imageUploadText}>
                    {uploading ? '⏳ Uploading to Sanity CDN...' : '📷 Click to upload / add new images (JPG, PNG, WebP)'}
                  </p>
                  {uploadedImages.length > 0 && (
                    <div className={styles.imagePreviewGrid} onClick={e => e.stopPropagation()}>
                      {uploadedImages.map((img, i) => (
                        <div key={i} className={styles.imagePreviewItem}>
                          <img src={img.url} alt="" className={styles.imagePreview} />
                          <button
                            type="button"
                            className={styles.imageRemoveBtn}
                            onClick={(e) => {
                              e.stopPropagation();
                              removeImage(i);
                            }}
                            title="Remove image"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: 'none' }}
                  onChange={handleImageUpload}
                />
                <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', marginTop: '0.35rem' }}>
                  Images are stored on Sanity CDN. Click ✕ to remove an image, or click the box to add more.
                </p>
              </div>
            </div>

            {error && <p style={{ color: '#ff5e5e', fontSize: '0.85rem', background: 'rgba(255,94,94,0.08)', padding: '0.6rem 0.875rem', borderRadius: 6 }}>⚠ {error}</p>}

            <div className={styles.formActions}>
              <button onClick={() => setShowModal(false)} className={styles.btnOutline}>Cancel</button>
              <button onClick={handleSave} disabled={saving || uploading} className={styles.btnPrimary}>
                {saving ? 'Saving...' : editing ? 'Save Changes' : 'Create Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
