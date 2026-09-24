import { NextResponse } from 'next/server';
import {
  collection,
  doc,
  setDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  getDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import nodemailer from 'nodemailer';

// ─── Email helpers ──────────────────────────────────────────────────────────

export async function sendOrderEmails(order) {
  const smtpEmail = process.env.SMTP_EMAIL || 'turfdual@gmail.com';
  const smtpPassword = process.env.SMTP_PASSWORD;

  if (!smtpPassword || smtpPassword === 'YOUR_GMAIL_APP_PASSWORD_HERE') {
    console.log('⚠️ SMTP password not configured in environment variables. Order recorded: #' + order.orderId);
    return false;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: smtpEmail, pass: smtpPassword },
  });

  const itemsHtml = (order.items || []).map(item => {
    const printBadge = (item.customName || item.customNumber)
      ? `<br/><span style="display:inline-block;margin-top:4px;padding:2px 8px;background:rgba(196,255,61,0.15);color:#c4ff3d;font-size:12px;font-weight:bold;border-radius:4px;border:1px solid rgba(196,255,61,0.3);">⚡ Print: ${item.customName || ''} ${item.customNumber ? '#' + item.customNumber : ''} (+₹200)</span>`
      : '';
    return `<tr>
      <td style="padding:12px 14px;border-bottom:1px solid #222;">
        <strong style="color:#ffffff;font-size:14px;">${item.title}</strong>
        ${printBadge}
      </td>
      <td style="padding:12px 14px;border-bottom:1px solid #222;text-align:center;color:#cccccc;">${item.size}</td>
      <td style="padding:12px 14px;border-bottom:1px solid #222;text-align:center;color:#cccccc;">${item.quantity}</td>
      <td style="padding:12px 14px;border-bottom:1px solid #222;text-align:right;color:#c4ff3d;font-weight:bold;">₹${item.price * item.quantity}</td>
    </tr>`;
  }).join('');

  const adminHtml = `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;color:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #222;">
      <div style="background:linear-gradient(135deg,#c4ff3d,#8aff00);padding:24px 32px;text-align:center;">
        <h1 style="margin:0;color:#000000;font-size:24px;letter-spacing:2px;">⚽ NEW DUALTURF ORDER</h1>
        <p style="margin:6px 0 0;color:#1a1a1a;font-size:16px;font-weight:700;">#${order.orderId}</p>
      </div>
      <div style="padding:28px 32px;">
        <div style="background:#141414;border-radius:8px;padding:18px;margin-bottom:18px;border:1px solid #222;">
          <h3 style="margin:0 0 10px;color:#c4ff3d;font-size:13px;text-transform:uppercase;letter-spacing:1px;">👤 Customer Details</h3>
          <p style="margin:4px 0;font-size:14px;"><strong>Name:</strong> ${order.customer?.fullName || 'N/A'}</p>
          <p style="margin:4px 0;font-size:14px;"><strong>Phone:</strong> ${order.customer?.phone || 'N/A'}</p>
          <p style="margin:4px 0;font-size:14px;"><strong>Email:</strong> ${order.customer?.email || 'N/A'}</p>
        </div>
        <div style="background:#141414;border-radius:8px;padding:18px;margin-bottom:18px;border:1px solid #222;">
          <h3 style="margin:0 0 10px;color:#c4ff3d;font-size:13px;text-transform:uppercase;letter-spacing:1px;">📍 Shipping Address</h3>
          <p style="margin:4px 0;font-size:14px;line-height:1.5;">${order.customer?.address || ''}<br/>${order.customer?.city || ''}, ${order.customer?.state || ''} - ${order.customer?.pincode || ''}</p>
        </div>
        <div style="background:#141414;border-radius:8px;padding:18px;margin-bottom:18px;border:1px solid #222;">
          <h3 style="margin:0 0 10px;color:#c4ff3d;font-size:13px;text-transform:uppercase;letter-spacing:1px;">🛍️ Items Ordered</h3>
          <table style="width:100%;border-collapse:collapse;color:#fff;font-size:13px;">
            <thead><tr style="border-bottom:2px solid #c4ff3d;color:#aaa;">
              <th style="padding:8px 10px;text-align:left;">Product</th>
              <th style="padding:8px 10px;text-align:center;">Size</th>
              <th style="padding:8px 10px;text-align:center;">Qty</th>
              <th style="padding:8px 10px;text-align:right;">Amount</th>
            </tr></thead>
            <tbody>${itemsHtml}</tbody>
          </table>
        </div>
        <div style="background:#141414;border-radius:8px;padding:18px;border:1px solid #222;">
          <h3 style="margin:0 0 10px;color:#c4ff3d;font-size:13px;text-transform:uppercase;letter-spacing:1px;">💳 Payment</h3>
          <p style="margin:4px 0;font-size:14px;"><strong>Method:</strong> ${order.paymentMethod || 'N/A'}</p>
          <p style="margin:4px 0;font-size:14px;"><strong>Total:</strong> ₹${order.totalAmount || 0}</p>
          ${order.utr ? `<p style="margin:4px 0;font-size:14px;"><strong>UTR/Ref:</strong> <code style="color:#c4ff3d;">${order.utr}</code></p>` : ''}
        </div>
      </div>
      <div style="background:#111111;padding:16px 32px;text-align:center;font-size:12px;color:#666;">
        <p style="margin:0;">DualTurf Order Dispatch System • ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
      </div>
    </div>
  `;

  const adminText = `
⚽ NEW DUALTURF ORDER #${order.orderId}

Customer: ${order.customer?.fullName || 'N/A'}
Phone: ${order.customer?.phone || 'N/A'}
Email: ${order.customer?.email || 'N/A'}

Address:
${order.customer?.address || ''}, ${order.customer?.city || ''}, ${order.customer?.state || ''} - ${order.customer?.pincode || ''}

Items:
${(order.items || []).map(it => `- ${it.title} (${it.size}) x ${it.quantity} = ₹${it.price * it.quantity}`).join('\n')}

Total Amount: ₹${order.totalAmount || 0}
Payment Method: ${order.paymentMethod || 'Online'}
  `.trim();

  try {
    const info = await transporter.sendMail({
      from: `"DualTurf Orders" <${smtpEmail}>`,
      to: smtpEmail,
      replyTo: order.customer?.email || smtpEmail,
      subject: `🛒 New Order #${order.orderId} - ${order.customer?.fullName || 'Customer'} (₹${order.totalAmount || 0})`,
      text: adminText,
      html: adminHtml,
    });
    console.log(`✅ Admin order email sent successfully to ${smtpEmail} (ID: ${info.messageId})`);
  } catch (error) {
    console.error('❌ Admin email send failed:', error.message);
  }

  if (order.customer?.email) {
    const customerText = `
Hi ${order.customer?.fullName || 'Customer'},

Thank you for your order with DualTurf!
Your Order #${order.orderId} has been confirmed.

Order Summary:
${(order.items || []).map(it => `- ${it.title} (${it.size}) x ${it.quantity} = ₹${it.price * it.quantity}`).join('\n')}

Total: ₹${order.totalAmount || 0}
Delivery Time: 3–5 business days.

Need help? WhatsApp us at +91-7656072801 or visit https://www.dualturf.in
    `.trim();

    const customerHtml = `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#0d0d0d;color:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #222;">
        <div style="background:#141414;padding:28px 32px;text-align:center;border-bottom:2px solid #c4ff3d;">
          <h1 style="margin:0;color:#c4ff3d;font-size:26px;letter-spacing:3px;font-weight:900;">DUALTURF</h1>
          <p style="margin:6px 0 0;color:#ffffff;font-size:15px;font-weight:600;">ORDER CONFIRMATION</p>
          <p style="margin:4px 0 0;color:#888888;font-size:13px;">Order #${order.orderId}</p>
        </div>
        <div style="padding:28px 32px;">
          <p style="font-size:16px;line-height:1.6;margin-top:0;">Hi <strong>${order.customer?.fullName || 'Customer'}</strong>,<br/>Thank you for shopping at DualTurf! Your order has been confirmed and is being processed for dispatch.</p>
          <div style="background:#161616;border-radius:8px;padding:18px;margin-bottom:18px;border:1px solid rgba(196,255,61,0.2);">
            <h3 style="margin:0 0 10px;color:#c4ff3d;font-size:13px;text-transform:uppercase;letter-spacing:1px;">📦 Order Items</h3>
            <table style="width:100%;border-collapse:collapse;color:#fff;font-size:13px;">
              <thead><tr style="border-bottom:1px solid #333;color:#888;">
                <th style="padding:8px 10px;text-align:left;">Item</th>
                <th style="padding:8px 10px;text-align:center;">Size</th>
                <th style="padding:8px 10px;text-align:center;">Qty</th>
                <th style="padding:8px 10px;text-align:right;">Price</th>
              </tr></thead>
              <tbody>${itemsHtml}</tbody>
            </table>
          </div>
          <div style="background:rgba(196,255,61,0.06);border:1px solid rgba(196,255,61,0.25);border-radius:8px;padding:16px;margin-bottom:20px;">
            <h4 style="margin:0 0 6px;color:#c4ff3d;font-size:13px;">🛡️ Delivery Info:</h4>
            <p style="margin:4px 0;font-size:12px;color:#aaa;line-height:1.4;">
              • Estimated delivery: 3–5 business days (custom prints add 3–5 days).<br/>
              • Unboxing video mandatory for size replacement or defect claims.<br/>
              • Need help? WhatsApp us at <strong>+91-7656072801</strong>.
            </p>
          </div>
          <div style="text-align:center;margin-top:24px;">
            <a href="https://wa.me/917656072801?text=Hi%20DualTurf,%20I%20have%20a%20question%20about%20my%20order%20%23${order.orderId}" style="display:inline-block;background:#c4ff3d;color:#000000;font-weight:800;padding:12px 24px;border-radius:6px;text-decoration:none;font-size:14px;">
              📱 CHAT ON WHATSAPP
            </a>
          </div>
        </div>
        <div style="background:#111111;padding:16px 32px;text-align:center;font-size:12px;color:#666;border-top:1px solid #222;">
          <p style="margin:0;">DualTurf Official Jersey Store • Bhubaneswar, Odisha</p>
          <p style="margin:4px 0 0;"><a href="https://www.dualturf.in" style="color:#c4ff3d;text-decoration:none;">www.dualturf.in</a></p>
        </div>
      </div>
    `;
    try {
      const custInfo = await transporter.sendMail({
        from: `"DualTurf" <${smtpEmail}>`,
        to: order.customer.email,
        replyTo: smtpEmail,
        subject: `⚽ Order Confirmed #${order.orderId} - DualTurf Jersey Store`,
        text: customerText,
        html: customerHtml,
      });
      console.log(`✅ Customer confirmation email sent successfully to ${order.customer.email} (ID: ${custInfo.messageId})`);
    } catch (error) {
      console.error('❌ Customer email send failed:', error.message);
    }
  }
  return true;
}

async function sendActionEmail(order, actionStr) {
  const smtpEmail = process.env.SMTP_EMAIL;
  const smtpPassword = process.env.SMTP_PASSWORD;
  if (!smtpEmail || !smtpPassword || smtpPassword === 'YOUR_GMAIL_APP_PASSWORD_HERE') return false;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: smtpEmail, pass: smtpPassword },
  });
  try {
    await transporter.sendMail({
      from: `"DualTurf Action" <${smtpEmail}>`,
      to: smtpEmail,
      subject: `🚨 ${actionStr.toUpperCase()} - Order #${order.orderId}`,
      html: `<h2>${actionStr} Requested</h2><p>Customer: ${order.customer?.fullName} (${order.customer?.email})</p><p>Order ID: ${order.orderId}</p>`,
    });
    return true;
  } catch (error) {
    console.error('Action email error:', error);
    return false;
  }
}

// ─── Route Handlers ─────────────────────────────────────────────────────────

// GET /api/orders — fetch all orders, or filter by email/userId
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const userId = searchParams.get('userId');

    const ordersRef = collection(db, 'orders');
    let snap;

    if (email) {
      const cleanEmail = email.trim().toLowerCase();
      snap = await getDocs(query(ordersRef, where('customerEmail', '==', cleanEmail)));
    } else if (userId) {
      snap = await getDocs(query(ordersRef, where('userId', '==', userId)));
    } else {
      snap = await getDocs(query(ordersRef, orderBy('createdAt', 'desc')));
    }

    const orders = snap.docs.map(d => ({ firestoreId: d.id, ...d.data() }));
    // Sort client-side as a fallback (in case index not yet built for some filters)
    orders.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    return NextResponse.json({ success: true, orders });
  } catch (error) {
    console.error('GET /api/orders error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch orders' }, { status: 500 });
  }
}

// POST /api/orders — record a new order
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      orderId,
      customer,
      items,
      subtotal,
      shippingFee = 80,
      codFee = 0,
      totalAmount,
      advanceAmount,
      balanceCOD,
      paymentMethod,
      paymentId,
      utr,
      userId,
      status = 'New Order - Awaiting Verification',
    } = body;

    const newOrder = {
      orderId: orderId || `DT-${Math.floor(100000 + Math.random() * 900000)}`,
      createdAt: new Date().toISOString(),
      customer: customer || {},
      customerEmail: (customer?.email || '').trim().toLowerCase(),
      userId: userId || null,
      items: items || [],
      subtotal: subtotal || 0,
      shippingFee: shippingFee || 80,
      codFee: codFee || 0,
      totalAmount: totalAmount || (subtotal + (shippingFee || 80) + (codFee || 0)),
      advanceAmount: advanceAmount !== undefined ? advanceAmount : 0,
      balanceCOD: balanceCOD !== undefined ? balanceCOD : 0,
      paymentMethod: paymentMethod || '100% Online Payment',
      paymentId: paymentId || utr || 'N/A',
      utr: utr || paymentId || 'N/A',
      status,
    };

    // Use orderId as the Firestore document ID — idempotent.
    // The cart page also calls setDoc(doc(db,'orders', generatedId), ...)
    // so both writes land on the exact same document with no duplicates.
    const docRef = doc(collection(db, 'orders'), newOrder.orderId);
    await setDoc(docRef, newOrder, { merge: true });
    console.log(`🔔 NEW ORDER: #${newOrder.orderId} (Firestore doc: ${docRef.id})`);

    // Await email dispatch so Vercel / serverless runtime does not freeze before SMTP completes
    try {
      const emailSuccess = await sendOrderEmails(newOrder);
      if (emailSuccess) {
        await updateDoc(docRef, { emailSent: true }).catch(() => {});
      }
    } catch (err) {
      console.error('Order email dispatch error:', err);
    }

    return NextResponse.json({ success: true, order: { firestoreId: docRef.id, ...newOrder } });
  } catch (error) {
    console.error('POST /api/orders error:', error);
    return NextResponse.json({ success: false, message: 'Failed to record order' }, { status: 500 });
  }
}

// PATCH /api/orders — update order status by orderId field (not Firestore doc ID)
export async function PATCH(request) {
  try {
    const { orderId, status, cancellationReason, firestoreId } = await request.json();

    let docRef;
    if (firestoreId) {
      docRef = doc(db, 'orders', firestoreId);
    } else {
      // Find by orderId field
      const snap = await getDocs(query(collection(db, 'orders'), where('orderId', '==', orderId)));
      if (snap.empty) {
        return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
      }
      docRef = snap.docs[0].ref;
    }

    const nowIso = new Date().toISOString();
    const updatePayload = { status, updatedAt: nowIso };

    if (cancellationReason) {
      updatePayload.cancellationReason = cancellationReason;
      updatePayload.cancelledAt = nowIso;
    }

    if (status && status.toLowerCase().includes('delivered')) {
      updatePayload.deliveredAt = nowIso;
    }

    await updateDoc(docRef, updatePayload);
    const updated = (await getDoc(docRef)).data();

    if (['Cancelled', 'Return Requested', 'Replacement Requested', 'Exchange Requested'].includes(status)) {
      sendActionEmail(updated, status).catch(e => console.error(e));
    }

    return NextResponse.json({ success: true, order: updated });
  } catch (error) {
    console.error('PATCH /api/orders error:', error);
    return NextResponse.json({ success: false, message: 'Failed to update order' }, { status: 500 });
  }
}
