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
  const pathname = usePathname()
  if (pathname === '/coming-soon') return null
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [liveProducts, setLiveProducts] = useState([])

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
          {/* FAR LEFT CORNER: Dual Turf Logo */}
          <div className={styles.leftCorner}>
            <Link href="/" className={styles.logo}>
              <span>D</span><span className={styles.accentText}>ual</span> <span>T</span><span className={styles.accentText}>urf</span>
            </Link>
          </div>

          {/* Mobile Hamburger Button */}
          <button
            className={styles.hamburger}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? '✕' : '☰'}
          </button>

          {/* EXACT MIDDLE: Home, Categories Shifting DropDown, Contact Us */}
          <nav className={styles.centerNav}>
            <Link href="/" className={styles.navLink}>
              Home
            </Link>
            <div className={styles.shiftingWrapper}>
              <ShiftingDropDown />
            </div>
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
            <Link href="/collections/all" onClick={() => setMobileOpen(false)}>Categories</Link>
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
    </>
  )
}
