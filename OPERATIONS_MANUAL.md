# 📱 Complete User Guide & Operations Manual
## Dynamic QR + NFC Smart Card Management System

---

## 📑 Table of Contents
1. [Core Architecture & Concept](#1-core-architecture--concept)
2. [Login & Dashboard Access](#2-login--dashboard-access)
3. [How to Create a New Card](#3-how-to-create-a-new-card)
4. [How to Generate & Export QR Codes for Printing](#4-how-to-generate--export-qr-codes-for-printing)
5. [Physical Card Printing & NFC Chip Encoding Guide](#5-physical-card-printing--nfc-chip-encoding-guide)
6. [How to Change / Update a Client's Real Destination Link](#6-how-to-change--update-a-clients-real-destination-link)
7. [How to Enable or Disable a Card (Deactivation)](#7-how-to-enable-or-disable-a-card-deactivation)
8. [Tracking Live Scan Analytics](#8-tracking-live-scan-analytics)
9. [Troubleshooting & FAQ](#9-troubleshooting--faq)

---

## 1. Core Architecture & Concept

### The "Zero Re-Print" Rule
When you create a dynamic card in the system, it is assigned a **Permanent Public Security Token** (e.g. `7KQ4M8X2`).

```
Physical PVC Card (NFC Chip / Printed QR)
                    ↓
        Permanent Dynamic URL:
https://dynamic-qr-1.vercel.app/c/{TOKEN}
                    ↓
     Supabase Edge Redirection Engine
                    ↓
  Reads Live "destination_url" from Database
                    ↓
       Instant HTTP 302 Redirection
                    ↓
  Customer Lands on Real Client Link (Google Review, Website, Instagram, etc.)
```

> **IMPORTANT**:
> **You NEVER burn the client's direct link (e.g. Google Review link) onto the physical card or QR code.**  
> You **ONLY** burn the **Permanent Dynamic URL** (`https://dynamic-qr-1.vercel.app/c/{TOKEN}`).  
> This allows you to change the client's destination URL 1,000 times in the dashboard **without ever replacing or reprinting the physical card.**

---

## 2. Login & Dashboard Access

1. Open the Admin Dashboard: `https://dynamic-qr-1.vercel.app/login` (or your local environment at `/login`).
2. Enter the Admin Credentials:
   - **Email**: `admin@cardsync.io`
   - **Password**: `admin123`
3. Click **Sign In to Dashboard** (or use the **1-Click Direct Demo Sign In** button).
4. You will be redirected to the **Admin Dashboard** with real-time statistics (Total Cards, Active Cards, Total Scans, Disabled Cards).

---

## 3. How to Create a New Card

1. Navigate to **Cards** from the left navigation sidebar.
2. Click the blue **"+ Create Card"** button in the top right.
3. In the modal:
   - **Destination URL (Optional)**: Enter the client's real landing link (e.g. `https://g.page/r/your-client-google-review` or `https://instagram.com/mybusiness`).  
     *(Note: If you do not have the client's link yet, leave it empty. You can set it later).*
4. Click **Create Card in Database**.
5. The system automatically:
   - Allocates the next sequential card number (e.g. `CARD-0005`).
   - Generates a cryptographically secure 8-character random public token (e.g. `V3GL4CCY`).
   - Creates the permanent dynamic URL: `https://dynamic-qr-1.vercel.app/c/V3GL4CCY`.
   - Sets initial status to **READY** and scan count to **0**.

---

## 4. How to Generate & Export QR Codes for Printing

### Option A: From Card Details Page
1. Go to **Cards** → Click on any card row or the **Eye icon (View)**.
2. On the right-hand panel, you will see the **Physical QR Code Asset**.
3. Choose your export format:
   - **Download {CARD-XXXX}.png**: High-resolution raster image for quick graphics insertion.
   - **Download {CARD-XXXX}.svg**: Lossless vector graphic for professional CMYK offset / UV printing.

### Option B: From QR Generator Tool
1. Click **QR Generator** in the sidebar.
2. Select the card from the dropdown menu (e.g. `CARD-0001 — Token: 7KQ4M8X2`).
3. Verify the pre-print verification box:
   - **QR Content**: `https://dynamic-qr-1.vercel.app/c/7KQ4M8X2`
   - **Valid Dynamic URL**: ✓
4. Click **Download PNG** or **Download SVG**.

---

## 5. Physical Card Printing & NFC Chip Encoding Guide

### Step 5.1: Card Graphic Printing
1. Provide your card printing manufacturer or UV printer with the downloaded **SVG / PNG** QR asset.
2. Place the QR code on the back (or front) of the PVC card design.
3. *(Optional)* Print the Human-Readable identifier on the card corner (e.g., `CARD-0001` or `ID: 7KQ4M8X2`).

### Step 5.2: NFC Chip Encoding (Burning the Tag)
You can use any standard smartphone (iPhone or Android) with a free NFC tool (such as **NFC Tools** by Wakdev).

1. Download **NFC Tools** from App Store (iOS) or Google Play Store (Android).
2. Open **NFC Tools** → Tap **Write**.
3. Tap **Add a record** → Select **URL / URI**.
4. Enter the card's exact **Permanent Dynamic URL**:
   ```
   https://dynamic-qr-1.vercel.app/c/7KQ4M8X2
   ```
5. Tap **OK** → Tap **Write / NDEF Format**.
6. Hold your smartphone against the physical PVC NFC card until you hear the confirmation beep / checkmark.
7. **Test the Card**: Tap the card with any phone. It will immediately redirect to the client's destination.

---

## 6. How to Change / Update a Client's Real Destination Link

Whenever a client changes their Google Review link, website, menu link, or social profile:

1. Log in to the Admin Dashboard.
2. Go to **Cards** → Locate the client's card (use search by Card # or Token).
3. Click the **Edit icon (Pencil)** on the card row, or open **Card Details** and click **Edit Destination**.
4. In the modal:
   - Enter the **New Destination URL** (e.g. `https://g.page/r/new-review-link` or `https://example.org`).
5. Click **Save Changes to Supabase**.
6. **Result**: 
   - The database updates instantly.
   - The physical QR code on the printed PVC card remains identical.
   - The NFC chip payload remains identical.
   - When anyone taps or scans the physical card, they will instantly land on the **new link**.

---

## 7. How to Enable or Disable a Card (Deactivation)

If a customer loses a card, cancels their subscription, or reports a card stolen:

1. Go to **Cards** → Open the card details page.
2. Click **Disable Card** (or **Change Status** → select `Disabled`).
3. **Immediate Effect**:
   - The card status in Supabase becomes `DISABLED`.
   - If anyone taps the NFC or scans the QR code, the Supabase Edge Function blocks the redirect with an **HTTP 403 / "Card Deactivated"** safety screen.
4. **To Re-Enable**:
   - Open the card and click **Enable Card** (or change status to `Ready`).
   - Redirection is immediately restored.

---

## 8. Tracking Live Scan Analytics

1. On the **Dashboard**:
   - View **Total Scans**: Sum of all verified tap and scan redirect events across all cards.
   - View **Active Cards**: Count of cards currently deployed and operational.
   - View **Pending Destination**: Cards created but awaiting destination assignment.
2. On each **Card Details Page**:
   - View **Total Verified Scans**: Exact count of customer taps on that individual card.
   - View **Created Date** & **Last Database Update** timestamps.
3. Every time a customer taps or scans `/c/{TOKEN}`, the backend atomic database RPC increments `scan_count = scan_count + 1`.

---

## 9. Troubleshooting & FAQ

#### Q: Do I ever need to reprogram an NFC card when a business changes its URL?
**A: NO.** The NFC card only contains `https://dynamic-qr-1.vercel.app/c/{TOKEN}`. You only change the target in the dashboard.

#### Q: What happens if a scanned QR code has no destination URL set yet?
**A: ** The user sees a clean system page: *"This card is active, but its destination URL has not been assigned yet."* As soon as you set the link in the dashboard, scans will forward automatically.

#### Q: What if a client wants to redirect to an Instagram page or WhatsApp link instead of Google Reviews?
**A: ** It works with **ANY** valid HTTP / HTTPS URL:
- Google Reviews: `https://g.page/r/...`
- WhatsApp: `https://wa.me/1234567890`
- Instagram: `https://instagram.com/business`
- Custom Website / Menu: `https://restaurant.com/menu`

#### Q: How do I test a card without a physical scanner?
**A: ** Go to **Card Details** and click **"Test Live Link"** or **"Open Live Dynamic URL"** to test the exact redirect flow in your browser.
