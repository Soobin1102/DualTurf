'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import styles from './clearance.module.css';

function normalizeSleeve(val) {
  if (!val) return 'short';
  return String(val).toLowerCase().includes('full') ? 'full' : 'short';
}

function getDiscountPct(price, originalPrice) {
  if (!originalPrice || !price) return 0;
  return Math.round(((originalPrice - price) / originalPrice) * 100);
}

export default function ClearanceSaleClient({ products = [] }) {
  const [sortBy, setSortBy] = useState('discount');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let result = [...products];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (p) =>
          (p.title || p.name || '').toLowerCase().includes(q) ||
          (p.team || '').toLowerCase().includes(q)
      );
    }

    if (sortBy === 'discount') {
      result.sort(
        (a, b) =>
          getDiscountPct(b.price, b.originalPrice) -
          getDiscountPct(a.price, a.originalPrice)
      );
    } else if (sortBy === 'price-asc') {
      result.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    } else if (sortBy === 'name-asc') {
      result.sort((a, b) =>
        (a.title || a.name || '').localeCompare(b.title || b.name || '')
      );
    }

    return result;
  }, [products, sortBy, search]);

  return (
    <div className={styles.container}>
      {/* Hero Banner */}
      <div className={styles.heroBanner}>
        <div className={styles.heroTag}>🔥 LIMITED TIME</div>
        <h1 className={styles.heroTitle}>CLEARANCE SALE</h1>
        <p className={styles.heroSubtitle}>
          Heavily discounted jerseys — grab them before they&apos;re gone!
        </p>
        {products.length > 0 && (
          <div className={styles.heroMeta}>
            {products.length} {products.length === 1 ? 'jersey' : 'jerseys'} on clearance
          </div>
        )}
      </div>

      {/* Breadcrumb */}
      <div className={styles.breadcrumb}>
        <Link href="/">Home</Link>
        <span>/</span>
        <span className={styles.currentBreadcrumb}>Clearance Sale</span>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <input
          type="text"
          placeholder="Search jerseys or teams..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.searchInput}
        />
        <div className={styles.sort}>
          <label htmlFor="cs-sort">Sort by:</label>
          <select
            id="cs-sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className={styles.sortSelect}
          >
            <option value="discount">Biggest Discount</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="name-asc">Name: A to Z</option>
          </select>
        </div>
      </div>

      {search.trim() && (
        <p className={styles.resultCount}>
          {filtered.length} result{filtered.length !== 1 ? 's' : ''} for &quot;{search}&quot;
        </p>
      )}

      {/* Empty States */}
      {products.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>🏷️</div>
          <h3>No clearance products yet</h3>
          <p>Check back soon — we&apos;ll be adding heavily discounted jerseys here!</p>
          <Link href="/collections/all" className={styles.shopAllBtn}>
            Browse All Products
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>🔍</div>
          <h3>No results for &quot;{search}&quot;</h3>
          <button onClick={() => setSearch('')} className={styles.shopAllBtn}>
            Clear Search
          </button>
        </div>
      ) : (
        <div className={styles.grid}>
          {filtered.map((product) => {
            const discountPct = getDiscountPct(product.price, product.originalPrice);
            const isFullSleeve = normalizeSleeve(product.sleeve) === 'full';

            return (
              <div key={product.id || product._id} className={styles.card}>
                <Link href={`/products/${product.slug}`} className={styles.imageWrapper}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={product.image || (product.images && product.images[0]) || '/placeholder.png'}
                    alt={product.title || product.name}
                    className={styles.cardImg}
                  />
                  <div className={styles.badgeStack}>
                    {discountPct > 0 && (
                      <span className={styles.discountBadge}>-{discountPct}% OFF</span>
                    )}
                    {!product.originalPrice && (
                      <span className={styles.clearanceBadge}>CLEARANCE</span>
                    )}
                    {isFullSleeve && (
                      <span className={styles.sleeveBadge}>FULL SLEEVE</span>
                    )}
                  </div>
                </Link>

                <div className={styles.cardInfo}>
                  <Link href={`/products/${product.slug}`}>
                    <h3 className={styles.productName}>{product.title || product.name}</h3>
                  </Link>
                  {product.team && <p className={styles.teamName}>{product.team}</p>}
                  <div className={styles.priceRow}>
                    <span className={styles.price}>₹{product.price}</span>
                    {product.originalPrice && (
                      <>
                        <span className={styles.originalPrice}>₹{product.originalPrice}</span>
                        <span className={styles.savingsTag}>
                          Save ₹{product.originalPrice - product.price}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

