import { useState } from "react";
import api from "../../api/axios";

const initialForm = {
  name: "",
  email: "",
  phone: "",
  subject: "",
  message: "",
};

export default function ContactSection() {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [sending, setSending] = useState(false);

  const onChange = (e) => {
    const { name, value } = e.target;

    setForm((current) => ({ ...current, [name]: value }));

    if (errors[name]) {
      setErrors((current) => ({ ...current, [name]: undefined }));
    }

    if (serverError) setServerError("");
    if (successMessage) setSuccessMessage("");
  };

  const resetForm = () => {
    setForm(initialForm);
    setErrors({});
    setServerError("");
    setSuccessMessage("");
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    setErrors({});
    setServerError("");
    setSuccessMessage("");

    try {
      const { data } = await api.post("/contact", {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        subject: form.subject.trim(),
        message: form.message.trim(),
      });

      setSuccessMessage(data?.message || "Message envoye avec succes.");
      setForm(initialForm);
    } catch (error) {
      const response = error?.response;
      const validationErrors = response?.data?.errors;

      if (validationErrors) {
        setErrors(validationErrors);
      }

      setServerError(
        response?.data?.message || "Erreur lors de l'envoi du message. Veuillez reessayer."
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="py-5" style={{ background: "#fbf7ec" }}>
      <div className="container">
        <div className="text-center mb-4">
          <h2 className="fw-bold" style={{ fontFamily: "cursive" }}>
            Nous contactez
          </h2>
          <p className="text-secondary mb-0">
            Une question sur un produit, une commande, ou une collaboration ? Ecrivez-nous.
          </p>
        </div>

        <div className="row g-4 align-items-stretch">
          <div className="col-12 col-lg-5">
            <div className="p-4 rounded-4 bg-white shadow-sm h-100">
              <h4 className="fw-bold mb-2">Contactez-nous</h4>
              <p className="text-secondary">
                Nous repondons generalement sous <strong>24h</strong>. Pour une commande, indiquez
                votre numero de commande si possible.
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
                  <div className="fw-semibold">Telephone / WhatsApp</div>
                  <a className="text-decoration-none text-dark" href="tel:+261327563770">
                    +261 32 97 905 36
                  </a>
                  <div className="small text-secondary">Lun-Sam - 08:00-18:00</div>
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

              <div className="d-flex flex-wrap gap-2">
                <span className="badge text-bg-light border">Reponse sous 24h</span>
                <span className="badge text-bg-light border">Paiement securise</span>
                <span className="badge text-bg-light border">Retour 30 jours</span>
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-7">
            <div className="p-4 p-lg-5 rounded-4 shadow-sm h-100" style={{ background: "#1f1916" }}>
              {successMessage ? <div className="alert alert-success alert-dismissible fade show" role="alert">{successMessage}</div> : null}

              <form onSubmit={onSubmit} noValidate>
                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <label className="form-label text-white">Nom complet</label>
                    <input
                      className={`form-control ${errors.name ? "is-invalid" : ""}`}
                      name="name"
                      value={form.name}
                      onChange={onChange}
                      placeholder="Votre nom"
                      disabled={sending}
                    />
                    {errors.name ? <div className="invalid-feedback">{errors.name[0]}</div> : null}
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label text-white">Email</label>
                    <input
                      className={`form-control ${errors.email ? "is-invalid" : ""}`}
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={onChange}
                      placeholder="Votre email"
                      disabled={sending}
                    />
                    {errors.email ? (
                      <div className="invalid-feedback">{errors.email[0]}</div>
                    ) : null}
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label text-white">Telephone (optionnel)</label>
                    <input
                      className={`form-control ${errors.phone ? "is-invalid" : ""}`}
                      name="phone"
                      value={form.phone}
                      onChange={onChange}
                      placeholder="+261 ..."
                      disabled={sending}
                    />
                    {errors.phone ? (
                      <div className="invalid-feedback">{errors.phone[0]}</div>
                    ) : null}
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label text-white">Sujet</label>
                    <select
                      className={`form-select ${errors.subject ? "is-invalid" : ""}`}
                      name="subject"
                      value={form.subject}
                      onChange={onChange}
                      disabled={sending}
                    >
                      <option value="">Choisir...</option>
                      <option value="commande">Question sur une commande</option>
                      <option value="produit">Question sur un produit</option>
                      <option value="retour">Retour / echange</option>
                      <option value="collab">Collaboration</option>
                      <option value="autre">Autre</option>
                    </select>
                    {errors.subject ? (
                      <div className="invalid-feedback">{errors.subject[0]}</div>
                    ) : null}
                  </div>

                  <div className="col-12">
                    <label className="form-label text-white">Message</label>
                    <textarea
                      className={`form-control ${errors.message ? "is-invalid" : ""}`}
                      rows="5"
                      name="message"
                      value={form.message}
                      onChange={onChange}
                      placeholder="Ecrivez votre message..."
                      disabled={sending}
                    />
                    {errors.message ? (
                      <div className="invalid-feedback">{errors.message[0]}</div>
                    ) : null}
                  </div>

                  <div className="col-12 d-flex flex-column flex-sm-row gap-2">
                    <button
                      className="btn fw-semibold flex-fill"
                      style={{ background: "#f3c100", color: "#111" }}
                      type="submit"
                      disabled={sending}
                    >
                      {sending ? "Envoi en cours..." : "Envoyer"}
                    </button>

                    <button
                      className="btn btn-outline-light"
                      type="button"
                      onClick={resetForm}
                      disabled={sending}
                    >
                      Reinitialiser
                    </button>
                  </div>

                  <div className="col-12">
                    <div className="small text-white-50">
                      En envoyant, vous acceptez d'etre contacte(e) concernant votre demande.
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
