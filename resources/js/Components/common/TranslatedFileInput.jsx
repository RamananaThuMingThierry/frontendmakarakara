import React from "react";
import { useI18n } from "../../hooks/website/I18nContext";

export default function TranslatedFileInput({
  accept,
  multiple = false,
  disabled = false,
  error = "",
  onChange,
  selectedText = "",
  buttonLabel,
  emptyLabel,
}) {
  const { t } = useI18n();

  const chooseLabel =
    buttonLabel ||
    (multiple
      ? t("common.chooseFiles", "Choose files")
      : t("common.chooseFile", "Choose a file"));

  const noneLabel =
    emptyLabel ||
    (multiple
      ? t("common.noFilesChosen", "No files chosen")
      : t("common.noFileChosen", "No file chosen"));

  return (
    <div>
      <div
        className={`input-group position-relative ${error ? "has-validation" : ""}`}
        style={{ cursor: disabled ? "not-allowed" : "pointer" }}
      >
      <input
        type="file"
        className="position-absolute top-0 start-0 w-100 h-100 opacity-0"
        style={{ zIndex: 2, cursor: disabled ? "not-allowed" : "pointer" }}
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={onChange}
      />

        <span
          className="btn btn-outline-secondary"
          aria-disabled={disabled}
          style={{ pointerEvents: "none" }}
        >
          {chooseLabel}
        </span>
        <span
          className={`form-control text-truncate ${error ? "is-invalid" : ""}`}
          style={{ pointerEvents: "none" }}
        >
          {selectedText || noneLabel}
        </span>
      </div>
      {error ? <div className="invalid-feedback d-block">{error}</div> : null}
    </div>
  );
}
