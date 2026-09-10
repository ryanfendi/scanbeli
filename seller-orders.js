import {
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  db,
  initAnonymousAuth
} from "./firebase.js";


// =========================================
// ELEMENT
// =========================================

const loading =
  document.getElementById("loading");

const errorBox =
  document.getElementById("error");

const empty =
  document.getElementById("empty");

const container =
  document.getElementById(
    "ordersContainer"
  );


// =========================================
// RUPIAH
// =========================================

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


// =========================================
// ESCAPE
// =========================================

function escapeHTML(value) {

  return String(value ?? "")

    .replaceAll("&", "&amp;")

    .replaceAll("<", "&lt;")

    .replaceAll(">", "&gt;")

    .replaceAll(
      '"',
      "&quot;"
    )

    .replaceAll(
      "'",
      "&#039;"
    );

}


// =========================================
// STATUS
// =========================================

function statusText(status) {

  const map = {

    MENUNGGU_PEMBAYARAN:
      "Menunggu Pembayaran",

    DIBAYAR:
      "Sudah Dibayar",

    DIPROSES:
      "Sedang Diproses",

    DIKIRIM:
      "Dikirim",

    SELESAI:
      "Selesai",

    DIBATALKAN:
      "Dibatalkan"

  };


  return (
    map[status] ||
    status ||
    "Tidak diketahui"
  );

}


// =========================================
// LOAD
// =========================================

async function loadOrders() {

  try {

    loading.style.display =
      "block";

    errorBox.innerHTML =
      "";

    empty.style.display =
      "none";


    // Anonymous seller
    const user =
      await initAnonymousAuth();


    console.log(
      "Seller UID:",
      user.uid
    );


    // Query tanpa orderBy
    // sehingga tidak membutuhkan
    // composite index.

    const q =
      query(

        collection(
          db,
          "orders"
        ),

        where(
          "sellerUid",
          "==",
          user.uid
        )

      );


    const snapshot =
      await getDocs(q);


    loading.style.display =
      "none";


    if (snapshot.empty) {

      empty.style.display =
        "block";

      return;

    }


    const orders = [];


    snapshot.forEach(
      documentSnapshot => {

        orders.push({

          id:
            documentSnapshot.id,

          ...documentSnapshot.data()

        });

      }
    );


    // Terbaru → teratas
    orders.sort(
      (a, b) => {

        const aTime =
          a.createdAt?.seconds ||
          0;

        const bTime =
          b.createdAt?.seconds ||
          0;

        return bTime - aTime;

      }
    );


    renderOrders(
      orders
    );


  } catch (err) {

    console.error(
      "Seller orders error:",
      err
    );


    loading.style.display =
      "none";


    errorBox.innerHTML = `

      <div class="error-box">

        <strong>
          Gagal memuat pesanan
        </strong>

        <p>
          ${escapeHTML(
            err.message
          )}
        </p>

      </div>

    `;

  }

}


// =========================================
// RENDER
// =========================================

function renderOrders(
  orders
) {

  container.innerHTML =
    "";


  orders.forEach(
    order => {

      const product =
        order.product || {};


      const card =
        document.createElement(
          "div"
        );


      card.className =
        "order-card";


      card.innerHTML = `

        <div class="order-header">

          <div>

            <h3>
              ${escapeHTML(
                product.name ||
                "Produk"
              )}
            </h3>

            ${
              product.code
                ? `
                  <small>
                    Kode:
                    ${escapeHTML(
                      product.code
                    )}
                  </small>
                `
                : ""
            }

          </div>


          <span class="status-badge">

            ${escapeHTML(
              statusText(
                order.status
              )
            )}

          </span>

        </div>



        <div class="order-info">

          <p>

            <strong>
              Order
            </strong>

            <br>

            ${escapeHTML(
              order.orderId
            )}

          </p>


          <p>

            <strong>
              Pembeli
            </strong>

            <br>

            ${escapeHTML(
              order.buyerName
            )}

          </p>


          <p>

            <strong>
              Nomor HP
            </strong>

            <br>

            ${escapeHTML(
              order.buyerPhone
            )}

          </p>


          <p>

            <strong>
              Alamat Pengiriman
            </strong>

            <br>

            ${escapeHTML(
              order.buyerAddress
            )}

          </p>


          <p>

            <strong>
              Harga Produk
            </strong>

            <br>

            ${rupiah(
              order.price
            )}

          </p>


          <p>

            <strong>
              Fee SCANBELI
            </strong>

            <br>

            ${rupiah(
              order.fee
            )}

          </p>


          <p class="order-total">

            <strong>
              Total
            </strong>

            <br>

            ${rupiah(
              order.total
            )}

          </p>

        </div>

      `;


      container.appendChild(
        card
      );

    }
  );

}


// =========================================
// START
// =========================================

loadOrders();
