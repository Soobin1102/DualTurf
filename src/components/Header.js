'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { getAllProducts } from '@/lib/sanity'
import { useCart } from '@/context/CartContext'
import { useAuth } from '@/context/AuthContext'
import { ShiftingDropDown } from '@/components/ui/shifting-dropdown'
import styles from './Header.module.css'

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(true)
  const pathname = usePathname()
  if (pathname === '/coming-soon') return null
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [liveProducts, setLiveProducts] = useState([])
  const [jerseyGuideOpen, setJerseyGuideOpen] = useState(false)

  const {
    cart,
    removeFromCart,
    updateQuantity,
    totalItems,
    subtotal,
    isCartOpen,
    setIsCartOpen,
  } = useCart()

  const { currentUser } = useAuth()

  useEffect(() => {
    fetch('/api/search')
      .then((res) => res.json())
      .then((data) => {
        if (data?.products) setLiveProducts(data.products)
      })
      .catch((err) => console.error("Header search API error:", err))
  }, [])

  const ignoreWords = ['jersey', 'jerseys', 'kit', 'kits', 'shirt', 'shirts', 'version', 'home', 'away', 'third', 'fan', 'player', 'stadium', 'the', 'a', 'an', 'for', 'in', 'of']
  
  const getSearchTokens = (str) => {
    return str
      .toLowerCase()
      .trim()
      .replace(/barca/g, 'barcelona')
      .replace(/man utd|mufc/g, 'manchester united')
      .replace(/man city|mcfc/g, 'manchester city')
      .replace(/rmfc/g, 'real madrid')
      .split(/\s+/)
      .filter((w) => Boolean(w) && !ignoreWords.includes(w))
  }

  const rawTokens = searchQuery.toLowerCase().trim().split(/\s+/).filter(Boolean)
  const searchTokens = getSearchTokens(searchQuery)
  const tokensToUse = searchTokens.length > 0 ? searchTokens : rawTokens

  const filteredProducts = searchQuery.trim()
    ? liveProducts.filter((p) => {
        const title = (p.title || p.name || '').toLowerCase()
        const team = (p.team || '').toLowerCase()
        const category = (p.category || '').toLowerCase()
        const fullText = `${title} ${team} ${category}`

        if (tokensToUse.length === 0) return true
        return tokensToUse.every((token) => fullText.includes(token)) || tokensToUse.some((token) => fullText.includes(token))
      })
    : []

  return (
    <>
      <header className={styles.header}>
        <div className={styles.headerFull}>
          {/* Mobile Hamburger Button */}
          <button
            className={styles.hamburger}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? '✕' : '☰'}
          </button>

          {/* Dual Turf Logo */}
          <div className={styles.leftCorner}>
            <Link href="/" className={styles.logo}>
              <span>D</span><span className={styles.accentText}>ual</span> <span>T</span><span className={styles.accentText}>urf</span>
            </Link>
          </div>

          {/* EXACT MIDDLE: Home, Categories Shifting DropDown, Contact Us */}
          <nav className={styles.centerNav}>
            <Link href="/" className={styles.navLink}>
              Home
            </Link>
            <div className={styles.shiftingWrapper}>
              <ShiftingDropDown />
            </div>
            <button onClick={() => setJerseyGuideOpen(true)} className={styles.navLink}>
              Jersey Guide
            </button>
            <Link href="/#about-us" className={styles.navLink}>
              About Us
            </Link>
            <Link href="/contact" className={styles.navLink}>
              Contact Us
            </Link>
          </nav>

          {/* FAR RIGHT CORNER: Search, Account, Cart */}
          <div className={styles.rightCorner}>
            <button
              className={styles.iconBtn}
              onClick={() => setSearchOpen(true)}
              title="Search"
              aria-label="Search"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>

            <Link href={currentUser ? "/account/orders" : "/account/login"} className={styles.iconBtn} title="Account" aria-label="Account">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </Link>

            <button
              className={styles.iconBtn}
              onClick={() => setIsCartOpen(true)}
              title="Cart"
              aria-label="Cart"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <path d="M16 10a4 4 0 0 1-8 0"></path>
              </svg>
              {totalItems > 0 && <span className={styles.badge}>{totalItems}</span>}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className={styles.mobileDrawer}>
          <div className={styles.mobileHeader}>
            <span className={styles.mobileLogo}>
              <span className={styles.logoRed}>D</span>ual <span className={styles.logoRed}>T</span>urf
            </span>
            <button onClick={() => setMobileOpen(false)}>✕</button>
          </div>
          <nav className={styles.mobileLinks}>
            <Link href="/" onClick={() => setMobileOpen(false)}>Home</Link>
            <div className={styles.mobileCategoryContainer}>
              <button 
                type="button"
                onClick={() => setMobileCategoriesOpen(!mobileCategoriesOpen)} 
                className={styles.mobileCategoryToggleBtn}
              >
                <span>Categories</span>
                <span className={styles.categoryArrow}>{mobileCategoriesOpen ? '▲' : '▼'}</span>
              </button>
              {mobileCategoriesOpen && (
                <div className={styles.mobileSubLinks}>
                  <Link href="/collections/2026-27-season-kits" className={styles.mobileSubLink} onClick={() => setMobileOpen(false)}>
                    Club Kits (2026-27)
                  </Link>
                  <Link href="/collections/international-kits" className={styles.mobileSubLink} onClick={() => setMobileOpen(false)}>
                    International Kits
                  </Link>
                  <Link href="/collections/retro-classics" className={styles.mobileSubLink} onClick={() => setMobileOpen(false)}>
                    Retro Classics
                  </Link>
                  <Link href="/collections/jerseys-with-shorts" className={styles.mobileSubLink} onClick={() => setMobileOpen(false)}>
                    Sets (Jersey with Shorts)
                  </Link>
                  <Link href="/collections/all" className={styles.mobileSubLink} onClick={() => setMobileOpen(false)}>
                    All Products
                  </Link>
                </div>
              )}
            </div>
            <button onClick={() => { setMobileOpen(false); setJerseyGuideOpen(true); }}>Jersey Guide</button>
            <Link href="/#about-us" onClick={() => setMobileOpen(false)}>About Us</Link>
            <Link href="/contact" onClick={() => setMobileOpen(false)}>Contact Us</Link>
            {currentUser ? (
              <Link href="/account/orders" onClick={() => setMobileOpen(false)}>My Account & Orders</Link>
            ) : (
              <Link href="/account/login" onClick={() => setMobileOpen(false)}>Login / Account</Link>
            )}
          </nav>
        </div>
      )}

      {/* Search Modal */}
      {searchOpen && (
        <div className={styles.modalOverlay} onClick={() => setSearchOpen(false)}>
          <div className={styles.searchModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.searchHeader}>
              <input
                type="text"
                placeholder="Search jerseys, kits, teams..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              <button onClick={() => setSearchOpen(false)}>✕</button>
            </div>
            <div className={styles.searchResults}>
              {searchQuery && filteredProducts.length === 0 && (
                <p className={styles.noResults}>No jerseys found for "{searchQuery}"</p>
              )}
              {filteredProducts.map((p) => (
                <Link
                  key={p.id || p._id}
                  href={`/products/${p.slug}`}
                  className={styles.searchItem}
                  onClick={() => setSearchOpen(false)}
                >
                  <img src={p.image} alt={p.title || p.name} />
                  <div>
                    <h4>{p.title || p.name}</h4>
                    <p className={styles.itemPrice}>₹{p.price}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsCartOpen(false)}>
          <div className={styles.cartDrawer} onClick={(e) => e.stopPropagation()}>
            <div className={styles.cartHeader}>
              <h2>YOUR BAG ({totalItems})</h2>
              <button onClick={() => setIsCartOpen(false)}>✕</button>
            </div>

            <div className={styles.cartContent}>
              {cart.length === 0 ? (
                <div className={styles.emptyCart}>
                  <p>Your bag is empty.</p>
                  <button
                    className="btn-primary"
                    style={{ marginTop: '1.5rem' }}
                    onClick={() => setIsCartOpen(false)}
                  >
                    CONTINUE SHOPPING
                  </button>
                </div>
              ) : (
                <div className={styles.cartList}>
                  {cart.map((item, idx) => (
                    <div key={`${item.id}-${item.size}-${item.customName || ''}-${item.customNumber || ''}-${idx}`} className={styles.cartRow}>
                      <img src={item.image} alt={item.title} className={styles.cartItemImg} />
                      <div className={styles.cartItemDetails}>
                        <h4 className={styles.cartItemTitle}>{item.title}</h4>
                        <p className={styles.cartItemMeta}>Size: {item.size}</p>
                        {(item.customName || item.customNumber) && (
                          <p style={{ fontSize: '0.75rem', color: '#c4ff3d', fontWeight: '700', marginTop: '0.2rem' }}>
                            ⚡ Print: {item.customName || ''} {item.customNumber ? `#${item.customNumber}` : ''}
                          </p>
                        )}
                        <p className={styles.cartItemPrice}>₹{item.price}</p>

                        <div className={styles.qtyRow}>
                          <button
                            className={styles.qtyBtn}
                            onClick={() => updateQuantity(item.id, item.size, -1, item.customName, item.customNumber)}
                          >
                            -
                          </button>
                          <span className={styles.qtyNum}>{item.quantity}</span>
                          <button
                            className={styles.qtyBtn}
                            onClick={() => updateQuantity(item.id, item.size, 1, item.customName, item.customNumber)}
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <button
                        className={styles.removeBtn}
                        onClick={() => removeFromCart(item.id, item.size, item.customName, item.customNumber)}
                        title="Remove"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className={styles.cartFooter}>
                <div className={styles.totalRow}>
                  <span>Subtotal</span>
                  <span className={styles.subtotalVal}>₹{subtotal}</span>
                </div>
                <Link
                  href="/cart"
                  className="btn-primary"
                  style={{ width: '100%' }}
                  onClick={() => setIsCartOpen(false)}
                >
                  PROCEED TO CHECKOUT →
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Jersey Guide Modal */}
      {jerseyGuideOpen && (
        <div
          onClick={() => setJerseyGuideOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#111111',
              border: '1px solid #333333',
              borderRadius: '12px',
              maxWidth: '680px',
              width: '100%',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.9)',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '90vh',
            }}
          >
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem 1.25rem',
              borderBottom: '1px solid #222222',
              backgroundColor: '#161616',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.2rem' }}>👕</span>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', letterSpacing: '0.05em' }}>
                  JERSEY VERSION GUIDE
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setJerseyGuideOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#aaaaaa',
                  fontSize: '1.4rem',
                  cursor: 'pointer',
                  padding: '0.2rem 0.5rem',
                  lineHeight: 1,
                  borderRadius: '4px',
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{
              padding: '1.5rem',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.75rem',
            }}>
              {/* Comparison Image */}
              <div style={{
                width: '100%',
                flexShrink: 0,
                borderRadius: '8px',
                overflow: 'hidden',
                border: '1px solid #2a2a2a',
                backgroundColor: '#000000',
                lineHeight: 0,
              }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/jersey-guide.jpeg"
                  alt="Player Version vs Master Version Comparison"
                  width={680}
                  height={850}
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                />
              </div>

              {/* Player Version */}
              <div style={{
                padding: '1.25rem',
                backgroundColor: 'rgba(196, 255, 61, 0.04)',
                border: '1px solid rgba(196, 255, 61, 0.12)',
                borderRadius: '8px',
              }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#c4ff3d', marginBottom: '0.875rem', letterSpacing: '0.04em' }}>
                  ⚽ Player Version
                </h4>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  <li style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.6 }}>
                    <strong style={{ color: '#ffffff' }}>Slim & Athletic Fit:</strong> Designed with a more fitted, streamlined silhouette for an athletic feel.
                  </li>
                  <li style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.6 }}>
                    <strong style={{ color: '#ffffff' }}>Lightweight & Breathable:</strong> Made with a more textured, lightweight fabric that offers better airflow and comfort.
                  </li>
                  <li style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.6 }}>
                    <strong style={{ color: '#ffffff' }}>Heat-Pressed Rubber Logos:</strong> Features sleek rubber logos that are heat-pressed onto the jersey for a lightweight finish.
                  </li>
                  <li style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.6 }}>
                    <strong style={{ color: '#ffffff' }}>Best for Physical Activities:</strong> Ideal for sports, workouts, and active use where breathability and freedom of movement are important.
                  </li>
                </ul>
              </div>

              {/* Master Version */}
              <div style={{
                padding: '1.25rem',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '8px',
              }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.875rem', letterSpacing: '0.04em' }}>
                  👕 Master Version
                </h4>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  <li style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.6 }}>
                    <strong style={{ color: '#ffffff' }}>Regular Fit:</strong> Designed with a comfortable, relaxed fit suitable for everyday wear.
                  </li>
                  <li style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.6 }}>
                    <strong style={{ color: '#ffffff' }}>Thicker Fabric:</strong> Uses a thicker, less-textured fabric that provides a more substantial feel.
                  </li>
                  <li style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.6 }}>
                    <strong style={{ color: '#ffffff' }}>Embroidered Logos:</strong> Features traditionally embroidered logos for a classic and durable finish.
                  </li>
                  <li style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.6 }}>
                    <strong style={{ color: '#ffffff' }}>Best for Regular Use:</strong> Ideal for casual wear, everyday use, and comfortable long-duration wear.
                  </li>
                </ul>
              </div>

              {/* Summary */}
              <div style={{
                padding: '0.875rem 1rem',
                backgroundColor: '#0a0a0a',
                borderRadius: '6px',
                borderLeft: '3px solid #c4ff3d',
              }}>
                <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, margin: 0 }}>
                  <strong style={{ color: '#c4ff3d' }}>In short:</strong> The <strong style={{ color: '#ffffff' }}>Player Version</strong> focuses on performance, breathability, and an athletic fit, while the <strong style={{ color: '#ffffff' }}>Master Version</strong> focuses on comfort, durability, and everyday wear.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
