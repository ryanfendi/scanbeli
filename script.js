/* =====================================================
   SCANBELI V1
   ===================================================== */

const BUYER_KEY = "scanbeli_buyer_v1";
const ORDERS_KEY = "scanbeli_orders_v1";


/* =====================================================
   FORMAT RUPIAH
   ===================================================== */

function rupiah(value) {

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(Number(value));

}


/* =====================================================
   DATA PEMBELI
   ===================================================== */

function getBuyer() {

  try {

    const data =
      localStorage.getItem(BUYER_KEY);

    if (!data) {
      return null;
    }

    return JSON.parse(data);

  } catch {

    return null;

  }

}


function saveBuyer(data) {

  localStorage.setItem(
    BUYER_KEY,
    JSON.stringify(data)
  );

}


/* =====================================================
   HALAMAN BUYER
   ===================================================== */

const buyerForm =
  document.getElementById("buyerForm");


if (buyerForm) {

  const buyer =
    getBuyer();


  /* Isi otomatis jika sudah pernah menyimpan */

  if (buyer) {

    document.getElementById("buyerName").value =
      buyer.name || "";

    document.getElementById("buyerPhone").value =
      buyer.phone || "";

    document.getElementById("buyerAddress").value =
      buyer.address || "";

  }


  buyerForm.addEventListener(
    "submit",
    function(event) {

      event.preventDefault();


      const name =
        document
          .getElementById("buyerName")
          .value
          .trim();


      const phone =
        document
          .getElementById("buyerPhone")
          .value
          .trim();


      const address =
        document
          .getElementById("buyerAddress")
          .value
          .trim();


      if (!name || !phone || !address) {

        showMessage(
          "Lengkapi semua data.",
          true
        );

        return;

      }


      saveBuyer({
        name,
        phone,
        address
      });


      showMessage(
        "✓ Data berhasil disimpan."
      );


      setTimeout(() => {

        window.location.href =
          "index.html";

      }, 700);

    }
  );

}


function showMessage(
  text,
  error = false
) {

  const message =
    document.getElementById(
      "buyerMessage"
    );

  if (!message) return;

  message.textContent = text;

  message.style.color =
    error ? "#c62828" : "#087443";

}


/* =====================================================
   BUAT QR PENJUAL
   ===================================================== */

const sellerForm =
  document.getElementById("sellerForm");


if (sellerForm) {

  sellerForm.addEventListener(
    "submit",
    function(event) {

      event.preventDefault();


      const productName =
        document
          .getElementById("productName")
          .value
          .trim();


      const productPrice =
        Number(
          document
            .getElementById("productPrice")
            .value
        );


      const productCode =
        document
          .getElementById("productCode")
          .value
          .trim();


      if (
        !productName ||
        !productPrice ||
        !productCode
      ) {

        alert(
          "Lengkapi data produk."
        );

        return;

      }


      /*
       * DATA PRODUK
       *
       * Untuk V1 kita masukkan data produk
       * ke dalam link QR.
       *
       * Belum menggunakan database.
       */

      const product = {

        name: productName,

        price: productPrice,

        code: productCode

      };


      const encoded =
        encodeProduct(product);


      /*
       * Link checkout.
       */

      const base =
        window.location.href
          .replace("seller.html", "");


      const checkoutUrl =
        base +
        "checkout.html?product=" +
        encoded;


      /* Tampilkan QR */

      const qrResult =
        document.getElementById(
          "qrResult"
        );


      qrResult.classList.remove(
        "hidden"
      );


      document.getElementById(
        "qrProductName"
      ).textContent =
        productName;


      document.getElementById(
        "qrProductPrice"
      ).textContent =
        rupiah(productPrice);


      document.getElementById(
        "qrLink"
      ).textContent =
        checkoutUrl;


      const qrContainer =
        document.getElementById(
          "qrCode"
        );


      qrContainer.innerHTML = "";


      new QRCode(
        qrContainer,
        {
          text: checkoutUrl,
          width: 220,
          height: 220
        }
      );


      /* Tombol salin */

      document.getElementById(
        "copyLink"
      ).onclick = async function() {

        try {

          await navigator.clipboard.writeText(
            checkoutUrl
          );

          this.textContent =
            "✓ Link Disalin";

          setTimeout(() => {

            this.textContent =
              "Salin Link";

          }, 2000);

        } catch {

          prompt(
            "Salin link berikut:",
            checkoutUrl
          );

        }

      };

    }
  );

}


/* =====================================================
   ENCODE PRODUK
   ===================================================== */

function encodeProduct(product) {

  const json = JSON.stringify(product);

  return btoa(
    encodeURIComponent(json)
      .replace(/%([0-9A-F]{2})/g, function(match, p1) {
        return String.fromCharCode(
          parseInt(p1, 16)
        );
      })
  );

}


/* =====================================================
   DECODE PRODUK
   ===================================================== */

function decodeProduct(encoded) {

  try {

    const binary =
      atob(encoded);

    const bytes =
      Array.from(binary, char =>
        "%" +
        char.charCodeAt(0)
          .toString(16)
          .padStart(2, "0")
      ).join("");

    const json =
      decodeURIComponent(bytes);

    return JSON.parse(json);

  } catch (error) {

    console.error(error);

    return null;

  }

}


/* =====================================================
   CHECKOUT
   ===================================================== */

function loadCheckout() {

  const loading =
    document.getElementById(
      "checkoutLoading"
    );


  const checkout =
    document.getElementById(
      "checkout"
    );


  const noBuyer =
    document.getElementById(
      "noBuyer"
    );


  if (!loading || !checkout) {
    return;
  }


  const params =
    new URLSearchParams(
      window.location.search
    );


  const encodedProduct =
    params.get("product");


  const product =
    encodedProduct
      ? decodeProduct(encodedProduct)
      : null;


  if (!product) {

    loading.textContent =
      "Produk tidak ditemukan.";

    return;

  }


  const buyer =
    getBuyer();


  /*
   * BELUM ADA DATA PEMBELI
   */

  if (!buyer) {

    loading.classList.add(
      "hidden"
    );

    noBuyer.classList.remove(
      "hidden"
    );

    return;

  }


  /*
   * TAMPILKAN PRODUK
   */

  document.getElementById(
    "productName"
  ).textContent =
    product.name;


  document.getElementById(
    "productPrice"
  ).textContent =
    rupiah(product.price);


  /*
   * TAMPILKAN DATA PEMBELI
   */

  document.getElementById(
    "buyerName"
  ).textContent =
    buyer.name;


  document.getElementById(
    "buyerPhone"
  ).textContent =
    buyer.phone;


  document.getElementById(
    "buyerAddress"
  ).textContent =
    buyer.address;


  /*
   * FEE PROTOTYPE
   *
   * Untuk sementara 1%.
   */

  const fee =
    Math.round(
      product.price * 0.01
    );


  const total =
    product.price + fee;


  document.getElementById(
    "summaryPrice"
  ).textContent =
    rupiah(product.price);


  document.getElementById(
    "summaryFee"
  ).textContent =
    rupiah(fee);


  document.getElementById(
    "summaryTotal"
  ).textContent =
    rupiah(total);


  loading.classList.add(
    "hidden"
  );


  checkout.classList.remove(
    "hidden"
  );


  /*
   * TOMBOL BAYAR
   */

  document.getElementById(
    "payButton"
  ).onclick = function() {

    createOrder(
      product,
      buyer,
      fee,
      total
    );

  };

}


/* =====================================================
   BUAT ORDER PROTOTYPE
   ===================================================== */

function createOrder(
  product,
  buyer,
  fee,
  total
) {

  const orders =
    getOrders();


  const order = {

    id:
      "SB-" +
      Date.now()
        .toString(36)
        .toUpperCase(),

    product: product.name,

    productCode:
      product.code,

    price:
      product.price,

    fee:
      fee,

    total:
      total,

    buyer: {

      name:
        buyer.name,

      phone:
        buyer.phone,

      address:
        buyer.address

    },

    status:
      "Menunggu Pembayaran",

    createdAt:
      new Date().toISOString()

  };


  orders.unshift(order);


  localStorage.setItem(
    ORDERS_KEY,
    JSON.stringify(orders)
  );


  alert(
    "Order berhasil dibuat!\n\n" +
    "Nomor: " +
    order.id
  );


  window.location.href =
    "orders.html";

}


/* =====================================================
   AMBIL ORDER
   ===================================================== */

function getOrders() {

  try {

    return JSON.parse(
      localStorage.getItem(
        ORDERS_KEY
      )
    ) || [];

  } catch {

    return [];

  }

}


/* =====================================================
   HALAMAN ORDER
   ===================================================== */

function loadOrders() {

  const list =
    document.getElementById(
      "ordersList"
    );


  if (!list) return;


  const orders =
    getOrders();


  if (!orders.length) {

    list.innerHTML = `
      <div class="form-card">
        <h2>Belum ada pesanan</h2>
        <p>
          Pesanan akan muncul di sini.
        </p>
      </div>
    `;

    return;

  }


  list.innerHTML =
    orders.map(order => {

      return `

        <div class="order">

          <h3>
            ${escapeHTML(order.product)}
          </h3>

          <p>
            Order:
            <strong>
              ${escapeHTML(order.id)}
            </strong>
          </p>

          <p>
            Total:
            <strong>
              ${rupiah(order.total)}
            </strong>
          </p>

          <span class="status">
            ${escapeHTML(order.status)}
          </span>

          <hr>

          <p>
            <strong>
              ${escapeHTML(order.buyer.name)}
            </strong>
            <br>

            ${escapeHTML(order.buyer.phone)}
            <br>

            ${escapeHTML(order.buyer.address)}
          </p>

        </div>

      `;

    }).join("");

}


/* =====================================================
   ESCAPE HTML
   ===================================================== */

function escapeHTML(value) {

  return String(value)

    .replaceAll("&", "&amp;")

    .replaceAll("<", "&lt;")

    .replaceAll(">", "&gt;")

    .replaceAll('"', "&quot;")

    .replaceAll("'", "&#039;");

}


/* =====================================================
   JALANKAN CHECKOUT
   ===================================================== */

if (
  document.getElementById(
    "checkout"
  )
) {

  loadCheckout();

}


/* =====================================================
   JALANKAN ORDERS
   ===================================================== */

if (
  document.getElementById(
    "ordersList"
  )
) {

  loadOrders();

}
