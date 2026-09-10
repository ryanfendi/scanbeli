import {
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  db,
  initAnonymousAuth
} from "./firebase.js";


/* =====================================================
   SCANBELI V1.5
   =====================================================

   Fungsi:
   - Buyer data tersimpan di HP
   - Checkout membaca data buyer otomatis
   - Produk dibaca dari QR
   - Pesanan disimpan ke Firestore
   - Pesanan juga disimpan lokal sebagai backup
   - Tidak mengelola seller.html
   - Tidak membuat profil seller
   - Tidak menggunakan orderBy Firestore

===================================================== */


/* =====================================================
   CONFIG
===================================================== */

const BUYER_KEY =
  "scanbeli_buyer_v1";

const ORDERS_KEY =
  "scanbeli_orders_v1";

const FEE_PERCENT =
  0.01;


/* =====================================================
   HELPER
===================================================== */

function rupiah(value) {

  return new Intl.NumberFormat(
    "id-ID",
    {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }
  ).format(
    Number(value) || 0
  );

}


function escapeHTML(value) {

  return String(value ?? "")

    .replace(
      /&/g,
      "&amp;"
    )

    .replace(
      /</g,
      "&lt;"
    )

    .replace(
      />/g,
      "&gt;"
    )

    .replace(
      /"/g,
      "&quot;"
    )

    .replace(
      /'/g,
      "&#039;"
    );

}


function generateOrderId() {

  return (
    "SB-" +
    Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase()
  );

}


/* =====================================================
   BUYER LOCAL STORAGE
===================================================== */

function getBuyer() {

  try {

    const data =
      localStorage.getItem(
        BUYER_KEY
      );

    if (!data) {
      return null;
    }

    return JSON.parse(data);

  } catch (error) {

    console.error(
      "Gagal membaca data buyer:",
      error
    );

    return null;

  }

}


function saveBuyer(buyer) {

  try {

    localStorage.setItem(
      BUYER_KEY,
      JSON.stringify(buyer)
    );

    return true;

  } catch (error) {

    console.error(
      "Gagal menyimpan buyer:",
      error
    );

    return false;

  }

}


/* =====================================================
   PRODUCT DECODER
===================================================== */

function decodeProduct(encoded) {

  try {

    if (!encoded) {
      return null;
    }

    const binary =
      atob(encoded);

    let percentEncoded =
      "";

    for (
      let i = 0;
      i < binary.length;
      i++
    ) {

      const code =
        binary
          .charCodeAt(i)
          .toString(16)
          .padStart(2, "0");

      percentEncoded +=
        "%" + code;

    }

    const json =
      decodeURIComponent(
        percentEncoded
      );

    return JSON.parse(
      json
    );

  } catch (error) {

    console.error(
      "Decode produk gagal:",
      error
    );

    return null;

  }

}


/* =====================================================
   FIREBASE AUTH
===================================================== */

async function getAnonymousUser() {

  try {

    const user =
      await initAnonymousAuth();

    if (
      !user ||
      !user.uid
    ) {

      throw new Error(
        "Firebase Anonymous Authentication gagal."
      );

    }

    return user;

  } catch (error) {

    console.error(
      "Firebase Auth Error:",
      error
    );

    throw error;

  }

}


/* =====================================================
   BUYER PAGE
===================================================== */

function initBuyerPage() {

  const form =
    document.getElementById(
      "buyerForm"
    );

  if (!form) {
    return;
  }


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


  /* Ambil data lama */

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


  /* Simpan */

  form.addEventListener(
    "submit",
    function (event) {

      event.preventDefault();


      const name =
        nameInput?.value.trim() || "";

      const phone =
        phoneInput?.value.trim() || "";

      const address =
        addressInput?.value.trim() || "";


      if (!name) {

        alert(
          "Nama wajib diisi."
        );

        nameInput?.focus();

        return;

      }


      if (!phone) {

        alert(
          "Nomor HP wajib diisi."
        );

        phoneInput?.focus();

        return;

      }


      if (!address) {

        alert(
          "Alamat wajib diisi."
        );

        addressInput?.focus();

        return;

      }


      const saved =
        saveBuyer({
          name,
          phone,
          address
        });


      if (!saved) {

        alert(
          "Data gagal disimpan."
        );

        return;

      }


      alert(
        "Data pembeli berhasil disimpan."
      );


      window.location.href =
        "index.html";

    }
  );

}


/* =====================================================
   CHECKOUT PAGE
===================================================== */

async function initCheckoutPage() {

  const payButton =
    document.getElementById(
      "payButton"
    );

  /*
    Kalau bukan checkout.html,
    berhenti.
  */

  if (!payButton) {
    return;
  }


  /* =================================================
     AMBIL PRODUCT DARI URL
  ================================================= */

  const params =
    new URLSearchParams(
      window.location.search
    );

  const encoded =
    params.get(
      "product"
    );


  if (!encoded) {

    showCheckoutError(
      "Data produk tidak ditemukan."
    );

    payButton.disabled =
      true;

    return;

  }


  const product =
    decodeProduct(
      encoded
    );


  if (!product) {

    showCheckoutError(
      "Data produk tidak valid."
    );

    payButton.disabled =
      true;

    return;

  }


  console.log(
    "Produk:",
    product
  );


  /* =================================================
     VALIDASI PRODUCT
  ================================================= */

  const productNameValue =
    String(
      product.name || ""
    ).trim();

  const productPriceValue =
    Number(
      product.price || 0
    );

  const sellerUid =
    String(
      product.sellerUid || ""
    ).trim();


  if (
    !productNameValue
  ) {

    showCheckoutError(
      "Nama produk tidak ditemukan."
    );

    payButton.disabled =
      true;

    return;

  }


  if (
    !productPriceValue ||
    productPriceValue <= 0
  ) {

    showCheckoutError(
      "Harga produk tidak valid."
    );

    payButton.disabled =
      true;

    return;

  }


  if (!sellerUid) {

    showCheckoutError(
      "QR ini belum memiliki ID penjual. Buat QR baru dari seller.html."
    );

    payButton.disabled =
      true;

    return;

  }


  /* =================================================
     ELEMENT CHECKOUT
  ================================================= */

  const productName =
    document.getElementById(
      "productName"
    );

  const productPrice =
    document.getElementById(
      "productPrice"
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

  const feeElement =
    document.getElementById(
      "fee"
    );

  const totalElement =
    document.getElementById(
      "total"
    );


  /* =================================================
     TAMPILKAN PRODUCT
  ================================================= */

  if (productName) {

    productName.textContent =
      productNameValue;

  }


  if (productPrice) {

    productPrice.textContent =
      rupiah(
        productPriceValue
      );

  }


  /* =================================================
     BUYER
  ================================================= */

  const buyer =
    getBuyer();


  if (buyer) {

    if (buyerName) {

      buyerName.textContent =
        buyer.name || "";

    }

    if (buyerPhone) {

      buyerPhone.textContent =
        buyer.phone || "";

    }

    if (buyerAddress) {

      buyerAddress.textContent =
        buyer.address || "";

    }

  } else {

    if (buyerName) {

      buyerName.textContent =
        "Belum diisi";

    }

    if (buyerPhone) {

      buyerPhone.textContent =
        "Belum diisi";

    }

    if (buyerAddress) {

      buyerAddress.textContent =
        "Belum diisi";

    }

  }


  /* =================================================
     FEE
  ================================================= */

  const fee =
    Math.round(
      productPriceValue *
      FEE_PERCENT
    );


  const total =
    productPriceValue +
    fee;


  if (feeElement) {

    feeElement.textContent =
      rupiah(fee);

  }


  if (totalElement) {

    totalElement.textContent =
      rupiah(total);

  }


  /* =================================================
     JIKA BUYER BELUM DIISI
  ================================================= */

  if (!buyer) {

    payButton.disabled =
      false;

    payButton.textContent =
      "Isi Data Pembeli";

    payButton.onclick =
      function () {

        window.location.href =
          "buyer.html";

      };

    return;

  }


  /* =================================================
     CEGAH DOUBLE CLICK
  ================================================= */

  let processing =
    false;


  /* =================================================
     BUTTON BAYAR
  ================================================= */

  payButton.addEventListener(
    "click",
    async function () {

      if (processing) {
        return;
      }


      processing =
        true;


      payButton.disabled =
        true;

      payButton.textContent =
        "Menyimpan Pesanan...";


      try {

        /* =============================================
           VALIDASI BUYER LAGI
        ============================================= */

        const currentBuyer =
          getBuyer();


        if (
          !currentBuyer ||
          !currentBuyer.name ||
          !currentBuyer.phone ||
          !currentBuyer.address
        ) {

          throw new Error(
            "Data pembeli belum lengkap. Silakan isi Data Pembeli."
          );

        }


        /* =============================================
           FIREBASE ANONYMOUS
        ============================================= */

        const user =
          await getAnonymousUser();


        if (!user.uid) {

          throw new Error(
            "ID pengguna tidak tersedia."
          );

        }


        /* =============================================
           ORDER ID
        ============================================= */

        const orderId =
          generateOrderId();


        /* =============================================
           DATA ORDER
        ============================================= */

        const orderData = {

          orderId:

            orderId,


          sellerUid:

            sellerUid,


          buyerUid:

            user.uid,


          product: {

            name:
              productNameValue,

            code:
              product.code || ""

          },


          price:

            productPriceValue,


          fee:

            fee,


          total:

            total,


          buyerName:

            currentBuyer.name,


          buyerPhone:

            currentBuyer.phone,


          buyerAddress:

            currentBuyer.address,


          status:

            "MENUNGGU_PEMBAYARAN",


          createdAt:

            serverTimestamp()

        };


        console.log(
          "Menyimpan order:",
          orderData
        );


        /* =============================================
           SIMPAN KE FIRESTORE
        ============================================= */

        const docRef =
          await addDoc(
            collection(
              db,
              "orders"
            ),
            orderData
          );


        console.log(
          "Order Firestore berhasil:",
          docRef.id
        );


        /* =============================================
           BACKUP LOCAL
        ============================================= */

        saveLocalOrder({
          ...orderData,

          firestoreId:
            docRef.id,

          createdAt:
            new Date()
              .toISOString()

        });


        /* =============================================
           BERHASIL
        ============================================= */

        payButton.textContent =
          "Pesanan Berhasil";


        /*
          Jangan menunggu lama.
          Langsung ke halaman pesanan.
        */

        window.location.href =
          "orders.html";


      } catch (error) {

        console.error(
          "Gagal membuat pesanan:",
          error
        );


        processing =
          false;


        payButton.disabled =
          false;

        payButton.textContent =
          "Bayar Sekarang";


        showCheckoutError(
          "Gagal menyimpan pesanan: " +
          error.message
        );

      }

    }
  );

}


/* =====================================================
   LOCAL ORDER BACKUP
===================================================== */

function saveLocalOrder(order) {

  try {

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


    orders.unshift(
      order
    );


    /*
      Maksimal 100 order lokal.
    */

    if (
      orders.length >
      100
    ) {

      orders =
        orders.slice(
          0,
          100
        );

    }


    localStorage.setItem(
      ORDERS_KEY,
      JSON.stringify(
        orders
      )
    );


  } catch (error) {

    console.error(
      "Backup order lokal gagal:",
      error
    );

  }

}


/* =====================================================
   CHECKOUT ERROR
===================================================== */

function showCheckoutError(
  message
) {

  console.error(
    message
  );


  let box =
    document.getElementById(
      "checkoutError"
    );


  /*
    Kalau checkout.html belum
    mempunyai error box, buat
    otomatis.
  */

  if (!box) {

    box =
      document.createElement(
        "div"
      );

    box.id =
      "checkoutError";

    box.style.cssText = `
      margin:15px 0;
      padding:15px;
      border-radius:10px;
      background:#fee2e2;
      color:#991b1b;
      font-weight:600;
    `;


    const payButton =
      document.getElementById(
        "payButton"
      );


    if (
      payButton &&
      payButton.parentNode
    ) {

      payButton.parentNode.insertBefore(
        box,
        payButton
      );

    } else {

      document.body.prepend(
        box
      );

    }

  }


  box.innerHTML =
    escapeHTML(
      message
    );

  box.style.display =
    "block";

}


/* =====================================================
   ORDERS PAGE
===================================================== */

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

  } catch {

    orders = [];

  }


  if (!orders.length) {

    container.innerHTML = `
      <div class="empty">
        <h3>Belum ada pesanan</h3>
        <p>
          Pesanan yang Anda buat akan muncul di sini.
        </p>
      </div>
    `;

    return;

  }


  container.innerHTML =
    orders.map(
      function (order) {

        const productName =
          order.product?.name ||
          "Produk";


        return `

          <div class="order-card">

            <h3>
              ${escapeHTML(
                productName
              )}
            </h3>


            <p>

              <strong>
                Order:
              </strong>

              ${escapeHTML(
                order.orderId ||
                "-"
              )}

            </p>


            <p>

              <strong>
                Harga:
              </strong>

              ${rupiah(
                order.price
              )}

            </p>


            <p>

              <strong>
                Biaya SCANBELI:
              </strong>

              ${rupiah(
                order.fee
              )}

            </p>


            <p>

              <strong>
                Total:
              </strong>

              ${rupiah(
                order.total
              )}

            </p>


            <p>

              <strong>
                Status:
              </strong>

              ${escapeHTML(
                order.status ||
                "MENUNGGU_PEMBAYARAN"
              )}

            </p>


            <hr>


            <h4>
              Data Pengiriman
            </h4>


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

      }
    ).join("");

}


/* =====================================================
   PAGE INITIALIZATION
===================================================== */

document.addEventListener(
  "DOMContentLoaded",
  function () {

    console.log(
      "SCANBELI V1.5 aktif"
    );


    /*
      Buyer page
    */

    initBuyerPage();


    /*
      Orders page
    */

    initOrdersPage();


    /*
      Checkout page
    */

    initCheckoutPage();

  }
);
