import { useState } from "react";
import api from "../../api/axios";
import { useI18n } from "../../hooks/website/I18nContext";

const initialForm = {
  name: "",
  email: "",
  phone: "",
  subject: "",
  message: "",
};

export default function Contact() {
  const { t } = useI18n();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [sending, setSending] = useState(false);

  const update = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));

    if (errors[field]) {
      setErrors((current) => ({ ...current, [field]: undefined }));
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

  const submit = async (e) => {
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

      setSuccessMessage(data?.message || t("contactPage.messages.success", "Message envoye avec succes."));
      setForm(initialForm);
    } catch (error) {
      const response = error?.response;
      const validationErrors = response?.data?.errors;

      if (validationErrors) {
        setErrors(validationErrors);
      }

      setServerError(
        response?.data?.message ||
          t(
            "contactPage.messages.error",
            "Erreur lors de l'envoi du message. Veuillez reessayer."
          )
      );
    } finally {
      setSending(false);
    }
  };

  const whatsappNumber = "261329790536";
  const whatsappText = encodeURIComponent(
    t("contactPage.whatsapp.prefill", "Bonjour MAKARAKARA, j'ai une question.")
  );
  const faqItems = [
    {
      q: t("contactPage.faq.delivery.question", "Quel est le delai de livraison ?"),
      a: t("contactPage.faq.delivery.answer", "La livraison prend generalement 24 a 72h selon la ville."),
    },
    {
      q: t("contactPage.faq.payment.question", "Quels moyens de paiement acceptez-vous ?"),
      a: t("contactPage.faq.payment.answer", "Paiement en espece a la livraison ou mobile money."),
    },
    {
      q: t("contactPage.faq.order.question", "Puis-je modifier ma commande ?"),
      a: t("contactPage.faq.order.answer", "Oui, contactez-nous rapidement avant l'expedition."),
    },
    {
      q: t("contactPage.faq.guarantee.question", "Les produits sont-ils garantis ?"),
      a: t("contactPage.faq.guarantee.answer", "Oui, nous garantissons la qualite de nos produits."),
    },
  ];

  return (
    <main className="py-5" style={{ background: "#fbf7ec" }}>
      <div className="container">
        <div className="text-center mb-4">
          <h1 className="fw-bold mb-2">{t("contactPage.title", "Contact")}</h1>
          <p className="text-secondary mb-0">
            {t("contactPage.subtitle", "Une question ? Ecrivez-nous, on repond rapidement.")}
          </p>
        </div>

        <div className="row g-4">
          <div className="col-12 col-lg-5">
            <div className="bg-white rounded-4 shadow-sm p-4 h-100">
              <h5 className="fw-bold mb-3">{t("contactPage.info.title", "Nos coordonnees")}</h5>

              <div className="d-flex gap-3 mb-3">
                <div className="text-warning fs-5">
                  <i className="bi bi-envelope"></i>
                </div>
                <div>
                  <div className="fw-semibold">{t("contactPage.info.email", "Email")}</div>
                  <div className="text-secondary">tiafinjaran@gmail.com</div>
                </div>
              </div>

              <div className="d-flex gap-3 mb-3">
                <div className="text-warning fs-5">
                  <i className="bi bi-telephone"></i>
                </div>
                <div>
                  <div className="fw-semibold">{t("contactPage.info.phone", "Telephone")}</div>
                  <div className="text-secondary">+261 32 97 905 36</div>
                </div>
              </div>

              <div className="d-flex gap-3 mb-4">
                <div className="text-warning fs-5">
                  <i className="bi bi-geo-alt"></i>
                </div>
                <div>
                  <div className="fw-semibold">{t("contactPage.info.address", "Adresse")}</div>
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
                  {t("contactPage.info.sendEmail", "Envoyer un email")}
                </a>
              </div>

              <hr className="my-4" />

              <div className="text-secondary small">
                {t("contactPage.info.hours", "Horaires : Lundi-Samedi - 08:00-18:00")}
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-7">
            <div className="bg-white rounded-4 shadow-sm p-4">
              <h5 className="fw-bold mb-3">
                {t("contactPage.form.title", "Envoyer un message")}
              </h5>

              {serverError ? <div className="alert alert-danger">{serverError}</div> : null}
              {successMessage ? (
                <div className="alert alert-success alert-dismissible fade show" role="alert">
                  {successMessage}
                  <button
                    type="button"
                    className="btn-close"
                    data-bs-dismiss="alert"
                    aria-label={t("common.close", "Close")}
                  ></button>
                </div>
              ) : null}

              <form onSubmit={submit} className="row g-3" noValidate>
                <div className="col-12 col-md-6">
                  <label className="form-label">{t("contactPage.form.name", "Nom")} *</label>
                  <input
                    className={`form-control ${errors.name ? "is-invalid" : ""}`}
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                    placeholder={t("contactPage.placeholders.name", "Votre nom")}
                    disabled={sending}
                  />
                  {errors.name ? <div className="invalid-feedback">{errors.name[0]}</div> : null}
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label">{t("contactPage.form.email", "Email")} *</label>
                  <input
                    type="email"
                    className={`form-control ${errors.email ? "is-invalid" : ""}`}
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    placeholder="email@gmail.com"
                    disabled={sending}
                  />
                  {errors.email ? <div className="invalid-feedback">{errors.email[0]}</div> : null}
                </div>

                <div className="col-12">
                  <label className="form-label">
                    {t("contactPage.form.phone", "Telephone (optionnel)")}
                  </label>
                  <input
                    className={`form-control ${errors.phone ? "is-invalid" : ""}`}
                    value={form.phone}
                    onChange={(e) => update("phone", e.target.value)}
                    placeholder={t("contactPage.placeholders.phone", "Ex: 034...")}
                    disabled={sending}
                  />
                  {errors.phone ? <div className="invalid-feedback">{errors.phone[0]}</div> : null}
                </div>

                <div className="col-12">
                  <label className="form-label">{t("contactPage.form.subject", "Sujet")} *</label>
                  <input
                    className={`form-control ${errors.subject ? "is-invalid" : ""}`}
                    value={form.subject}
                    onChange={(e) => update("subject", e.target.value)}
                    placeholder={t(
                      "contactPage.placeholders.subject",
                      "Ex: Livraison, produit, paiement..."
                    )}
                    disabled={sending}
                  />
                  {errors.subject ? (
                    <div className="invalid-feedback">{errors.subject[0]}</div>
                  ) : null}
                </div>

                <div className="col-12">
                  <label className="form-label">{t("contactPage.form.message", "Message")} *</label>
                  <textarea
                    className={`form-control ${errors.message ? "is-invalid" : ""}`}
                    rows={5}
                    value={form.message}
                    onChange={(e) => update("message", e.target.value)}
                    placeholder={t("contactPage.placeholders.message", "Ecrivez votre message...")}
                    disabled={sending}
                  />
                  {errors.message ? (
                    <div className="invalid-feedback">{errors.message[0]}</div>
                  ) : null}
                </div>

                <div className="col-12 d-flex flex-column flex-sm-row gap-2">
                  <button className="btn btn-warning fw-semibold" type="submit" disabled={sending}>
                    <i className="bi bi-send me-2"></i>
                    {sending
                      ? t("contactPage.actions.sending", "Envoi en cours...")
                      : t("contactPage.actions.send", "Envoyer")}
                  </button>

                  <button
                    className="btn btn-outline-dark"
                    type="button"
                    onClick={resetForm}
                    disabled={sending}
                  >
                    {t("contactPage.actions.reset", "Reinitialiser")}
                  </button>
                </div>

                <small className="text-secondary">
                  {t(
                    "contactPage.form.footer",
                    "* Champs obligatoires. Reponse sous 24h, souvent plus rapide."
                  )}
                </small>
              </form>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <div className="bg-white rounded-4 shadow-sm overflow-hidden">
            <iframe
              title={t("contactPage.mapTitle", "MAKARAKARA - Localisation")}
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

      <div className="mt-5">
        <div className="container">
          <div className="text-center mb-4">
            <h2 className="fw-bold mb-2">{t("contactPage.faq.title", "Poser une question")}</h2>
            <p className="text-secondary mb-0">
              {t("contactPage.faq.subtitle", "Reponses rapides aux questions les plus frequentes.")}
            </p>
          </div>

          <div className="accordion" id="faqAccordion">
            {faqItems.map((item, i) => (
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
                  <div className="accordion-body text-secondary">{item.a}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-4">
            <p className="text-secondary mb-2">
              {t("contactPage.faq.noAnswer", "Vous ne trouvez pas votre reponse ?")}
            </p>

            <a
              className="btn btn-dark"
              href="https://wa.me/261329790536"
              target="_blank"
              rel="noreferrer"
            >
              <i className="bi bi-whatsapp me-2"></i>
              {t("contactPage.faq.askWhatsapp", "Poser une question sur WhatsApp")}
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
