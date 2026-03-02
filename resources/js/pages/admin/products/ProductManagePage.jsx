import { useParams } from "react-router-dom";
import React, { useEffect, useState } from "react";
import ProductHeader from "./components/ProductHeader";
import ProductInfo from "./components/ProductInfo";
import CityAvailability from "./components/CityAvailability";
import InventoryTable from "./components/InventoryTable";
import StockMouvements from "./components/StockMovements";
import { productsApi } from "../../../api/products";

export default function ProductManagePage() {
  const { categoryId, productId } = useParams();
  const [product, setProduct] = useState(null);

  useEffect(() => {
    loadProduct();
  }, [categoryId, productId]);

  async function loadProduct() {
    const res = await productsApi.show(categoryId, productId);
    setProduct(res?.data ?? res);
  }

  if (!product) return null;

  return (
      <main className="container-fluid">
        <ProductHeader product={product} />

        <div className="row g-2">
          <ProductInfo product={product} />

          <div className="col-12">
            <div className="card shadow-sm mt-2">
              <div className="card-header bg-white">
                <ul className="nav nav-tabs card-header-tabs" id="productTabs" role="tablist">
                  <li className="nav-item" role="presentation">
                    <button
                      className="nav-link active"
                      id="info-tab"
                      data-bs-toggle="tab"
                      data-bs-target="#tab-info"
                      type="button"
                      role="tab"
                    >
                      <i className="bi bi-info-circle"></i> Informations
                    </button>
                  </li>
                  <li className="nav-item" role="presentation">
                    <button
                      className="nav-link"
                      id="inventory-tab"
                      data-bs-toggle="tab"
                      data-bs-target="#tab-inventory"
                      type="button"
                      role="tab"
                    >
                      <i className="bi bi-box-seam"></i> Inventaire
                    </button>
                  </li>
                  <li className="nav-item" role="presentation">
                    <button
                      className="nav-link"
                      id="movements-tab"
                      data-bs-toggle="tab"
                      data-bs-target="#tab-movements"
                      type="button"
                      role="tab"
                    >
                      <i className="bi bi-arrow-left-right"></i> Mouvements
                    </button>
                  </li>
                </ul>
              </div>
              <div className="card-body">
                <div className="tab-content" id="productTabsContent">
                  <div className="tab-pane fade show active" id="tab-info" role="tabpanel" aria-labelledby="info-tab">
                    <CityAvailability product={product} reload={loadProduct} />
                  </div>
                  <div className="tab-pane fade" id="tab-inventory" role="tabpanel" aria-labelledby="inventory-tab">
                    <InventoryTable product={product} reload={loadProduct} />
                  </div>
                  <div className="tab-pane fade" id="tab-movements" role="tabpanel" aria-labelledby="movements-tab">
                    <StockMouvements product={product} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
  );
}
