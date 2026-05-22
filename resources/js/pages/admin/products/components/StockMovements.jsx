import { useEffect, useMemo, useRef } from "react";
import { useI18n } from "../../../../hooks/website/I18nContext";
import $ from "jquery";
import "datatables.net";
import "datatables.net-bs5";

function formatDate(value, lang) {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleString(lang === "en" ? "en-US" : lang);
  } catch {
    return value;
  }
}

function formatType(type, t) {
  const labels = {
    in: t("products.movements.types.in", "Inbound"),
    out: t("products.movements.types.out", "Outbound"),
    adjust: t("products.movements.types.adjust", "Adjustment"),
    transfer: t("products.movements.types.transfer", "Transfer"),
    return: t("products.movements.types.return", "Return"),
  };
  return labels[type] || type || "-";
}

export default function StockMouvements({ product }) {
  const { lang, t } = useI18n();
  const DT_LANG_URL = useMemo(() => `/lang/datatables/${lang}.json`, [lang]);
  const tableRef = useRef(null);
  const dtRef = useRef(null);
  const initializedRef = useRef(false);

  const movements = useMemo(() => {
    const list = Array.isArray(product?.stock_mouvements) ? product.stock_mouvements : [];
    return [...list].sort((a, b) => new Date(b?.created_at || 0) - new Date(a?.created_at || 0));
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
            { data: null, title: "#", render: (d, tt, row, meta) => meta.row + 1 },
            { data: "created_at", title: t("products.movements.table.date", "Date"), render: (value) => formatDate(value, lang) },
            { data: "type", title: t("products.movements.table.type", "Type"), render: (value) => formatType(value, t) },
            { data: "city_from.name", title: t("products.movements.table.cityFrom", "Source city"), defaultContent: "-" },
            { data: "city_to.name", title: t("products.movements.table.cityTo", "Destination city"), defaultContent: "-" },
            { data: "quantity", title: t("products.movements.table.quantity", "Quantity"), defaultContent: 0 },
            { data: "stock_before", title: t("products.movements.table.before", "Before"), defaultContent: "-" },
            { data: "stock_after", title: t("products.movements.table.after", "After"), defaultContent: "-" },
            { data: "user.name", title: t("products.movements.table.user", "User"), defaultContent: "-" },
            { data: "reason", title: t("products.movements.table.reason", "Reason"), defaultContent: "-" },
          ],
        });
      }
      initializedRef.current = true;
    } catch (error) {
      console.error("DataTable movements init error:", error);
    }

    return () => {
      try {
        if (dtRef.current && $.fn.dataTable.isDataTable(tableNode)) dtRef.current.destroy();
      } catch {}
      dtRef.current = null;
      initializedRef.current = false;
      if (tableNode.tBodies?.[0]) tableNode.tBodies[0].innerHTML = "";
    };
  }, [DT_LANG_URL, lang, t]);

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
      console.error("DataTable movements update error:", error);
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
                <th>{t("products.movements.table.date", "Date")}</th>
                <th>{t("products.movements.table.type", "Type")}</th>
                <th>{t("products.movements.table.cityFrom", "Source city")}</th>
                <th>{t("products.movements.table.cityTo", "Destination city")}</th>
                <th>{t("products.movements.table.quantity", "Quantity")}</th>
                <th>{t("products.movements.table.before", "Before")}</th>
                <th>{t("products.movements.table.after", "After")}</th>
                <th>{t("products.movements.table.user", "User")}</th>
                <th>{t("products.movements.table.reason", "Reason")}</th>
              </tr>
            </thead>
            <tbody />
          </table>
        </div>
      </div>
    </div>
  );
}
