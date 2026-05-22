import React, { useRef } from "react";
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
  const inputRef = useRef(null);

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
    <>
      <input
        ref={inputRef}
        type="file"
        className="d-none"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={(event) => {
          onChange?.(event);
          event.target.value = "";
        }}
      />

      <div className={`input-group ${error ? "has-validation" : ""}`}>
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
        >
          {chooseLabel}
        </button>
        <div className={`form-control text-truncate ${error ? "is-invalid" : ""}`}>
          {selectedText || noneLabel}
        </div>
        {error ? <div className="invalid-feedback">{error}</div> : null}
      </div>
    </>
  );
}
