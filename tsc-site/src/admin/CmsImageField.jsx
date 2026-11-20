import { useState } from "react";
import { createPortal } from "react-dom";
import { api } from "../lib/api";
import { useToast } from "../components/Toast";
import MediaGallery from "./MediaGallery";

export default function CmsImageField({ value, onChange }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function onLocalUpload(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const uploaded = await api.mediaUpload(file);
      onChange(uploaded.url);
      toast.success("Image uploaded.");
    } catch (err) {
      const msg =
        err?.data?.error === "invalid_file_type"
          ? "Only JPEG, PNG, WebP, or GIF up to 5MB."
          : err.message || "Upload failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="cms-image-field">
      <div className="cms-image-field__controls">
        <input
          type="url"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Upload, pick from gallery, or paste a URL"
        />
        <div className="cms-image-field__buttons">
          <label className="cms-image-field__btn">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={onLocalUpload}
              disabled={uploading}
            />
            {uploading ? "Uploading…" : "Upload"}
          </label>
          <button type="button" className="cms-image-field__btn" onClick={() => setOpen(true)}>
            Gallery
          </button>
          {value ? (
            <button
              type="button"
              className="cms-image-field__btn cms-image-field__btn--muted"
              onClick={() => onChange("")}
            >
              Clear
            </button>
          ) : null}
        </div>
      </div>
      {error ? <p className="admin-error">{error}</p> : null}
      {value ? (
        <div className="cms-image-field__preview">
          <img src={value} alt="" />
        </div>
      ) : null}

      {open
        ? createPortal(
            <div
              className="media-modal"
              role="dialog"
              aria-modal="true"
              aria-label="Media gallery"
              onClick={(e) => {
                if (e.target === e.currentTarget) setOpen(false);
              }}
            >
              <div className="media-modal__panel">
                <MediaGallery
                  selectable
                  selectedUrl={value || ""}
                  onSelect={(url) => {
                    onChange(url);
                    setOpen(false);
                    if (url) toast.success("Image applied to field.");
                  }}
                  onClose={() => setOpen(false)}
                />
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
