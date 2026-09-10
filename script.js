import {
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  db,
  auth,
  initAnonymousAuth
} from "./firebase.js";

const BUYER_KEY = "scanbeli_buyer_v1";
const ORDERS_KEY = "scanbeli_orders_v1";

let anonymousUser = null;

/* =========================
   INIT FIREBASE
========================= */

async function initFirebase() {
  try {
    anonymousUser = await initAnonymousAuth();
    console.log("Firebase Anonymous UID:", anonymousUser.uid);
    return anonymousUser;
  } catch (error) {
    console.error("Firebase Auth Error:", error);
    return null;
  }
}

/* =========================
   HELPER
========================= */

function rupiah(number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(Number(number) || 0);
}

function generateOrderId() {
  return "SB-" + Math.random()
    .toString(36)
    .substring(2, 8)
    .toUpperCase();
}

function generateSellerCode() {
  return "SELLER-" + Math.random()
    .toString(36)
    .substring(2, 10)
    .toUpperCase();
}

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* =========================
   BUYER LOCAL DATA
========================= */

function getBuyer() {
  try {
    const data = localStorage.getItem(BUYER_KEY);

    if (!data) {
      return null;
    }

    return JSON.parse(data);
  } catch (error) {
    console.error("Gagal membaca data buyer:", error);
    return null;
  }
}

function saveBuyer(buyer) {
  localStorage.setItem(
    BUYER_KEY,
    JSON.stringify(buyer)
  );
}

/* =========================
   SELLER UID
========================= */

async function getSellerUid() {
  const user = await initFirebase();

  if (!user) {
    throw new Error("Firebase Authentication gagal.");
  }

  return user.uid;
}

/* =========================
   ENCODE PRODUCT
========================= */

function encodeProduct(product) {
  const json = JSON.stringify(product);

  return btoa(
    encodeURIComponent(json)
      .replace(/%([0-9A-F]{2})/g, function (match, p1) {
        return String.fromCharCode(
          parseInt(p1, 16)
        );
      })
  );
}

/* =========================
   DECODE PRODUCT
========================= */

function decodeProduct(encoded) {
  try {
    const binary = atob(encoded);

    const percentEncoded = Array.from(binary)
      .map(function (char) {
        return "%" +
          char.charCodeAt(0)
            .toString(16)
            .padStart(2, "0");
      })
      .join("");

    const json = decodeURIComponent(percentEncoded);

    return JSON.parse(json);

  } catch (error) {
    console.error("Gagal decode product:", error);
    return null;
  }
}

/* =========================
   BUYER PAGE
========================= */

function initBuyerPage() {
  const form = document.getElementById("buyerForm");

  if (!form) {
    return;
  }

  const nameInput =
    document.getElementById("buyerName");

  const phoneInput =
    document.getElementById("buyerPhone");

  const addressInput =
    document.getElementById("buyerAddress");

  const existingBuyer = getBuyer();

  if (existingBuyer) {
    if (nameInput) {
      nameInput.value = existingBuyer.name || "";
    }

    if (phoneInput) {
      phoneInput.value = existingBuyer.phone || "";
    }

    if (addressInput) {
      addressInput.value =
        existingBuyer.address || "";
    }
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    const buyer = {
      name: nameInput?.value.trim() || "",
      phone: phoneInput?.value.trim() || "",
      address: addressInput?.value.trim() || ""
    };

    if (!buyer.name) {
      alert("Nama wajib diisi.");
      return;
    }

    if (!buyer.phone) {
      alert("Nomor HP wajib diisi.");
      return;
    }

    if (!buyer.address) {
      alert("Alamat wajib diisi.");
      return;
    }

    saveBuyer(buyer);

    alert("Data pembeli berhasil disimpan.");

    window.location.href = "index.html";
  });
}

/* =========================
   SELLER PAGE
========================= */

async function initSellerPage() {
  const form = document.getElementById("sellerForm");

  if (!form) {
    return;
  }

  const nameInput =
    document.getElementById("productName");

  const priceInput =
    document.getElementById("productPrice");

  const codeInput =
    document.getElementById("productCode");

  const result =
    document.getElementById("qrResult");

  const qrContainer =
    document.getElementById("qrcode");

  let sellerUid = null;

  try {
    sellerUid = await getSellerUid();

    console.log(
      "Seller anonymous UID:",
      sellerUid
    );

  } catch (error) {
    console.error(error);

    if (result) {
      result.innerHTML = `
        <div class="error">
          Firebase belum siap.
        </div>
      `;
    }

    return;
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    const name =
      nameInput?.value.trim() || "";

    const price =
      Number(priceInput?.value || 0);

    const code =
      codeInput?.value.trim() ||
      generateOrderId();

    if (!name) {
      alert("Nama produk wajib diisi.");
      return;
    }

    if (!price || price <= 0) {
      alert("Harga produk harus lebih dari 0.");
      return;
    }

    const product = {
      name,
      price,
      code,
      sellerUid
    };

    const encoded =
      encodeProduct(product);

    /*
      URL mengikuti alamat GitHub Pages
      tempat seller.html berada.
    */

    const checkoutUrl =
      new URL(
        "checkout.html",
        window.location.href
      );

    checkoutUrl.searchParams.set(
      "product",
      encoded
    );

    if (qrContainer) {
      qrContainer.innerHTML = "";
    }

    if (
      typeof QRCode !== "undefined" &&
      qrContainer
    ) {
      new QRCode(qrContainer, {
        text: checkoutUrl.href,
        width: 240,
        height: 240
      });
    }

    if (result) {
      result.innerHTML = `
        <div class="success">
          <h3>QR berhasil dibuat</h3>

          <p>
            Produk:
            <strong>
              ${escapeHTML(name)}
            </strong>
          </p>

          <p>
            Harga:
            <strong>
              ${rupiah(price)}
            </strong>
          </p>

          <p>
            QR ini sudah terhubung
            dengan akun teknis penjual.
          </p>
        </div>
      `;
    }

    console.log(
      "Checkout URL:",
      checkoutUrl.href
    );
  });
}

/* =========================
   CHECKOUT PAGE
========================= */

async function initCheckoutPage() {
  const payButton =
    document.getElementById("payButton");

  if (!payButton) {
    return;
  }

  const params =
    new URLSearchParams(
      window.location.search
    );

  const encoded =
    params.get("product");

  if (!encoded) {
    alert("Produk tidak ditemukan.");
    return;
  }

  const product =
    decodeProduct(encoded);

  if (!product) {
    alert("Data produk tidak valid.");
    return;
  }

  const buyer =
    getBuyer();

  const productName =
    document.getElementById("productName");

  const productPrice =
    document.getElementById("productPrice");

  const buyerName =
    document.getElementById("buyerName");

  const buyerPhone =
    document.getElementById("buyerPhone");

  const buyerAddress =
    document.getElementById("buyerAddress");

  const feeElement =
    document.getElementById("fee");

  const totalElement =
    document.getElementById("total");

  if (productName) {
    productName.textContent =
      product.name || "Produk";
  }

  if (productPrice) {
    productPrice.textContent =
      rupiah(product.price);
  }

  if (buyerName) {
    buyerName.textContent =
      buyer?.name || "Belum diisi";
  }

  if (buyerPhone) {
    buyerPhone.textContent =
      buyer?.phone || "Belum diisi";
  }

  if (buyerAddress) {
    buyerAddress.textContent =
      buyer?.address || "Belum diisi";
  }

  /*
    Fee prototype 1%.
    Ini BELUM merupakan fee payment gateway.
  */

  const fee =
    Math.round(Number(product.price) * 0.01);

  const total =
    Number(product.price) + fee;

  if (feeElement) {
    feeElement.textContent =
      rupiah(fee);
  }

  if (totalElement) {
    totalElement.textContent =
      rupiah(total);
  }

  if (!buyer) {
    payButton.disabled = true;

    payButton.textContent =
      "Isi Data Pembeli Dahulu";

    payButton.addEventListener(
      "click",
      function () {
        window.location.href =
          "buyer.html";
      }
    );

    return;
  }

  payButton.addEventListener(
    "click",
    async function () {

      if (payButton.disabled) {
        return;
      }

      payButton.disabled = true;

      payButton.textContent =
        "Menyimpan Pesanan...";

      try {

        /*
          Pastikan buyer memiliki
          Firebase Anonymous Auth.
        */

        const buyerUser =
          await initFirebase();

        if (!buyerUser) {
          throw new Error(
            "Firebase Authentication gagal."
          );
        }

        if (!product.sellerUid) {
          throw new Error(
            "ID penjual tidak ditemukan pada QR."
          );
        }

        const orderId =
          generateOrderId();

        const orderData = {

          orderId,

          sellerUid:
            product.sellerUid,

          product: {
            name:
              product.name || "",
            code:
              product.code || ""
          },

          price:
            Number(product.price) || 0,

          fee,

          total,

          buyerName:
            buyer.name,

          buyerPhone:
            buyer.phone,

          buyerAddress:
            buyer.address,

          status:
            "MENUNGGU_PEMBAYARAN",

          createdAt:
            serverTimestamp()
        };

        /*
          Simpan online ke Firestore.
        */

        await addDoc(
          collection(db, "orders"),
          orderData
        );

        /*
          Simpan salinan lokal
          supaya orders.html tetap
          bisa menampilkan pesanan.
        */

        const localOrders =
          JSON.parse(
            localStorage.getItem(
              ORDERS_KEY
            ) || "[]"
          );

        localOrders.unshift({
          ...orderData,
          createdAt:
            new Date().toISOString()
        });

        localStorage.setItem(
          ORDERS_KEY,
          JSON.stringify(localOrders)
        );

        /*
          Berhasil.
        */

        window.location.href =
          "orders.html";

      } catch (error) {

        console.error(
          "Gagal membuat pesanan:",
          error
        );

        alert(
          "Gagal menyimpan pesanan.\n\n" +
          error.message
        );

        payButton.disabled =
          false;

        payButton.textContent =
          "Bayar Sekarang";
      }
    }
  );
}

/* =========================
   ORDERS PAGE
========================= */

function initOrdersPage() {

  const container =
    document.getElementById(
      "ordersContainer"
    ) ||
    document.getElementById(
      "orderList"
    ) ||
    document.getElementById(
      "ordersList"
    );

  if (!container) {
    return;
  }

  let orders = [];

  try {
    orders =
      JSON.parse(
        localStorage.getItem(
          ORDERS_KEY
        ) || "[]"
      );
  } catch (error) {
    orders = [];
  }

  if (!orders.length) {

    container.innerHTML = `
      <div class="empty">
        Belum ada pesanan.
      </div>
    `;

    return;
  }

  container.innerHTML =
    orders.map(function (order) {

      return `
        <div class="order-card">

          <h3>
            ${escapeHTML(
              order.product?.name ||
              "Produk"
            )}
          </h3>

          <p>
            <strong>Order:</strong>
            ${escapeHTML(
              order.orderId
            )}
          </p>

          <p>
            <strong>Total:</strong>
            ${rupiah(order.total)}
          </p>

          <p>
            <strong>Status:</strong>
            ${escapeHTML(
              order.status
            )}
          </p>

          <hr>

          <p>
            ${escapeHTML(
              order.buyerName
            )}
          </p>

          <p>
            ${escapeHTML(
              order.buyerPhone
            )}
          </p>

          <p>
            ${escapeHTML(
              order.buyerAddress
            )}
          </p>

        </div>
      `;

    }).join("");
}

/* =========================
   PAGE START
========================= */

document.addEventListener(
  "DOMContentLoaded",
  async function () {

    console.log(
      "SCANBELI V1.5"
    );

    /*
      Buyer dan orders tidak harus
      menunggu Firebase untuk tampil.
    */

    initBuyerPage();
    initOrdersPage();

    /*
      Seller dan checkout membutuhkan
      Firebase.
    */

    await initSellerPage();
    await initCheckoutPage();

  }
);
