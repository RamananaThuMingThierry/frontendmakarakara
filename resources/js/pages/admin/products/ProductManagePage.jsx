import { useParams, useNavigate } from "react-router-dom";
import React, { useEffect, useState } from "react";
import ProductHeader from "./components/ProductHeader";
import ProductInfo from "./components/ProductInfo";
import CityAvailability from "./components/CityAvailability";
import InventoryTable from "./components/InventoryTable";
import StockMovements from "./components/StockMovements";
import { productsApi } from "../../../api/products";

export default function ProductManagePage() {
  const { encryptedId } = useParams();
  console.log("Product encryptedId", encryptedId);
  const [product, setProduct] = useState(null);

  useEffect(() => {
    loadProduct();
  }, [encryptedId]);

  async function loadProduct() {
    const res = await productsApi.show(encryptedId);
    setProduct(res?.data ?? res);
  }

  if (!product) return null;

  return (
    <div className="container-fluid">

      {/* HEADER */}
      <ProductHeader product={product} />

      {/* INFO + IMAGES */}
      <ProductInfo product={product} />

      {/* CITY AVAILABILITY */}
      <CityAvailability product={product} reload={loadProduct} />

      {/* INVENTORY */}
      <InventoryTable product={product} reload={loadProduct} />

      {/* STOCK MOVEMENTS */}
      <StockMovements product={product} />

    </div>
  );
}