export default function AdminDashboard() {
  return (
    <>
      <h1 className="fw-bold mb-3">Dashboard</h1>

      <div className="row g-3">
        {[
          { title: "Orders", value: "—", icon: "bi-receipt" },
          { title: "Products", value: "—", icon: "bi-box-seam" },
          { title: "Users", value: "—", icon: "bi-people" },
          { title: "Revenue", value: "—", icon: "bi-cash-coin" },
        ].map((c) => (
          <div className="col-12 col-md-6 col-xl-3" key={c.title}>
            <div className="bg-white rounded-4 shadow-sm p-3">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <div className="text-secondary small">{c.title}</div>
                  <div className="fw-bold fs-4">{c.value}</div>
                </div>
                <div className="fs-3 text-secondary">
                  <i className={`bi ${c.icon}`} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-4 shadow-sm p-4 mt-4">
        <div className="fw-semibold mb-2">Activité récente</div>
        <div className="text-secondary">On branchera ça à l’API Laravel après.</div>
      </div>
    </>
  );
}
