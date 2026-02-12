import { useState } from "react";

export default function Contact() {
  const [form, setForm] = useState({
    name: "",
    contact: "",
    subject: "",
    message: "",
  });

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = (e) => {
    e.preventDefault();

    if (!form.name.trim() || !form.contact.trim() || !form.message.trim()) {
      alert("Veuillez remplir les champs obligatoires.");
      return;
    }

    // ✅ Pour l’instant : simple mailto (sans backend)
    const subject = encodeURIComponent(form.subject || "Message depuis le site");
    const body = encodeURIComponent(
      `Nom: ${form.name}\nContact: ${form.contact}\n\nMessage:\n${form.message}`
    );

    window.location.href = `mailto:tiafinjaran@gmail.com?subject=${subject}&body=${body}`;
  };

  // WhatsApp (format international sans espaces)
  const whatsappNumber = "261329790536";
  const whatsappText = encodeURIComponent("Bonjour MAKARAKARA, j’ai une question.");

  return (
    <main className="py-5" style={{ background: "#fbf7ec" }}>
      <div className="container">
        <div className="text-center mb-4">
          <h1 className="fw-bold mb-2">Contact</h1>
          <p className="text-secondary mb-0">
            Une question ? Écrivez-nous, on répond rapidement.
          </p>
        </div>

        <div className="row g-4">
          {/* Infos */}
          <div className="col-12 col-lg-5">
            <div className="bg-white rounded-4 shadow-sm p-4 h-100">
              <h5 className="fw-bold mb-3">Nos coordonnées</h5>

              <div className="d-flex gap-3 mb-3">
                <div className="text-warning fs-5">
                  <i className="bi bi-envelope"></i>
                </div>
                <div>
                  <div className="fw-semibold">Email</div>
                  <div className="text-secondary">tiafinjaran@gmail.com</div>
                </div>
              </div>

              <div className="d-flex gap-3 mb-3">
                <div className="text-warning fs-5">
                  <i className="bi bi-telephone"></i>
                </div>
                <div>
                  <div className="fw-semibold">Téléphone</div>
                  <div className="text-secondary">+261 32 97 905 36</div>
                </div>
              </div>

              <div className="d-flex gap-3 mb-4">
                <div className="text-warning fs-5">
                  <i className="bi bi-geo-alt"></i>
                </div>
                <div>
                  <div className="fw-semibold">Adresse</div>
                  <div className="text-secondary">
                    VT 29 RAI Bis Ampahateza, Antananarivo, Madagascar
                  </div>
                </div>
              </div>

              <div className="d-flex flex-wrap gap-2">
                <a
                  className="btn btn-success"
                  target="_blank"
                  rel="noreferrer"
                  href={`https://wa.me/${whatsappNumber}?text=${whatsappText}`}
                >
                  <i className="bi bi-whatsapp me-2"></i>
                  WhatsApp
                </a>

                <a className="btn btn-outline-dark" href="mailto:tiafinjaran@gmail.com">
                  <i className="bi bi-envelope me-2"></i>
                  Envoyer un email
                </a>
              </div>

              <hr className="my-4" />

              <div className="text-secondary small">
                Horaires : Lundi–Samedi • 08:00–18:00
              </div>
            </div>
          </div>

          {/* Formulaire */}
          <div className="col-12 col-lg-7">
            <div className="bg-white rounded-4 shadow-sm p-4">
              <h5 className="fw-bold mb-3">Envoyer un message</h5>

              <form onSubmit={submit} className="row g-3">
                <div className="col-12 col-md-6">
                  <label className="form-label">Nom *</label>
                  <input
                    className="form-control"
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                    placeholder="Votre nom"
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label">Email ou téléphone *</label>
                  <input
                    className="form-control"
                    value={form.contact}
                    onChange={(e) => update("contact", e.target.value)}
                    placeholder="Ex: email@gmail.com / 034..."
                  />
                </div>

                <div className="col-12">
                  <label className="form-label">Sujet (optionnel)</label>
                  <input
                    className="form-control"
                    value={form.subject}
                    onChange={(e) => update("subject", e.target.value)}
                    placeholder="Ex: Livraison, produit, paiement..."
                  />
                </div>

                <div className="col-12">
                  <label className="form-label">Message *</label>
                  <textarea
                    className="form-control"
                    rows={5}
                    value={form.message}
                    onChange={(e) => update("message", e.target.value)}
                    placeholder="Écrivez votre message…"
                  />
                </div>

                <div className="col-12 d-flex flex-column flex-sm-row gap-2">
                  <button className="btn btn-warning fw-semibold" type="submit">
                    <i className="bi bi-send me-2"></i>
                    Envoyer
                  </button>

                  <button
                    className="btn btn-outline-dark"
                    type="button"
                    onClick={() => setForm({ name: "", contact: "", subject: "", message: "" })}
                  >
                    Réinitialiser
                  </button>
                </div>

                <small className="text-secondary">
                  * Champs obligatoires. Réponse sous 24h (souvent plus rapide).
                </small>
              </form>
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="mt-4">
          <div className="bg-white rounded-4 shadow-sm overflow-hidden">
            <iframe
              title="MAKARAKARA - Localisation"
              src="https://www.google.com/maps?q=VT%2029%20RAI%20Bis%20Ampahateza%20Antananarivo%20Madagascar&output=embed"
              width="100%"
              height="320"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>
      {/* FAQ / Poser une question */}
    <div className="mt-5">
        <div className="container">
                <div className="text-center mb-4">
        <h2 className="fw-bold mb-2">Poser une question</h2>
        <p className="text-secondary mb-0">
        Réponses rapides aux questions les plus fréquentes.
        </p>
    </div>

    <div className="accordion" id="faqAccordion">
        {[
        {
            q: "Quel est le délai de livraison ?",
            a: "La livraison prend généralement 24 à 72h selon la ville.",
        },
        {
            q: "Quels moyens de paiement acceptez-vous ?",
            a: "Paiement en espèce à la livraison ou mobile money.",
        },
        {
            q: "Puis-je modifier ma commande ?",
            a: "Oui, contactez-nous rapidement avant l’expédition.",
        },
        {
            q: "Les produits sont-ils garantis ?",
            a: "Oui, nous garantissons la qualité de nos produits.",
        },
        ].map((item, i) => (
        <div className="accordion-item" key={i}>
            <h2 className="accordion-header">
            <button
                className="accordion-button collapsed"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target={`#faq${i}`}
            >
                {item.q}
            </button>
            </h2>
            <div
            id={`faq${i}`}
            className="accordion-collapse collapse"
            data-bs-parent="#faqAccordion"
            >
            <div className="accordion-body text-secondary">
                {item.a}
            </div>
            </div>
        </div>
        ))}
    </div>

    {/* CTA */}
    <div className="text-center mt-4">
        <p className="text-secondary mb-2">
        Vous ne trouvez pas votre réponse ?
        </p>

        <a
        className="btn btn-dark"
        href="https://wa.me/261329790536"
        target="_blank"
        rel="noreferrer"
        >
        <i className="bi bi-whatsapp me-2"></i>
        Poser une question sur WhatsApp
        </a>
    </div>
        </div>
    </div>

    </main>
  );
}
