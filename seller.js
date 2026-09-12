/* =====================================================
   SCANBELI SELLER V1
   Produk Fisik + Digital
   QR Produk + QR Katalog
   Gambar menggunakan URL eksternal
===================================================== */

const STORE_KEY = "scanbeli_store_v1";
const PRODUCTS_KEY = "scanbeli_products_v1";

let products = [];
let editingProductId = null;
let currentQrUrl = "";


/* =====================================================
   ELEMENT
===================================================== */

const storeNameInput =
  document.getElementById("storeName");

const saveStoreButton =
  document.getElementById("saveStoreButton");

const editStoreButton =
  document.getElementById("editStoreButton");

const productForm =
  document.getElementById("productForm");

const physicalOptions =
  document.getElementById("physicalOptions");

const digitalOptions =
  document.getElementById("digitalOptions");

const directDeliveryOptions =
  document.getElementById("directDeliveryOptions");

const digitalLinkGroup =
  document.getElementById("digitalLinkGroup");

const digitalWhatsappGroup =
  document.getElementById("digitalWhatsappGroup");

const productImage =
  document.getElementById("productImage");

const imagePreviewBox =
  document.getElementById("imagePreviewBox");

const imagePreview =
  document.getElementById("imagePreview");

const imagePreviewStatus =
  document.getElementById("imagePreviewStatus");

const productsContainer =
  document.getElementById("productsContainer");

const emptyProducts =
  document.getElementById("emptyProducts");

const catalogQr =
  document.getElementById("catalogQr");

const catalogQrInfo =
  document.getElementById("catalogQrInfo");

const catalogQrStoreName =
  document.getElementById("catalogQrStoreName");

const createCatalogQr =
  document.getElementById("createCatalogQr");

const downloadCatalogQr =
  document.getElementById("downloadCatalogQr");

const imageGuideModal =
  document.getElementById("imageGuideModal");

const imageGuideButton =
  document.getElementById("imageGuideButton");

const closeImageGuide =
  document.getElementById("closeImageGuide");

const closeImageGuide2 =
  document.getElementById("closeImageGuide2");

const qrModal =
  document.getElementById("qrModal");

const closeQrModal =
  document.getElementById("closeQrModal");

const productQr =
  document.getElementById("productQr");

const qrTitle =
  document.getElementById("qrTitle");

const qrSubtitle =
  document.getElementById("qrSubtitle");

const qrStoreName =
  document.getElementById("qrStoreName");

const downloadQr =
  document.getElementById("downloadQr");


/* =====================================================
   INIT
===================================================== */

document.addEventListener("DOMContentLoaded", () => {

  loadStore();
  loadProducts();

  setupProductType();
  setupShipping();
  setupDigitalDelivery();
  setupImagePreview();

});


/* =====================================================
   NAMA TOKO
===================================================== */

function loadStore() {

  const saved =
    localStorage.getItem(STORE_KEY);

  if (saved) {

    storeNameInput.value = saved;

    storeNameInput.disabled = true;

    saveStoreButton.style.display = "none";

    editStoreButton.style.display = "block";

  }

}


saveStoreButton.addEventListener("click", () => {

  const name =
    storeNameInput.value.trim();

  if (!name) {

    alert("Masukkan nama toko terlebih dahulu.");

    return;

  }

  localStorage.setItem(
    STORE_KEY,
    name
  );

  storeNameInput.disabled = true;

  saveStoreButton.style.display = "none";

  editStoreButton.style.display = "block";

  alert("Nama toko berhasil disimpan.");

});


editStoreButton.addEventListener("click", () => {

  storeNameInput.disabled = false;

  storeNameInput.focus();

  saveStoreButton.style.display = "block";

  editStoreButton.style.display = "none";

});


/* =====================================================
   JENIS PRODUK
===================================================== */

function setupProductType() {

  const radios =
    document.querySelectorAll(
      'input[name="productType"]'
    );

  radios.forEach(radio => {

    radio.addEventListener("change", updateProductType);

  });

  updateProductType();

}


function updateProductType() {

  const type =
    document.querySelector(
      'input[name="productType"]:checked'
    )?.value;

  if (type === "digital") {

    physicalOptions.style.display = "none";

    digitalOptions.style.display = "block";

    document.getElementById("stock").required = false;

  } else {

    physicalOptions.style.display = "block";

    digitalOptions.style.display = "none";

    document.getElementById("stock").required = true;

  }

}


/* =====================================================
   PENGIRIMAN FISIK
===================================================== */

function setupShipping() {

  const radios =
    document.querySelectorAll(
      'input[name="shippingMode"]'
    );

  radios.forEach(radio => {

    radio.addEventListener(
      "change",
      updateShipping
    );

  });

  updateShipping();

}


function updateShipping() {

  const mode =
    document.querySelector(
      'input[name="shippingMode"]:checked'
    )?.value;

  if (mode === "direct") {

    directDeliveryOptions.style.display = "block";

  } else {

    directDeliveryOptions.style.display = "none";

  }

}


/* =====================================================
   DIGITAL DELIVERY
===================================================== */

function setupDigitalDelivery() {

  const radios =
    document.querySelectorAll(
      'input[name="digitalDelivery"]'
    );

  radios.forEach(radio => {

    radio.addEventListener(
      "change",
      updateDigitalDelivery
    );

  });

  updateDigitalDelivery();

}


function updateDigitalDelivery() {

  const delivery =
    document.querySelector(
      'input[name="digitalDelivery"]:checked'
    )?.value;

  digitalLinkGroup.style.display =
    delivery === "link" || delivery === "both"
      ? "block"
      : "none";

  digitalWhatsappGroup.style.display =
    delivery === "whatsapp" || delivery === "both"
      ? "block"
      : "none";

}


/* =====================================================
   GAMBAR PREVIEW
===================================================== */

function setupImagePreview() {

  productImage.addEventListener(
    "input",
    previewImage
  );

}


function previewImage() {

  const url =
    productImage.value.trim();

  if (!url) {

    imagePreviewBox.style.display = "none";

    return;

  }

  imagePreviewBox.style.display = "block";

  imagePreviewStatus.textContent =
    "Memeriksa gambar...";

  imagePreview.src = url;

}


imagePreview.addEventListener(
  "load",
  () => {

    imagePreviewStatus.textContent =
      "✓ Gambar berhasil ditampilkan";

  }
);


imagePreview.addEventListener(
  "error",
  () => {

    imagePreviewStatus.textContent =
      "⚠️ Gambar tidak dapat ditampilkan. Periksa kembali link gambar.";

  }
);


/* =====================================================
   SIMPAN PRODUK
===================================================== */

productForm.addEventListener(
  "submit",
  function(event) {

    event.preventDefault();

    const storeName =
      storeNameInput.value.trim();

    if (!storeName) {

      alert("Simpan nama toko terlebih dahulu.");

      storeNameInput.focus();

      return;

    }


    const name =
      document.getElementById("productName")
        .value.trim();

    const code =
      document.getElementById("productCode")
        .value.trim();

    const price =
      Number(
        document.getElementById("productPrice")
          .value
      );

    const type =
      document.querySelector(
        'input[name="productType"]:checked'
      ).value;


    if (!name) {

      alert("Nama produk wajib diisi.");

      return;

    }


    if (!price || price < 1) {

      alert("Harga produk tidak valid.");

      return;

    }


    const id =
      editingProductId ||
      createProductId();


    const product = {

      id,

      storeName,

      name,

      code: code || generateCode(name),

      price,

      type,

      image:
        productImage.value.trim() || "",

      createdAt:
        editingProductId
          ? getExistingCreatedAt(id)
          : Date.now()

    };


    if (type === "physical") {

      product.stock =
        Math.max(
          0,
          Number(
            document.getElementById("stock").value
          ) || 0
        );

      product.weight =
        Math.max(
          0,
          Number(
            document.getElementById("weight").value
          ) || 0
        );

      product.shippingMode =
        document.querySelector(
          'input[name="shippingMode"]:checked'
        ).value;

      product.directMethod =
        document.getElementById(
          "directMethod"
        ).value;

    }


    if (type === "digital") {

      product.category =
        document.getElementById(
          "digitalCategory"
        ).value;

      product.digitalDelivery =
        document.querySelector(
          'input[name="digitalDelivery"]:checked'
        ).value;

      product.digitalLink =
        document.getElementById(
          "digitalLink"
        ).value.trim();

      product.digitalWhatsapp =
        document.getElementById(
          "digitalWhatsapp"
        ).value.trim();

    }


    if (editingProductId) {

      products =
        products.map(item =>
          item.id === id
            ? product
            : item
        );

      editingProductId = null;

    } else {

      products.unshift(product);

    }


    saveProducts();

    productForm.reset();

    document.querySelector(
      'input[name="productType"][value="physical"]'
    ).checked = true;

    document.querySelector(
      'input[name="shippingMode"][value="courier"]'
    ).checked = true;

    document.querySelector(
      'input[name="digitalDelivery"][value="whatsapp"]'
    ).checked = true;

    document.getElementById("stock").value = 1;

    updateProductType();
    updateShipping();
    updateDigitalDelivery();

    imagePreviewBox.style.display = "none";

    renderProducts();

    alert(
      editingProductId
        ? "Produk berhasil diperbarui."
        : "Produk berhasil ditambahkan."
    );

  }
);


/* =====================================================
   STORAGE
===================================================== */

function loadProducts() {

  try {

    const data =
      localStorage.getItem(PRODUCTS_KEY);

    products =
      data
        ? JSON.parse(data)
        : [];

  } catch (error) {

    products = [];

  }

  renderProducts();

}


function saveProducts() {

  localStorage.setItem(
    PRODUCTS_KEY,
    JSON.stringify(products)
  );

}


/* =====================================================
   RENDER PRODUK
===================================================== */

function renderProducts() {

  productsContainer.innerHTML = "";

  if (!products.length) {

    emptyProducts.style.display = "block";

    return;

  }

  emptyProducts.style.display = "none";


  products.forEach(product => {

    const card =
      document.createElement("article");

    card.className = "seller-product-card";


    const imageHtml =
      product.image
        ? `
          <img
            src="${escapeHTML(product.image)}"
            class="product-thumb"
            alt="${escapeHTML(product.name)}"
            onerror="this.style.display='none';"
          >
        `
        : `
          <div class="product-thumb-placeholder">
            📦
          </div>
        `;


    let details = "";


    if (product.type === "physical") {

      details = `
        <div class="product-detail">
          Stok:
          <strong>${product.stock}</strong>
        </div>

        <div class="product-detail">
          Berat:
          <strong>${product.weight || 0} gram</strong>
        </div>

        <div class="product-detail">
          Pengiriman:
          <strong>
            ${
              product.shippingMode === "courier"
                ? "Kurir"
                : "Tanpa Kurir"
            }
          </strong>
        </div>
      `;

    } else {

      details = `
        <div class="product-detail">
          💻 Produk Digital
        </div>

        <div class="product-detail">
          Pengiriman:
          <strong>
            ${digitalDeliveryText(
              product.digitalDelivery
            )}
          </strong>
        </div>
      `;

    }


    card.innerHTML = `

      <div class="seller-product-image">
        ${imageHtml}
      </div>

      <div class="seller-product-content">

        <div class="product-type-badge">
          ${
            product.type === "physical"
              ? "📦 FISIK"
              : "💻 DIGITAL"
          }
        </div>

        <h3>
          ${escapeHTML(product.name)}
        </h3>

        <p class="product-code">
          ${escapeHTML(product.code || "")}
        </p>

        <div class="product-price">
          ${rupiah(product.price)}
        </div>

        ${details}

        <div class="stock-controls">

          ${
            product.type === "physical"
              ? `
                <button
                  type="button"
                  onclick="changeStock('${product.id}', -1)"
                >
                  −
                </button>

                <strong>
                  ${product.stock}
                </strong>

                <button
                  type="button"
                  onclick="changeStock('${product.id}', 1)"
                >
                  +
                </button>
              `
              : ""
          }

        </div>

        <div class="seller-product-actions">

          <button
            type="button"
            class="btn btn-primary"
            onclick="createProductQr('${product.id}')"
          >
            ✦ BUAT QR PRODUK
          </button>

          <button
            type="button"
            class="btn btn-secondary"
            onclick="editProduct('${product.id}')"
          >
            ✏️ EDIT
          </button>

        </div>

      </div>

    `;

    productsContainer.appendChild(card);

  });

}


/* =====================================================
   STOK
===================================================== */

window.changeStock =
  function(id, amount) {

    const product =
      products.find(
        item => item.id === id
      );

    if (!product) return;

    if (product.type !== "physical") return;

    product.stock =
      Math.max(
        0,
        Number(product.stock || 0) + amount
      );

    saveProducts();

    renderProducts();

  };


/* =====================================================
   EDIT PRODUK
===================================================== */

window.editProduct =
  function(id) {

    const product =
      products.find(
        item => item.id === id
      );

    if (!product) return;


    editingProductId = id;


    document.getElementById(
      "productName"
    ).value = product.name || "";


    document.getElementById(
      "productCode"
    ).value = product.code || "";


    document.getElementById(
      "productPrice"
    ).value = product.price || "";


    document.getElementById(
      "productImage"
    ).value = product.image || "";


    if (product.type === "digital") {

      document.querySelector(
        'input[name="productType"][value="digital"]'
      ).checked = true;

      document.getElementById(
        "digitalCategory"
      ).value =
        product.category || "ebook";

      document.querySelector(
        `input[name="digitalDelivery"][value="${product.digitalDelivery || "whatsapp"}"]`
      ).checked = true;

      document.getElementById(
        "digitalLink"
      ).value =
        product.digitalLink || "";

      document.getElementById(
        "digitalWhatsapp"
      ).value =
        product.digitalWhatsapp || "";

    } else {

      document.querySelector(
        'input[name="productType"][value="physical"]'
      ).checked = true;

      document.getElementById(
        "stock"
      ).value =
        product.stock || 0;

      document.getElementById(
        "weight"
      ).value =
        product.weight || 0;

      document.querySelector(
        `input[name="shippingMode"][value="${product.shippingMode || "courier"}"]`
      ).checked = true;

      document.getElementById(
        "directMethod"
      ).value =
        product.directMethod || "pickup_store";

    }


    updateProductType();
    updateShipping();
    updateDigitalDelivery();


    document.querySelector(
      "#productForm"
    ).scrollIntoView({
      behavior: "smooth",
      block: "start"
    });


    if (product.image) {

      imagePreviewBox.style.display = "block";

      imagePreview.src =
        product.image;

    }

  };


/* =====================================================
   QR PRODUK
===================================================== */

window.createProductQr =
  function(id) {

    const product =
      products.find(
        item => item.id === id
      );

    if (!product) {

      alert("Produk tidak ditemukan.");

      return;

    }


    const url =
      createProductUrl(product);


    productQr.innerHTML = "";


    qrTitle.textContent =
      product.name;


    qrSubtitle.textContent =
      `${product.storeName} • ${product.code}`;


    qrStoreName.textContent =
      product.storeName;


    new QRCode(
      productQr,
      {
        text: url,
        width: 240,
        height: 240,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel:
          QRCode.CorrectLevel.M
      }
    );


    currentQrUrl = url;


    qrModal.style.display =
      "flex";

  };


/* =====================================================
   QR KATALOG
===================================================== */

createCatalogQr.addEventListener(
  "click",
  function() {

    if (!products.length) {

      alert(
        "Tambahkan minimal satu produk terlebih dahulu."
      );

      return;

    }


    const storeName =
      getStoreName();


    if (!storeName) {

      alert(
        "Masukkan nama toko terlebih dahulu."
      );

      return;

    }


    const url =
      createCatalogUrl();


    catalogQr.innerHTML = "";


    new QRCode(
      catalogQr,
      {
        text: url,
        width: 240,
        height: 240,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel:
          QRCode.CorrectLevel.M
      }
    );


    catalogQrInfo.style.display =
      "flex";


    catalogQrStoreName.textContent =
      storeName;


    downloadCatalogQr.style.display =
      "block";

    currentQrUrl = url;

  }
);


/* =====================================================
   URL QR PRODUK
===================================================== */

function createProductUrl(product) {

  const data = {

    type: "product",

    store: product.storeName,

    product: {

      id: product.id,

      name: product.name,

      code: product.code,

      price: product.price,

      type: product.type,

      image: product.image || ""

    }

  };


  if (product.type === "physical") {

    data.product.stock =
      product.stock;

    data.product.weight =
      product.weight || 0;

    data.product.shippingMode =
      product.shippingMode || "courier";

    data.product.directMethod =
      product.directMethod || "";

  }


  if (product.type === "digital") {

    data.product.category =
      product.category;

    data.product.digitalDelivery =
      product.digitalDelivery;

    data.product.digitalLink =
      product.digitalLink || "";

    data.product.digitalWhatsapp =
      product.digitalWhatsapp || "";

  }


  return createPageUrl(
    "checkout.html",
    data
  );

}


/* =====================================================
   URL QR KATALOG
===================================================== */

function createCatalogUrl() {

  const catalogProducts =
    products.map(product => {

      const item = {

        id: product.id,

        name: product.name,

        code: product.code,

        price: product.price,

        type: product.type,

        image: product.image || ""

      };


      if (product.type === "physical") {

        item.stock =
          product.stock;

        item.weight =
          product.weight || 0;

        item.shippingMode =
          product.shippingMode || "courier";

        item.directMethod =
          product.directMethod || "";

      }


      if (product.type === "digital") {

        item.category =
          product.category;

        item.digitalDelivery =
          product.digitalDelivery;

        item.digitalLink =
          product.digitalLink || "";

        item.digitalWhatsapp =
          product.digitalWhatsapp || "";

      }


      return item;

    });


  const data = {

    type: "catalog",

    store: getStoreName(),

    products: catalogProducts

  };


  return createPageUrl(
    "checkout.html",
    data
  );

}


/* =====================================================
   MEMBUAT URL
===================================================== */

function createPageUrl(page, data) {

  const encoded =
    base64UrlEncode(
      JSON.stringify(data)
    );


  return new URL(
    `${page}?data=${encoded}`,
    window.location.href
  ).href;

}


/* =====================================================
   BASE64 URL SAFE
===================================================== */

function base64UrlEncode(value) {

  const bytes =
    new TextEncoder().encode(value);

  let binary = "";

  bytes.forEach(
    byte => {
      binary += String.fromCharCode(byte);
    }
  );


  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

}


/* =====================================================
   DOWNLOAD QR
===================================================== */

downloadQr.addEventListener(
  "click",
  function() {

    downloadQrImage(
      productQr,
      "scanbeli-qr-produk.png"
    );

  }
);


downloadCatalogQr.addEventListener(
  "click",
  function() {

    downloadQrImage(
      catalogQr,
      "scanbeli-qr-katalog.png"
    );

  }
);


function downloadQrImage(
  container,
  filename
) {

  const canvas =
    container.querySelector("canvas");

  const image =
    container.querySelector("img");


  if (canvas) {

    const link =
      document.createElement("a");

    link.download =
      filename;

    link.href =
      canvas.toDataURL("image/png");

    link.click();

    return;

  }


  if (image) {

    const link =
      document.createElement("a");

    link.download =
      filename;

    link.href =
      image.src;

    link.target =
      "_blank";

    link.click();

  }

}


/* =====================================================
   MODAL PANDUAN
===================================================== */

imageGuideButton.addEventListener(
  "click",
  () => {

    imageGuideModal.style.display =
      "flex";

  }
);


closeImageGuide.addEventListener(
  "click",
  closeGuide
);


closeImageGuide2.addEventListener(
  "click",
  closeGuide
);


function closeGuide() {

  imageGuideModal.style.display =
    "none";

}


/* =====================================================
   MODAL QR
===================================================== */

closeQrModal.addEventListener(
  "click",
  () => {

    qrModal.style.display =
      "none";

  }
);


qrModal.addEventListener(
  "click",
  event => {

    if (
      event.target === qrModal
    ) {

      qrModal.style.display =
        "none";

    }

  }
);


/* =====================================================
   HELPERS
===================================================== */

function getStoreName() {

  return (
    localStorage.getItem(
      STORE_KEY
    ) ||
    storeNameInput.value.trim()
  );

}


function createProductId() {

  return (
    "SBP-" +
    Date.now().toString(36) +
    "-" +
    Math.random()
      .toString(36)
      .substring(2, 7)
      .toUpperCase()
  );

}


function generateCode(name) {

  return name
    .replace(/[^a-zA-Z0-9]/g, "")
    .substring(0, 8)
    .toUpperCase() +
    Math.floor(
      Math.random() * 1000
    );

}


function getExistingCreatedAt(id) {

  const old =
    products.find(
      item => item.id === id
    );

  return old?.createdAt || Date.now();

}


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


function digitalDeliveryText(value) {

  if (value === "whatsapp") {
    return "WhatsApp";
  }

  if (value === "link") {
    return "Link Download";
  }

  if (value === "both") {
    return "WhatsApp + Link";
  }

  return "-";

}


function escapeHTML(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}
