'use client'

import React, { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import styles from './Orders.module.css'

export default function MyOrdersPage() {
  const { currentUser, userProfile, logout, updateSavedAddress, loading: authLoading } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState(null)
  
  // Saved Address Form State
  const [addressForm, setAddressForm] = useState({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  })
  const [savingAddress, setSavingAddress] = useState(false)
  const [addressNotice, setAddressNotice] = useState(null)

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/account/login')
    }
  }, [currentUser, authLoading, router])

  useEffect(() => {
    if (currentUser?.email) {
      fetchOrders()
    }
  }, [currentUser])

  useEffect(() => {
    const saved = userProfile?.savedAddress || currentUser?.savedAddress
    if (saved) {
      setAddressForm({
        fullName: saved.fullName || currentUser?.name || '',
        phone: saved.phone || '',
        address: saved.address || '',
        city: saved.city || '',
        state: saved.state || '',
        pincode: saved.pincode || '',
      })
    } else if (currentUser) {
      setAddressForm(prev => ({
        ...prev,
        fullName: currentUser.name || '',
      }))
    }
  }, [currentUser, userProfile])

  const fetchOrders = async () => {
    if (!currentUser) return
    try {
      setLoading(true)
      const ordersMap = new Map()

      // 1. Try local storage (instant)
      try {
        const localOrders = JSON.parse(localStorage.getItem('dualturf_customer_orders') || '[]')
        localOrders.forEach(o => {
          if (o.orderId) ordersMap.set(o.orderId, o)
        })
      } catch (e) {}

      // 2. Try Firestore queries
      try {
        if (currentUser.uid) {
          const qUid = query(collection(db, 'orders'), where('userId', '==', currentUser.uid))
          const snapUid = await getDocs(qUid)
          snapUid.forEach((docSnap) => {
            const data = docSnap.data()
            // Key by orderId (not doc ID) to deduplicate across write paths
            const key = data.orderId || docSnap.id
            ordersMap.set(key, { id: docSnap.id, ...data })
          })
        }
        if (currentUser.email) {
          const cleanEmail = currentUser.email.trim().toLowerCase()
          const qEmail = query(collection(db, 'orders'), where('customerEmail', '==', cleanEmail))
          const snapEmail = await getDocs(qEmail)
          snapEmail.forEach((docSnap) => {
            const data = docSnap.data()
            const key = data.orderId || docSnap.id
            ordersMap.set(key, { id: docSnap.id, ...data })
          })
        }
      } catch (fsErr) {
        console.warn('Firestore order fetch notice:', fsErr)
      }

      // 3. Try /api/orders
      try {
        const targetEmail = currentUser.email ? currentUser.email.trim().toLowerCase() : ''
        if (targetEmail) {
          const res = await fetch(`/api/orders?email=${encodeURIComponent(targetEmail)}`)
          const data = await res.json()
          if (data.success && Array.isArray(data.orders)) {
            data.orders.forEach(o => {
              if (o.orderId) ordersMap.set(o.orderId, o)
            })
          }
        }
      } catch (apiErr) {
        console.warn('API order fetch notice:', apiErr)
      }

      const merged = Array.from(ordersMap.values()).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      setOrders(merged)
    } catch (err) {
      console.error('Error fetching orders:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveAddress = async (e) => {
    e.preventDefault()
    setSavingAddress(true)
    setAddressNotice(null)
    try {
      await updateSavedAddress(addressForm)
      setAddressNotice('✅ Address saved! Checkout will automatically pre-fill with these details.')
      setTimeout(() => setAddressNotice(null), 4000)
    } catch (err) {
      setAddressNotice('❌ Failed to save address. Please try again.')
    } finally {
      setSavingAddress(false)
    }
  }

  // Cancellation Modal State
  const [cancellingOrder, setCancellingOrder] = useState(null)
  const [cancellationReason, setCancellationReason] = useState('Placed order by mistake')
  const [customReasonNote, setCustomReasonNote] = useState('')
  const [submittingCancel, setSubmittingCancel] = useState(false)

  const cancellationOptions = [
    'Placed order by mistake',
    'Want to change jersey size or style',
    'Need to change delivery address',
    'Delivery time taking longer than expected',
    'Found another option / price issue',
    'Other reason',
  ]

  // Calculate policy rules & windows
  const getTimingInfo = (order) => {
    const now = Date.now()
    const createdDate = new Date(order.createdAt || order._createdAt || now)
    const hoursSinceOrder = (now - createdDate.getTime()) / (1000 * 60 * 60)

    const statusLower = String(order.status || '').toLowerCase()
    const isDispatched = statusLower.includes('dispatched') || statusLower.includes('shipped') || statusLower.includes('out for delivery')
    const isDelivered = statusLower.includes('delivered')
    const isCancelled = statusLower.includes('cancelled')
    const isExchangeRequested = statusLower.includes('exchange') || statusLower.includes('replacement')

    // Rule 1: Cancellation eligible within 24 hours of placement prior to dispatch
    const canCancel = !isDispatched && !isDelivered && !isCancelled && hoursSinceOrder <= 24

    // Delivery calculation for 48h exchange rule
    const deliveryDate = new Date(order.deliveredAt || order.updatedAt || order.createdAt || now)
    const hoursSinceDelivery = (now - deliveryDate.getTime()) / (1000 * 60 * 60)

    // Rule 2: Exchange eligible within 48 hours of delivery
    const canExchange = isDelivered && hoursSinceDelivery <= 48 && !isExchangeRequested && !isCancelled

    return {
      hoursSinceOrder,
      hoursSinceDelivery,
      isDispatched,
      isDelivered,
      isCancelled,
      isExchangeRequested,
      canCancel,
      canExchange,
    }
  }

  const handleOpenCancelModal = (order) => {
    setCancellingOrder(order)
    setCancellationReason('Placed order by mistake')
    setCustomReasonNote('')
  }

  const handleConfirmCancellation = async () => {
    if (!cancellingOrder) return
    const finalReason = customReasonNote.trim()
      ? `${cancellationReason} — ${customReasonNote.trim()}`
      : cancellationReason

    setSubmittingCancel(true)
    try {
      setProcessingId(cancellingOrder.orderId)
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: cancellingOrder.orderId,
          status: 'Cancelled',
          cancellationReason: finalReason,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setOrders(prev => prev.map(o => o.orderId === cancellingOrder.orderId ? { ...o, status: 'Cancelled', cancellationReason: finalReason } : o))
        alert(`Order #${cancellingOrder.orderId} has been cancelled.`)
        setCancellingOrder(null)
      } else {
        alert(data.message || 'Failed to cancel order')
      }
    } catch (err) {
      console.error(err)
      alert('An error occurred while cancelling your order.')
    } finally {
      setSubmittingCancel(false)
      setProcessingId(null)
    }
  }

  const handleRequestExchange = async (order) => {
    const itemsSummary = (order.items || []).map(it => `• ${it.quantity}x ${it.title || it.name} (${it.size})`).join('\n')
    const text = `💬 *EXCHANGE REQUEST - DUALTURF*

📦 *Order ID:* #${order.orderId}
👤 *Name:* ${order.customer?.fullName || currentUser?.name || 'Customer'}
📞 *Phone:* ${order.customer?.phone || ''}
👕 *Items:*
${itemsSummary}
📅 *Order Date:* ${order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}

Reason for exchange: (Please specify size or item exchange details here)`

    const waUrl = `https://wa.me/917656072801?text=${encodeURIComponent(text)}`

    try {
      setProcessingId(order.orderId)
      await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.orderId, status: 'Exchange Requested' }),
      })
      setOrders(prev => prev.map(o => o.orderId === order.orderId ? { ...o, status: 'Exchange Requested' } : o))
    } catch (err) {
      console.warn('Status update notice:', err)
    } finally {
      setProcessingId(null)
    }

    window.open(waUrl, '_blank')
  }

  // Fallback timeout to prevent infinite loading screen
  const [loadingTimeout, setLoadingTimeout] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setLoadingTimeout(true), 2000)
    return () => clearTimeout(timer)
  }, [])

  if (authLoading && !currentUser && !loadingTimeout) {
    return (
      <div className="container" style={{ paddingTop: '140px', paddingBottom: '100px', textAlign: 'center', color: '#888' }}>
        <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Verifying your account session...</p>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="container" style={{ paddingTop: '140px', paddingBottom: '100px', textAlign: 'center', color: '#888' }}>
        <p style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#fff' }}>Please log in to access your account dashboard.</p>
        <Link href="/account/login" className="btn-primary">GO TO LOGIN →</Link>
      </div>
    )
  }

  return (
    <div className="container" style={{ paddingTop: '100px', paddingBottom: '100px', minHeight: '100vh' }}>
      <div className={styles.headerRow}>
        <div>
          <h1 className="font-display" style={{ fontSize: '2.8rem', color: '#fff' }}>My Dashboard</h1>
          <p className={styles.userSubtitle}>Welcome back, <strong>{currentUser.name || currentUser.email}</strong></p>
        </div>
        <button onClick={() => { logout(); router.push('/') }} className={styles.logoutBtn}>Logout</button>
      </div>

      {/* Saved Address Section */}
      <div className={styles.addressCard}>
        <div className={styles.addressHeader}>
          <h3>📍 Saved Shipping Address (Auto-Fills at Checkout)</h3>
          <span className={styles.expressBadge}>⚡ Fast Express Checkout</span>
        </div>

        {addressNotice && <p className={styles.addressNotice}>{addressNotice}</p>}

        <form onSubmit={handleSaveAddress} className={styles.addressFormGrid}>
          <div className={styles.fieldGroup}>
            <label>Full Name</label>
            <input
              type="text"
              placeholder="e.g. Rahul Sharma"
              value={addressForm.fullName}
              onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
              required
            />
          </div>

          <div className={styles.fieldGroup}>
            <label>Phone Number</label>
            <input
              type="tel"
              placeholder="e.g. 9876543210"
              value={addressForm.phone}
              onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
              required
            />
          </div>

          <div className={styles.fieldGroupFull}>
            <label>Street / House / Colony Address</label>
            <input
              type="text"
              placeholder="House/Flat No, Building, Street, Area"
              value={addressForm.address}
              onChange={(e) => setAddressForm({ ...addressForm, address: e.target.value })}
              required
            />
          </div>

          <div className={styles.fieldGroup}>
            <label>City</label>
            <input
              type="text"
              placeholder="e.g. Sambalpur"
              value={addressForm.city}
              onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
              required
            />
          </div>

          <div className={styles.fieldGroup}>
            <label>State</label>
            <input
              type="text"
              placeholder="e.g. Odisha"
              value={addressForm.state}
              onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
              required
            />
          </div>

          <div className={styles.fieldGroup}>
            <label>Pincode</label>
            <input
              type="text"
              placeholder="e.g. 768017"
              value={addressForm.pincode}
              onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
              required
            />
          </div>

          <div className={styles.fieldGroupFull}>
            <button type="submit" disabled={savingAddress} className="btn-primary" style={{ width: 'auto', alignSelf: 'flex-start' }}>
              {savingAddress ? 'SAVING...' : 'SAVE ADDRESS FOR FAST CHECKOUT'}
            </button>
          </div>
        </form>
      </div>

      {/* Order History */}
      <h2 className={`font-display ${styles.sectionTitle}`}>Order History</h2>

      {loading ? (
        <p className={styles.loadingText}>Loading your orders...</p>
      ) : orders.length === 0 ? (
        <div className={styles.emptyState}>
          <p>You haven't placed any orders yet.</p>
          <Link href="/collections/all" className="btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>START SHOPPING</Link>
        </div>
      ) : (
        <div className={styles.orderList}>
          {orders.map(order => {
            const timing = getTimingInfo(order)

            return (
              <div key={order.orderId} className={styles.orderCard}>
                <div className={styles.orderHeader}>
                  <div>
                    <h3>Order #{order.orderId}</h3>
                    <span className={styles.orderDate}>{new Date(order.createdAt || order._createdAt || Date.now()).toLocaleDateString()}</span>
                  </div>
                  <div className={styles.orderStatusBadge}>
                    {order.status}
                  </div>
                </div>

                <div className={styles.orderItems}>
                  {(order.items || []).map((item, idx) => (
                    <div key={idx} className={styles.itemRow}>
                      <span className={styles.itemTitle}>{item.quantity}x {item.title || item.name} ({item.size})</span>
                      <span className={styles.itemPrice}>₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                  {order.cancellationReason && (
                    <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', background: 'rgba(255, 61, 61, 0.1)', border: '1px solid rgba(255, 61, 61, 0.2)', borderRadius: '6px', fontSize: '0.8rem', color: '#ff7e7e' }}>
                      <strong>Cancellation Reason:</strong> {order.cancellationReason}
                    </div>
                  )}
                </div>

                <div className={styles.orderFooter}>
                  <div className={styles.orderTotal}>
                    <span>Total Amount:</span>
                    <strong>₹{order.totalAmount}</strong>
                  </div>
                  
                  <div className={styles.actionButtons}>
                    {timing.canCancel && (
                      <button 
                        onClick={() => handleOpenCancelModal(order)}
                        disabled={processingId === order.orderId}
                        className={styles.cancelBtn}
                      >
                        {processingId === order.orderId ? 'Processing...' : 'Cancel Order'}
                      </button>
                    )}

                    {!timing.isCancelled && !timing.isDispatched && !timing.isDelivered && !timing.canCancel && (
                      <span className={styles.policyBadgeExpired} title="Orders can only be cancelled within 24 hours of placement prior to dispatch">
                        ⏰ Cancel Window Expired (24h)
                      </span>
                    )}

                    {timing.isDispatched && !timing.isDelivered && !timing.isCancelled && (
                      <span className={styles.policyBadgeExpired}>
                        🚚 Dispatched (Cannot Cancel)
                      </span>
                    )}

                    {timing.canExchange && (
                      <button 
                        onClick={() => handleRequestExchange(order)}
                        disabled={processingId === order.orderId}
                        className={styles.returnBtn}
                      >
                        {processingId === order.orderId ? 'Opening WhatsApp...' : '💬 Request Exchange (WhatsApp)'}
                      </button>
                    )}

                    {timing.isDelivered && !timing.canExchange && !timing.isExchangeRequested && (
                      <span className={styles.policyBadgeExpired} title="Exchange requests are available within 48 hours of delivery">
                        ⏰ 48h Exchange Window Passed
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Cancellation Reason Modal */}
      {cancellingOrder && (
        <div className={styles.modalOverlay} onClick={() => setCancellingOrder(null)}>
          <div className={styles.cancelModal} onClick={(e) => e.stopPropagation()}>
            <h3>Cancel Order #{cancellingOrder.orderId}</h3>
            <p>Please select a reason for cancelling your order:</p>

            <select
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              className={styles.reasonSelect}
            >
              {cancellationOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>

            <textarea
              placeholder="Additional details or notes (optional)..."
              value={customReasonNote}
              onChange={(e) => setCustomReasonNote(e.target.value)}
              className={styles.reasonTextarea}
            />

            <div className={styles.modalActions}>
              <button
                type="button"
                onClick={() => setCancellingOrder(null)}
                className={styles.keepOrderBtn}
              >
                Keep Order
              </button>
              <button
                type="button"
                onClick={handleConfirmCancellation}
                disabled={submittingCancel}
                className={styles.confirmCancelBtn}
              >
                {submittingCancel ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
