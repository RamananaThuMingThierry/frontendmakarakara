import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/website/AuthContext";

export default function Login() {
  const { isAuth, login, loading } = useAuth();
  const nav = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // si déjà connecté → account
  if (isAuth) {
    nav("/account", { replace: true });
  }

  const submit = async (e) => {
    e.preventDefault();
    const res = await login({ email, password });
    if (!res.ok) return alert(res.message || "Connexion échouée");

    const redirectTo = location.state?.from || "/account";
    nav(redirectTo, { replace: true });
  };

  return (
    <main className="py-5" style={{ background: "#fbf7ec" }}>
      <div className="container" style={{ maxWidth: 520 }}>
        <div className="bg-white rounded-4 shadow-sm p-4">
          <h1 className="fw-bold mb-1">Connexion</h1>
          <p className="text-secondary mb-4">Accédez à votre compte.</p>

          <form onSubmit={submit} className="d-flex flex-column gap-3">
            <div>
              <label className="form-label">Email</label>
              <input
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@gmail.com"
              />
            </div>

            <div>
              <label className="form-label">Mot de passe</label>
              <input
                type="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <button className="btn btn-dark fw-semibold" disabled={loading} type="submit">
              {loading ? "Connexion..." : "Se connecter"}
            </button>

            <div className="text-secondary small">
              Pas de compte ? <Link to="/register">Créer un compte</Link>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
