import { useState } from "react";

export default function ContactSection() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const onChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const onSubmit = (e) => {
    e.preventDefault();

    // TODO: brancher API Laravel
    // POST /api/contact  (name,email,phone,subject,message)
    console.log("Contact form:", form);

    alert("Message envoyé ✅");
    setForm({ name: "", email: "", phone: "", subject: "", message: "" });
  };

  return (
    <section className="py-5" style={{ background: "#fbf7ec" }}>
      <div className="container">
        <div className="text-center mb-4">
          <h2 className="fw-bold" style={{ fontFamily: "cursive" }}>
            Nous contactez
          </h2>
          <p className="text-secondary mb-0">
            Une question sur un produit, une commande, ou une collaboration ? Écrivez-nous.
          </p>
        </div>

        <div className="row g-4 align-items-stretch">
          {/* Left info */}
          <div className="col-12 col-lg-5">
            <div className="p-4 rounded-4 bg-white shadow-sm h-100">
              <h4 className="fw-bold mb-2">Contactez-nous</h4>
              <p className="text-secondary">
                Nous répondons généralement sous <strong>24h</strong>. Pour une commande, indiquez
                votre numéro de commande si possible.
              </p>

              <div className="d-flex gap-3 align-items-start mb-3">
                <div
                  className="d-inline-flex align-items-center justify-content-center rounded-3"
                  style={{ width: 44, height: 44, background: "#111" }}
                >
                  <i className="bi bi-envelope text-warning fs-5"></i>
                </div>
                <div>
                  <div className="fw-semibold">Email</div>
                  <a className="text-decoration-none text-dark" href="mailto:tiafinjaran@gmail.com">
                    tiafinjaran@gmail.com
                  </a>
                  <div className="small text-secondary">Support & commandes</div>
                </div>
              </div>

              <div className="d-flex gap-3 align-items-start mb-3">
                <div
                  className="d-inline-flex align-items-center justify-content-center rounded-3"
                  style={{ width: 44, height: 44, background: "#111" }}
                >
                  <i className="bi bi-telephone text-warning fs-5"></i>
                </div>
                <div>
                  <div className="fw-semibold">Téléphone / WhatsApp</div>
                  <a className="text-decoration-none text-dark" href="tel:+261327563770">
                    +261 32 97 905 36
                  </a>
                  <div className="small text-secondary">Lun–Sam • 08:00–18:00</div>
                </div>
              </div>

              <div className="d-flex gap-3 align-items-start mb-4">
                <div
                  className="d-inline-flex align-items-center justify-content-center rounded-3"
                  style={{ width: 44, height: 44, background: "#111" }}
                >
                  <i className="bi bi-geo-alt text-warning fs-5"></i>
                </div>
                <div>
                  <div className="fw-semibold">Localisation</div>
                  <div className="text-dark">VT 29 RAI Bis Ampahateza</div>
                  <div className="small text-secondary">Antananarivo, Madagascar</div>
                </div>
              </div>

              {/* Extra trust info */}
              <div className="d-flex flex-wrap gap-2">
                <span className="badge text-bg-light border">Réponse sous 24h</span>
                <span className="badge text-bg-light border">Paiement sécurisé</span>
                <span className="badge text-bg-light border">Retour 30 jours</span>
              </div>
            </div>
          </div>

          {/* Right form */}
          <div className="col-12 col-lg-7">
            <div className="p-4 p-lg-5 rounded-4 shadow-sm h-100" style={{ background: "#1f1916" }}>
              <form onSubmit={onSubmit}>
                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <label className="form-label text-white">Nom complet</label>
                    <input
                      className="form-control"
                      name="name"
                      value={form.name}
                      onChange={onChange}
                      placeholder="Votre nom"
                      required
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label text-white">Email</label>
                    <input
                      className="form-control"
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={onChange}
                      placeholder="Votre email"
                      required
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label text-white">Téléphone (optionnel)</label>
                    <input
                      className="form-control"
                      name="phone"
                      value={form.phone}
                      onChange={onChange}
                      placeholder="+261 ..."
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label text-white">Sujet</label>
                    <select
                      className="form-select"
                      name="subject"
                      value={form.subject}
                      onChange={onChange}
                      required
                    >
                      <option value="">Choisir…</option>
                      <option value="commande">Question sur une commande</option>
                      <option value="produit">Question sur un produit</option>
                      <option value="retour">Retour / échange</option>
                      <option value="collab">Collaboration</option>
                      <option value="autre">Autre</option>
                    </select>
                  </div>

                  <div className="col-12">
                    <label className="form-label text-white">Message</label>
                    <textarea
                      className="form-control"
                      rows="5"
                      name="message"
                      value={form.message}
                      onChange={onChange}
                      placeholder="Écrivez votre message…"
                      required
                    />
                  </div>

                  <div className="col-12">
                    <button
                      className="btn w-100 fw-semibold"
                      style={{ background: "#f3c100", color: "#111" }}
                      type="submit"
                    >
                      Envoyer
                    </button>
                    <div className="small text-white-50 mt-2">
                      En envoyant, vous acceptez d’être contacté(e) concernant votre demande.
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
