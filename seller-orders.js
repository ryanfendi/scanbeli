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

function rupiah(number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(Number(number) || 0);
}

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function loadOrders() {

  const loading =
    document.getElementById(
      "loading"
    );

  const error =
    document.getElementById(
      "error"
    );

  const empty =
    document.getElementById(
      "empty"
    );

  const container =
    document.getElementById(
      "ordersContainer"
    );

  try {

    loading.style.display =
      "block";

    const user =
      await initAnonymousAuth();

    if (!user) {
      throw new Error(
        "Authentication gagal."
      );
    }

    /*
      Hanya mengambil order
      milik seller yang sedang
      login secara anonim.

      Tidak memakai orderBy(),
      sehingga tidak membutuhkan
      composite index.
    */

    const q = query(
      collection(db, "orders"),
      where(
        "sellerUid",
        "==",
        user.uid
      )
    );

    const snapshot =
      await getDocs(q);

    const orders =
      snapshot.docs.map(
        function (doc) {
          return {
            id: doc.id,
            ...doc.data()
          };
        }
      );

    /*
      Urutkan di HP,
      bukan menggunakan orderBy Firestore.
    */

    orders.sort(
      function (a, b) {

        const aTime =
          a.createdAt?.seconds ||
          0;

        const bTime =
          b.createdAt?.seconds ||
          0;

        return bTime - aTime;
      }
    );

    loading.style.display =
      "none";

    if (!orders.length) {

      empty.style.display =
        "block";

      return;
    }

    container.innerHTML =
      orders.map(
        function (order) {

          return `
            <div class="order-card">

              <h3>
                ${escapeHTML(
                  order.product?.name ||
                  "Produk"
                )}
              </h3>

              <p>
                <strong>
                  Order:
                </strong>
                ${escapeHTML(
                  order.orderId
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
                  order.status
                )}
              </p>

              <hr>

              <h4>
                Data Pembeli
              </h4>

              <p>
                Nama:
                ${escapeHTML(
                  order.buyerName
                )}
              </p>

              <p>
                HP:
                ${escapeHTML(
                  order.buyerPhone
                )}
              </p>

              <p>
                Alamat:
                ${escapeHTML(
                  order.buyerAddress
                )}
              </p>

            </div>
          `;

        }
      ).join("");

  } catch (err) {

    console.error(err);

    loading.style.display =
      "none";

    error.innerHTML = `
      <div class="error">
        Gagal memuat pesanan:
        <br>
        ${escapeHTML(
          err.message
        )}
      </div>
    `;
  }
}

loadOrders();
