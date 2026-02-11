import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="bg-black text-white p-4">
      <div className="container mx-auto flex justify-between">
        <Link to="/" className="font-bold">Shop</Link>

        <div className="space-x-4">
          <Link to="/">Accueil</Link>
          <Link to="/products">Produits</Link>
          <Link to="/login">Connexion</Link>
        </div>
      </div>
    </nav>
  );
}
