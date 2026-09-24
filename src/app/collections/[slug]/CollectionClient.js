'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

// Helper to normalize sleeve values ('Half Sleeves', 'short', 'Full Sleeves', 'full')
function normalizeSleeve(val) {
  if (!val) return 'short';
  const s = String(val).toLowerCase();
  if (s.includes('full')) return 'full';
  if (s.includes('sleeveless')) return 'sleeveless';
  return 'short'; // 'half', 'half sleeves', 'short'
}

// Helper to check Version / Cut (Master Version vs Player Version)
function matchesVersion(product, versionKey) {
  const pType = String(product.type || '').toLowerCase();
  const pTitle = String(product.title || product.name || '').toLowerCase();

  if (versionKey === 'player') {
    return pType.includes('player') || pTitle.includes('player version');
  }
  if (versionKey === 'master' || versionKey === 'fan') {
    // Master Version is the standard 1:1 edition (all non-player match cuts)
    return !pType.includes('player') && !pTitle.includes('player version');
  }
  return true;
}

// Helper to check Format & Edition (Sets vs Retro)
function matchesFormat(product, formatKey) {
  const pCat = String(product.category || '').toLowerCase();
  const pTitle = String(product.title || product.name || '').toLowerCase();
  const pType = String(product.type || '').toLowerCase();

  if (formatKey === 'sets') {
    return pCat.includes('shorts') || pTitle.includes('with shorts') || pTitle.includes('set');
  }
  if (formatKey === 'retro') {
    return pCat.includes('retro') || pType.includes('retro') || pTitle.includes('retro');
  }
  return true;
}

export default function CollectionClient({
  initialProducts = [],
  categories = [],
  currentSlug = 'all',
  title = 'ALL PRODUCTS',
  isFallback = false,
}) {
  const [selectedVersions, setSelectedVersions] = useState([]); // ['master', 'player']
  const [selectedFormats, setSelectedFormats] = useState([]);   // ['sets', 'retro']
  const [selectedSleeves, setSelectedSleeves] = useState([]);   // ['short', 'full']
  const [sortBy, setSortBy] = useState('featured');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Toggle Version filter
  const toggleVersion = (key) => {
    setSelectedVersions((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  // Toggle Format filter (Sets / Retro)
  const toggleFormat = (key) => {
    setSelectedFormats((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  // Toggle Sleeve filter
  const toggleSleeve = (key) => {
    setSelectedSleeves((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  // Reset all filters
  const resetFilters = () => {
    setSelectedVersions([]);
    setSelectedFormats([]);
    setSelectedSleeves([]);
    setSortBy('featured');
  };

  const hasActiveFilters =
    selectedVersions.length > 0 ||
    selectedFormats.length > 0 ||
    selectedSleeves.length > 0 ||
    sortBy !== 'featured';

  // Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    let result = [...initialProducts];

    // Filter by Version (Master Version vs Player Version)
    if (selectedVersions.length > 0) {
      result = result.filter((p) =>
        selectedVersions.some((vKey) => matchesVersion(p, vKey))
      );
    }

    // Filter by Format (Sets vs Retro)
    if (selectedFormats.length > 0) {
      result = result.filter((p) =>
        selectedFormats.some((fKey) => matchesFormat(p, fKey))
      );
    }

    // Filter by Sleeve Length
    if (selectedSleeves.length > 0) {
      result = result.filter((p) => {
        const normalized = normalizeSleeve(p.sleeve);
        return selectedSleeves.includes(normalized);
      });
    }

    // Sort
    if (sortBy === 'price-asc') {
      result.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    } else if (sortBy === 'name-asc') {
      result.sort((a, b) => (a.title || a.name || '').localeCompare(b.title || b.name || ''));
    } else if (sortBy === 'name-desc') {
      result.sort((a, b) => (b.title || b.name || '').localeCompare(a.title || a.name || ''));
    }

    return result;
  }, [initialProducts, selectedVersions, selectedFormats, selectedSleeves, sortBy]);

  // Compute live item counts for each filter option
  const counts = useMemo(() => {
    const masterCount = initialProducts.filter((p) => matchesVersion(p, 'master')).length;
    const playerCount = initialProducts.filter((p) => matchesVersion(p, 'player')).length;
    const setsCount = initialProducts.filter((p) => matchesFormat(p, 'sets')).length;
    const retroCount = initialProducts.filter((p) => matchesFormat(p, 'retro')).length;
    const halfCount = initialProducts.filter((p) => normalizeSleeve(p.sleeve) === 'short').length;
    const fullCount = initialProducts.filter((p) => normalizeSleeve(p.sleeve) === 'full').length;

    return { masterCount, playerCount, setsCount, retroCount, halfCount, fullCount };
  }, [initialProducts]);

  return (
    <div className={styles.container}>
      {/* Breadcrumb */}
      <div className={styles.breadcrumb}>
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href="/collections/all">Collections</Link>
        <span>/</span>
        <span className={styles.currentBreadcrumb}>{title}</span>
      </div>

      {/* Header */}
      <div className={styles.header}>
        <h1 className="font-display title-underline">{title}</h1>
        {isFallback && (
          <p style={{ color: 'var(--accent-color)', marginTop: '1rem', fontSize: '0.9375rem' }}>
            Showing all available jerseys below:
          </p>
        )}
      </div>

      {/* Mobile Filter Toggle Button */}
      <div className={styles.mobileToolbar}>
        <button
          onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
          className={styles.mobileFilterBtn}
        >
          <span>
            ⚡ Filters{' '}
            {hasActiveFilters &&
              `(${selectedVersions.length + selectedFormats.length + selectedSleeves.length})`}
          </span>
          <span>{mobileFilterOpen ? '✕ Close' : '⚙ Filter & Sort'}</span>
        </button>
      </div>

      <div className={styles.layout}>
        {/* Sidebar */}
        <aside className={`${styles.sidebar} ${mobileFilterOpen ? styles.sidebarOpen : ''}`}>
          {/* Active Filter Clear Header */}
          {hasActiveFilters && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.8rem', color: '#c4ff3d', fontWeight: 700 }}>Filters Active</span>
              <button
                onClick={resetFilters}
                style={{ background: 'none', border: 'none', color: '#ff7e7e', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline' }}
              >
                Reset All
              </button>
            </div>
          )}

          {/* 1. Category Filter */}
          <div className={styles.filterSection}>
            <h3 className={styles.filterTitle}>Category</h3>
            <ul className={styles.filterList}>
              <li>
                <Link
                  href="/collections/all"
                  className={currentSlug === 'all' ? styles.activeFilter : ''}
                >
                  ALL PRODUCTS
                </Link>
              </li>
              {categories.map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={`/collections/${cat.slug}`}
                    className={cat.slug === currentSlug ? styles.activeFilter : ''}
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 2. Version / Cut Filter (Master Version vs Player Version) */}
          <div className={styles.filterSection}>
            <h3 className={styles.filterTitle}>Edition / Version</h3>
            <ul className={styles.filterList}>
              <li>
                <label>
                  <input
                    type="checkbox"
                    checked={selectedVersions.includes('master')}
                    onChange={() => toggleVersion('master')}
                  />
                  <span>Master Version ({counts.masterCount})</span>
                </label>
              </li>
              <li>
                <label>
                  <input
                    type="checkbox"
                    checked={selectedVersions.includes('player')}
                    onChange={() => toggleVersion('player')}
                  />
                  <span>Player Version ({counts.playerCount})</span>
                </label>
              </li>
            </ul>
          </div>

          {/* 3. Special Format & Edition Filter (Sets & Retro) */}
          <div className={styles.filterSection}>
            <h3 className={styles.filterTitle}>Format & Edition</h3>
            <ul className={styles.filterList}>
              <li>
                <label>
                  <input
                    type="checkbox"
                    checked={selectedFormats.includes('sets')}
                    onChange={() => toggleFormat('sets')}
                  />
                  <span>Sets (with Shorts) ({counts.setsCount})</span>
                </label>
              </li>
              <li>
                <label>
                  <input
                    type="checkbox"
                    checked={selectedFormats.includes('retro')}
                    onChange={() => toggleFormat('retro')}
                  />
                  <span>Retro Classics ({counts.retroCount})</span>
                </label>
              </li>
            </ul>
          </div>

          {/* 4. Sleeve Length Filter */}
          <div className={styles.filterSection}>
            <h3 className={styles.filterTitle}>Sleeve Length</h3>
            <ul className={styles.filterList}>
              <li>
                <label>
                  <input
                    type="checkbox"
                    checked={selectedSleeves.includes('short')}
                    onChange={() => toggleSleeve('short')}
                  />
                  <span>Half Sleeves ({counts.halfCount})</span>
                </label>
              </li>
              <li>
                <label>
                  <input
                    type="checkbox"
                    checked={selectedSleeves.includes('full')}
                    onChange={() => toggleSleeve('full')}
                  />
                  <span>Full Sleeves ({counts.fullCount})</span>
                </label>
              </li>
            </ul>
          </div>
        </aside>

        {/* Main Product Grid */}
        <main className={styles.main}>
          <div className={styles.toolbar}>
            <span className={styles.productCount}>
              {filteredProducts.length} {filteredProducts.length === 1 ? 'jersey' : 'jerseys'} available
            </span>
            <div className={styles.sort}>
              <label htmlFor="sort">Sort by:</label>
              <select
                id="sort"
                className={styles.sortSelect}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="featured">Featured</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name-asc">Name: A to Z</option>
                <option value="name-desc">Name: Z to A</option>
              </select>
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 1rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>👕</div>
              <h3 style={{ color: '#fff', fontSize: '1.25rem', marginBottom: '0.5rem' }}>No jerseys found</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
                {hasActiveFilters
                  ? 'No products match the selected filters.'
                  : 'No jerseys available in this collection yet. Check back soon!'}
              </p>
              {hasActiveFilters ? (
                <button
                  onClick={resetFilters}
                  style={{
                    background: 'var(--accent-color)',
                    color: '#000',
                    border: 'none',
                    padding: '0.65rem 1.25rem',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                  }}
                >
                  Reset All Filters
                </button>
              ) : (
                <Link
                  href="/collections/all"
                  style={{
                    display: 'inline-block',
                    background: 'var(--accent-color)',
                    color: '#000',
                    padding: '0.65rem 1.25rem',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    textDecoration: 'none',
                  }}
                >
                  Browse All Products
                </Link>
              )}
            </div>
          ) : (
            <div className={styles.grid}>
              {filteredProducts.map((product) => {
                const isFullSleeve = normalizeSleeve(product.sleeve) === 'full';
                const isSet = matchesFormat(product, 'sets');

                return (
                  <div key={product.id || product._id} className={`product-card ${styles.card}`}>
                    <Link href={`/products/${product.slug}`} className={styles.imageWrapper}>
                      <img
                        src={product.image || (product.images && product.images[0]) || '/placeholder.png'}
                        alt={product.title || product.name}
                        className="product-card-img"
                      />

                      {/* Stacked Top Badges (No overlap on mobile) */}
                      <div className={styles.cardBadgeStack}>
                        {product.originalPrice && (
                          <span className={styles.saleBadge}>SALE</span>
                        )}
                        {isSet && (
                          <span className={styles.setBadge}>SET + SHORTS</span>
                        )}
                        {isFullSleeve && (
                          <span className={styles.sleeveBadge}>FULL SLEEVE</span>
                        )}
                      </div>
                    </Link>
                    <div className={styles.info}>
                      <Link href={`/products/${product.slug}`}>
                        <h3 className={styles.productName}>{product.title || product.name}</h3>
                      </Link>
                      <div className={styles.priceContainer}>
                        <span className={styles.price}>₹{product.price}</span>
                        {product.originalPrice && (
                          <span className={styles.originalPrice}>₹{product.originalPrice}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
