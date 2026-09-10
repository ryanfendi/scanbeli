import {
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  db,
  initAnonymousAuth
} from "./firebase.js";


const BUYER_KEY = "scanbeli_buyer_v1";
const ORDERS_KEY = "scanbeli_orders_v1";

const FEE_PERCENT = 0.01;


// =====================================
// UTIL
// =====================================

function rupiah(value) {

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(Number(value) || 0);

}


function escapeHTML(value) {

  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


// =====================================
// ID ORDER
// =====================================

function generateOrderId() {

  const random =
    Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();

  return "SB-" + random;

}


// =====================================
// BUYER LOCAL STORAGE
// =====================================

function getBuyer() {

  try {

    const data =
      localStorage.getItem(BUYER_KEY);

    if (!data) return null;

    return JSON.parse(data);

  } catch (error) {

    console.error(error);

    return null;

  }

}


function saveBuyer(buyer) {

  localStorage.setItem(
    BUYER_KEY,
    JSON.stringify(buyer)
  );

}


// =====================================
// DECODE PRODUK DARI QR
// =====================================

function decodeProduct(encoded) {

  try {

    if (!encoded) {
      throw new Error("Data produk kosong.");
    }


    // Base64 → binary
    const binary =
      atob(encoded);


    // Binary → Uint8Array
    const bytes =
      new Uint8Array(binary.length);


    for (
      let i = 0;
      i < binary.length;
      i++
    ) {

      bytes[i] =
        binary.charCodeAt(i);

    }


    // UTF-8 → JSON
    const json =
      new TextDecoder("utf-8")
        .decode(bytes);


    const product =
      JSON.parse(json);


    if (!product.name) {
      throw new Error(
        "Nama produk tidak ditemukan."
      );
    }


    if (
      product.price === undefined ||
      product.price === null
    ) {

      throw new Error(
        "Harga produk tidak ditemukan."
      );

    }


    return product;

  } catch (error) {

    console.error(
      "Gagal decode produk:",
      error
    );

    return null;

  }

}


// =====================================
// FIREBASE ANONYMOUS AUTH
// =====================================

async function getAnonymousUser() {

  return await initAnonymousAuth();

}


// =====================================
// BUYER PAGE
// =====================================

function initBuyerPage() {

  const form =
    document.getElementById("buyerForm");

  if (!form) return;


  const nameInput =
    document.getElementById("buyerName");

  const phoneInput =
    document.getElementById("buyerPhone");

  const addressInput =
    document.getElementById("buyerAddress");


  // Isi data lama
  const buyer =
    getBuyer();


  if (buyer) {

    if (nameInput)
      nameInput.value =
        buyer.name || "";

    if (phoneInput)
      phoneInput.value =
        buyer.phone || "";

    if (addressInput)
      addressInput.value =
        buyer.address || "";

  }


  form.addEventListener(
    "submit",
    function(event) {

      event.preventDefault();


      const name =
        nameInput.value.trim();

      const phone =
        phoneInput.value.trim();

      const address =
        addressInput.value.trim();


      if (!name) {

        alert(
          "Nama lengkap wajib diisi."
        );

        return;

      }


      if (!phone) {

        alert(
          "Nomor HP wajib diisi."
        );

        return;

      }


      if (!address) {

        alert(
          "Alamat wajib diisi."
        );

        return;

      }


      saveBuyer({

        name,
        phone,
        address

      });


      alert(
        "Data pembeli berhasil disimpan."
      );


      // Jika datang dari checkout
      const returnUrl =
        sessionStorage.getItem(
          "scanbeli_return_checkout"
        );


      if (returnUrl) {

        sessionStorage.removeItem(
          "scanbeli_return_checkout"
        );

        window.location.href =
          returnUrl;

      } else {

        window.location.href =
          "index.html";

      }

    }
  );

}


// =====================================
// CHECKOUT
// =====================================

async function initCheckoutPage() {

  const loading =
    document.getElementById(
      "checkoutLoading"
    );

  const content =
    document.getElementById(
      "checkoutContent"
    );

  const errorBox =
    document.getElementById(
      "checkoutError"
    );


  // Kalau struktur HTML lama
  // gunakan selector alternatif
  const productName =
    document.getElementById(
      "checkoutProductName"
    ) ||
    document.getElementById(
      "productName"
    );


  const productPrice =
    document.getElementById(
      "checkoutProductPrice"
    ) ||
    document.getElementById(
      "productPrice"
    );


  const productCode =
    document.getElementById(
      "checkoutProductCode"
    ) ||
    document.getElementById(
      "productCode"
    );


  const buyerName =
    document.getElementById(
      "buyerName"
    );


  const buyerPhone =
    document.getElementById(
      "buyerPhone"
    );


  const buyerAddress =
    document.getElementById(
      "buyerAddress"
    );


  const payButton =
    document.getElementById(
      "payButton"
    ) ||
    document.getElementById(
      "checkoutButton"
    ) ||
    document.getElementById(
      "submitOrder"
    );


  // ===================================
  // AMBIL DATA QR
  // ===================================

  const params =
    new URLSearchParams(
      window.location.search
    );


  const encodedProduct =
    params.get("product");


  console.log(
    "Data QR:",
    encodedProduct
  );


  if (!encodedProduct) {

    showCheckoutError(
      "Data produk tidak ditemukan di QR."
    );

    return;

  }


  const product =
    decodeProduct(
      encodedProduct
    );


  if (!product) {

    showCheckoutError(
      "QR produk tidak valid atau data produk rusak."
    );

    return;

  }


  console.log(
    "Produk berhasil dibaca:",
    product
  );


  // ===================================
  // DATA PRODUK
  // ===================================

  if (productName) {

    productName.textContent =
      product.name;

  }


  if (productPrice) {

    productPrice.textContent =
      rupiah(product.price);

  }


  if (productCode) {

    productCode.textContent =
      product.code
        ? "Kode: " + product.code
        : "";

  }

const summaryPrice =
  document.getElementById("summaryPrice");

const summaryFee =
  document.getElementById("summaryFee");

const summaryTotal =
  document.getElementById("summaryTotal");


const price =
  Number(product.price) || 0;

const fee =
  Math.round(price * FEE_PERCENT);

const total =
  price + fee;


if (summaryPrice) {

  summaryPrice.textContent =
    rupiah(price);

}


if (summaryFee) {

  summaryFee.textContent =
    rupiah(fee);

}


if (summaryTotal) {

  summaryTotal.textContent =
    rupiah(total);

}
  
  // ===================================
  // DATA PEMBELI
  // ===================================

  const buyer =
    getBuyer();


  if (buyer) {

    if (buyerName)
      buyerName.value =
        buyer.name || "";

    if (buyerPhone)
      buyerPhone.value =
        buyer.phone || "";

    if (buyerAddress)
      buyerAddress.value =
        buyer.address || "";

  }


  // ===================================
  // TAMPILKAN PRODUK
  // ===================================

  if (loading) {

    loading.style.display =
      "none";

  }


  if (content) {

    content.style.display =
      "block";

  }


  // ===================================
  // TOMBOL CHECKOUT
  // ===================================

  if (!payButton) {

    console.warn(
      "Tombol checkout tidak ditemukan."
    );

    return;

  }


  payButton.addEventListener(
    "click",
    async function() {

      try {

        payButton.disabled =
          true;

        payButton.textContent =
          "Memproses...";


        // Ambil data pembeli
        const currentName =
          buyerName
            ? buyerName.value.trim()
            : "";

        const currentPhone =
          buyerPhone
            ? buyerPhone.value.trim()
            : "";

        const currentAddress =
          buyerAddress
            ? buyerAddress.value.trim()
            : "";


        if (!currentName) {

          alert(
            "Nama pembeli wajib diisi."
          );

          payButton.disabled =
            false;

          payButton.textContent =
            "Bayar Sekarang";

          return;

        }


        if (!currentPhone) {

          alert(
            "Nomor HP wajib diisi."
          );

          payButton.disabled =
            false;

          payButton.textContent =
            "Bayar Sekarang";

          return;

        }


        if (!currentAddress) {

          alert(
            "Alamat wajib diisi."
          );

          payButton.disabled =
            false;

          payButton.textContent =
            "Bayar Sekarang";

          return;

        }


        // Simpan data pembeli
        saveBuyer({

          name: currentName,

          phone: currentPhone,

          address: currentAddress

        });


        // =================================
        // FIREBASE
        // =================================

        const user =
          await getAnonymousUser();


        if (!product.sellerUid) {

          throw new Error(
            "QR tidak memiliki identitas penjual."
          );

        }


        const price =
          Number(product.price);


        const fee =
          Math.round(
            price * FEE_PERCENT
          );


        const total =
          price + fee;


        const orderId =
          generateOrderId();


        // =================================
        // ORDER
        // =================================

        const order = {

          orderId,

          sellerUid:
            product.sellerUid,

          buyerUid:
            user.uid,

          product: {

            name:
              product.name,

            code:
              product.code || ""

          },

          price,

          fee,

          total,

          buyerName:
            currentName,

          buyerPhone:
            currentPhone,

          buyerAddress:
            currentAddress,

          status:
            "MENUNGGU_PEMBAYARAN",

          createdAt:
            serverTimestamp()

        };


        // =================================
        // SIMPAN FIRESTORE
        // =================================

        await addDoc(
          collection(
            db,
            "orders"
          ),
          order
        );


        // =================================
        // BACKUP LOCAL
        // =================================

        saveLocalOrder({

          ...order,

          createdAt:
            new Date().toISOString()

        });


        // =================================
        // KE HALAMAN PESANAN
        // =================================

        window.location.href =
          "orders.html";


      } catch (error) {

        console.error(
          "Checkout error:",
          error
        );


        alert(
          "Gagal membuat pesanan:\n" +
          (error.message ||
            "Terjadi kesalahan.")
        );


        payButton.disabled =
          false;

        payButton.textContent =
          "Bayar Sekarang";

      }

    }
  );

}


// =====================================
// ERROR CHECKOUT
// =====================================

function showCheckoutError(message) {

  const loading =
    document.getElementById(
      "checkoutLoading"
    );

  const content =
    document.getElementById(
      "checkoutContent"
    );

  const errorBox =
    document.getElementById(
      "checkoutError"
    );


  if (loading) {

    loading.style.display =
      "none";

  }


  if (content) {

    content.style.display =
      "none";

  }


  if (errorBox) {

    errorBox.style.display =
      "block";

    errorBox.innerHTML =
      `
        <strong>Produk tidak dapat dibuka</strong>
        <p>${escapeHTML(message)}</p>
        <a href="seller.html">
          Buat QR Baru
        </a>
      `;

  } else {

    alert(message);

  }

}


// =====================================
// LOCAL ORDER
// =====================================

function saveLocalOrder(order) {

  try {

    const existing =
      JSON.parse(
        localStorage.getItem(
          ORDERS_KEY
        ) || "[]"
      );


    existing.unshift(order);


    localStorage.setItem(
      ORDERS_KEY,
      JSON.stringify(existing)
    );

  } catch (error) {

    console.error(
      "Gagal menyimpan local order:",
      error
    );

  }

}


// =====================================
// ORDERS PAGE
// =====================================

function initOrdersPage() {

  const container =
    document.getElementById(
      "ordersList"
    ) ||
    document.getElementById(
      "ordersContainer"
    );


  if (!container) return;


  let orders = [];


  try {

    orders =
      JSON.parse(
        localStorage.getItem(
          ORDERS_KEY
        ) || "[]"
      );

  } catch {

    orders = [];

  }


  if (!orders.length) {

    container.innerHTML = `
      <div class="empty-state">
        Belum ada pesanan.
      </div>
    `;

    return;

  }


  container.innerHTML =
    orders.map(order => `

      <div class="card order-card">

        <h3>
          ${escapeHTML(
            order.product?.name ||
            "Produk"
          )}
        </h3>

        <p>
          Order:
          <strong>
            ${escapeHTML(
              order.orderId
            )}
          </strong>
        </p>

        <p>
          Total:
          <strong>
            ${rupiah(order.total)}
          </strong>
        </p>

        <p>
          Status:
          <strong>
            ${escapeHTML(
              order.status
            )}
          </strong>
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

    `).join("");

}


// =====================================
// START
// =====================================

document.addEventListener(
  "DOMContentLoaded",
  function() {

    initBuyerPage();

    initCheckoutPage();

    initOrdersPage();

  }
);
