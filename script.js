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


// =====================================================
// UTIL
// =====================================================

function rupiah(value) {

  return new Intl.NumberFormat(
    "id-ID",
    {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }
  ).format(Number(value) || 0);

}


function escapeHTML(value) {

  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


// =====================================================
// ORDER ID
// =====================================================

function generateOrderId() {

  const random =
    Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();

  return "SB-" + random;

}


// =====================================================
// BUYER DATA
// =====================================================

function getBuyer() {

  try {

    const data =
      localStorage.getItem(
        BUYER_KEY
      );

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


// =====================================================
// DECODE PRODUK DARI QR
// =====================================================

function decodeProduct(encoded) {

  try {

    if (!encoded) {
      return null;
    }


    const binary =
      atob(encoded);


    const bytes =
      new Uint8Array(
        binary.length
      );


    for (
      let i = 0;
      i < binary.length;
      i++
    ) {

      bytes[i] =
        binary.charCodeAt(i);

    }


    const json =
      new TextDecoder(
        "utf-8"
      ).decode(bytes);


    const product =
      JSON.parse(json);


    if (!product.name) {
      return null;
    }


    if (
      product.price === undefined ||
      product.price === null
    ) {

      return null;

    }


    return product;

  } catch (error) {

    console.error(
      "Decode product error:",
      error
    );

    return null;

  }

}


// =====================================================
// AUTH
// =====================================================

async function getAnonymousUser() {

  return await initAnonymousAuth();

}


// =====================================================
// BUYER PAGE
// =====================================================

function initBuyerPage() {

  const form =
    document.getElementById(
      "buyerForm"
    );


  if (!form) return;


  const nameInput =
    document.getElementById(
      "buyerName"
    );

  const phoneInput =
    document.getElementById(
      "buyerPhone"
    );

  const addressInput =
    document.getElementById(
      "buyerAddress"
    );


  const buyer =
    getBuyer();


  if (buyer) {

    if (nameInput) {

      nameInput.value =
        buyer.name || "";

    }


    if (phoneInput) {

      phoneInput.value =
        buyer.phone || "";

    }


    if (addressInput) {

      addressInput.value =
        buyer.address || "";

    }

  }


  form.addEventListener(
    "submit",
    function(event) {

      event.preventDefault();


      const name =
        nameInput?.value.trim() || "";

      const phone =
        phoneInput?.value.trim() || "";

      const address =
        addressInput?.value.trim() || "";


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

        alert(
          "Data pembeli berhasil disimpan."
        );

        window.location.href =
          "index.html";

      }

    }
  );

}


// =====================================================
// CHECKOUT
// =====================================================

async function initCheckoutPage() {

  /*
   * SANGAT PENTING:
   * Hanya jalankan fungsi ini jika
   * elemen checkout memang ada.
   */

  const checkoutContent =
    document.getElementById(
      "checkoutContent"
    );


  const checkoutLoading =
    document.getElementById(
      "checkoutLoading"
    );


  if (!checkoutContent && !checkoutLoading) {

    return;

  }


  const checkoutError =
    document.getElementById(
      "checkoutError"
    );


  const productName =
    document.getElementById(
      "checkoutProductName"
    );


  const productPrice =
    document.getElementById(
      "checkoutProductPrice"
    );


  const productCode =
    document.getElementById(
      "checkoutProductCode"
    );


  const summaryPrice =
    document.getElementById(
      "summaryPrice"
    );


  const summaryFee =
    document.getElementById(
      "summaryFee"
    );


  const summaryTotal =
    document.getElementById(
      "summaryTotal"
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
    );


  // ===================================================
  // AMBIL PARAMETER QR
  // ===================================================

  const params =
    new URLSearchParams(
      window.location.search
    );


  const encodedProduct =
    params.get("product");


  // Jika checkout dibuka tanpa QR
  if (!encodedProduct) {

    showCheckoutError(
      "Data produk tidak ditemukan. Silakan scan QR produk terlebih dahulu."
    );

    return;

  }


  // ===================================================
  // DECODE
  // ===================================================

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
    "Produk:",
    product
  );


  // ===================================================
  // TAMPIL PRODUK
  // ===================================================

  const price =
    Number(product.price) || 0;


  const fee =
    Math.round(
      price * FEE_PERCENT
    );


  const total =
    price + fee;


  if (productName) {

    productName.textContent =
      product.name;

  }


  if (productPrice) {

    productPrice.textContent =
      rupiah(price);

  }


  if (productCode) {

    productCode.textContent =
      product.code
        ? "Kode: " + product.code
        : "";

  }


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


  // ===================================================
  // DATA PEMBELI
  // ===================================================

  const buyer =
    getBuyer();


  if (buyer) {

    if (buyerName) {

      buyerName.value =
        buyer.name || "";

    }


    if (buyerPhone) {

      buyerPhone.value =
        buyer.phone || "";

    }


    if (buyerAddress) {

      buyerAddress.value =
        buyer.address || "";

    }

  }


  // ===================================================
  // TAMPIL CHECKOUT
  // ===================================================

  if (checkoutLoading) {

    checkoutLoading.style.display =
      "none";

  }


  if (checkoutContent) {

    checkoutContent.style.display =
      "block";

  }


  // ===================================================
  // BAYAR
  // ===================================================

  if (!payButton) return;


  payButton.onclick =
    async function() {

      try {

        payButton.disabled =
          true;

        payButton.textContent =
          "MEMPROSES...";


        const name =
          buyerName?.value.trim() || "";

        const phone =
          buyerPhone?.value.trim() || "";

        const address =
          buyerAddress?.value.trim() || "";


        if (!name) {

          alert(
            "Nama wajib diisi."
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


        if (!product.sellerUid) {

          throw new Error(
            "QR tidak memiliki sellerUid."
          );

        }


        // Simpan data pembeli
        saveBuyer({

          name,
          phone,
          address

        });


        // Firebase Auth
        const user =
          await getAnonymousUser();


        const orderId =
          generateOrderId();


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
            name,

          buyerPhone:
            phone,

          buyerAddress:
            address,

          status:
            "MENUNGGU_PEMBAYARAN",

          createdAt:
            serverTimestamp()

        };


        // Simpan Firestore
        await addDoc(
          collection(
            db,
            "orders"
          ),
          order
        );


        // Backup lokal
        saveLocalOrder({

          ...order,

          createdAt:
            new Date().toISOString()

        });


        // Berhasil
        window.location.href =
          "orders.html";

      } catch (error) {

        console.error(
          "Checkout error:",
          error
        );


        alert(
          "Gagal membuat pesanan:\n" +
          (
            error.message ||
            "Terjadi kesalahan."
          )
        );

      } finally {

        payButton.disabled =
          false;

        payButton.textContent =
          "BAYAR";

      }

    };

}


// =====================================================
// CHECKOUT ERROR
// =====================================================

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

    errorBox.innerHTML = `

      <strong>
        Produk tidak dapat dibuka
      </strong>

      <p>
        ${escapeHTML(message)}
      </p>

      <a
        href="index.html"
        class="btn"
      >
        Kembali
      </a>

    `;

  }

}


// =====================================================
// LOCAL ORDER
// =====================================================

function saveLocalOrder(order) {

  try {

    const orders =
      JSON.parse(
        localStorage.getItem(
          ORDERS_KEY
        ) || "[]"
      );


    orders.unshift(order);


    localStorage.setItem(
      ORDERS_KEY,
      JSON.stringify(orders)
    );

  } catch (error) {

    console.error(error);

  }

}


// =====================================================
// ORDERS PAGE
// =====================================================

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
    orders.map(
      order => `

        <div class="order-card">

          <h3>
            ${escapeHTML(
              order.product?.name ||
              "Produk"
            )}
          </h3>

          <p>
            Order:
            ${escapeHTML(
              order.orderId
            )}
          </p>

          <p>
            Total:
            <strong>
              ${rupiah(
                order.total
              )}
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

      `
    ).join("");

}


// =====================================================
// START
// =====================================================

document.addEventListener(
  "DOMContentLoaded",
  () => {

    initBuyerPage();

    initCheckoutPage();

    initOrdersPage();

  }
);
