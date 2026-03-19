import { useEffect, useMemo, useRef } from "react";
import { useI18n } from "../../../../hooks/website/I18nContext";
import $ from "jquery";
import "datatables.net";
import "datatables.net-bs5";

function formatDate(value) {
  if (!value) return "-";

  try {
    return new Date(value).toLocaleString("fr-FR");
  } catch {
    return value;
  }
}

function formatType(type) {
  const labels = {
    in: "Entree",
    out: "Sortie",
    adjust: "Ajustement",
    transfer: "Transfert",
    return: "Retour",
  };

  return labels[type] || type || "-";
}

export default function StockMouvements({ product }) {
  const { lang } = useI18n();
  const DT_LANG_URL = useMemo(() => `/lang/datatables/${lang}.json`, [lang]);

  const tableRef = useRef(null);
  const dtRef = useRef(null);
  const initializedRef = useRef(false);

  const movements = useMemo(() => {
    const list = Array.isArray(product?.stock_mouvements) ? product.stock_mouvements : [];
    return [...list].sort(
      (a, b) => new Date(b?.created_at || 0) - new Date(a?.created_at || 0)
    );
  }, [product?.stock_mouvements]);

  useEffect(() => {
    const tableNode = tableRef.current;
    if (!tableNode) return;

    const $table = $(tableNode);

    try {
      if ($.fn.dataTable.isDataTable(tableNode)) {
        dtRef.current = $table.DataTable();
      } else {
        dtRef.current = $table.DataTable({
          data: [],
          destroy: true,
          retrieve: true,
          pageLength: 10,
          lengthMenu: [10, 15, 25, 50, 100],
          ordering: true,
          searching: true,
          responsive: true,
          language: { url: DT_LANG_URL },
          columns: [
            {
              data: null,
              title: "#",
              render: (d, t, row, meta) => meta.row + 1,
            },
            {
              data: "created_at",
              title: "Date",
              render: (value) => formatDate(value),
            },
            {
              data: "type",
              title: "Type",
              render: (value) => formatType(value),
            },
            { data: "city_from.name", title: "Ville source", defaultContent: "-" },
            { data: "city_to.name", title: "Ville destination", defaultContent: "-" },
            { data: "quantity", title: "Quantite", defaultContent: 0 },
            { data: "stock_before", title: "Avant", defaultContent: "-" },
            { data: "stock_after", title: "Apres", defaultContent: "-" },
            { data: "user.name", title: "Utilisateur", defaultContent: "-" },
            { data: "reason", title: "Motif", defaultContent: "-" },
          ],
        });
      }

      initializedRef.current = true;
    } catch (error) {
      console.error("Erreur initialisation DataTable mouvements:", error);
    }

    return () => {
      try {
        if (dtRef.current && $.fn.dataTable.isDataTable(tableNode)) {
          dtRef.current.destroy();
        }
      } catch {}

      dtRef.current = null;
      initializedRef.current = false;

      if (tableNode.tBodies?.[0]) {
        tableNode.tBodies[0].innerHTML = "";
      }
    };
  }, [DT_LANG_URL]);

  useEffect(() => {
    if (!dtRef.current || !initializedRef.current) return;

    try {
      const dt = dtRef.current;
      const page = dt.page();
      const search = dt.search();
      const order = dt.order();

      dt.clear();
      dt.rows.add(movements);
      dt.draw(false);
      dt.order(order).draw(false);
      dt.search(search).draw(false);
      dt.page(page).draw(false);
    } catch (error) {
      console.error("Erreur mise à jour DataTable mouvements:", error);
    }
  }, [movements]);

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-body">
        <div className="table-responsive">
          <table ref={tableRef} className="table align-middle mb-0">
            <thead>
              <tr className="text-muted small">
                <th>#</th>
                <th>Date</th>
                <th>Type</th>
                <th>Ville source</th>
                <th>Ville destination</th>
                <th>Quantite</th>
                <th>Avant</th>
                <th>Apres</th>
                <th>Utilisateur</th>
                <th>Motif</th>
              </tr>
            </thead>
            <tbody />
          </table>
        </div>
      </div>
    </div>
  );
}
