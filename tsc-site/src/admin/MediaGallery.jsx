import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";
import { useToast } from "../components/Toast";

function formatSize(bytes) {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Shared gallery grid used by the Media admin page and the CMS image picker.
 */
export default function MediaGallery({
  selectable = false,
  selectedUrl = "",
  onSelect,
  onClose,
  variant = "default",
}) {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.mediaList();
      setItems(data.items || []);
    } catch (err) {
      toast.error(err.message || "Could not load gallery");
    }
    // toast.success/error are stable via ToastProvider
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function onUpload(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const uploaded = await api.mediaUpload(file);
      toast.success(`Uploaded ${uploaded.originalName || "image"}.`);
      await load();
      if (selectable && onSelect) onSelect(uploaded.url);
    } catch (err) {
      toast.error(
        err?.data?.error === "invalid_file_type"
          ? "Only JPEG, PNG, WebP, or GIF images up to 5MB."
          : err.message || "Upload failed"
      );
    } finally {
      setUploading(false);
    }
  }

  function isSeedItem(item) {
    return (
      String(item?.id || "").startsWith("seed:") ||
      String(item?.filename || "").startsWith("seed-")
    );
  }

  async function onDelete(item) {
    if (isSeedItem(item)) {
      toast.error("Seed library images are locked and cannot be deleted.");
      return;
    }
    const ok = window.confirm(
      `Permanently delete “${item.originalName}”? This cannot be undone.`
    );
    if (!ok) return;
    setBusy(true);
    try {
      await api.mediaDelete(item.id);
      toast.success("Image deleted permanently.");
      if (selectedUrl === item.url && onSelect) onSelect("");
      await load();
    } catch (err) {
      toast.error(
        err?.data?.error === "seed_media_locked"
          ? "Seed library images are locked and cannot be deleted."
          : err.message || "Delete failed"
      );
    } finally {
      setBusy(false);
    }
  }

  const isPage = variant === "page" && !selectable;
  const uploadControl = (
    <label className="media-gallery__upload">
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={onUpload}
        disabled={uploading || busy}
      />
      {uploading ? "Uploading…" : "Upload from device"}
    </label>
  );

  return (
    <div
      className={`media-gallery${selectable ? " media-gallery--picker" : ""}${
        isPage ? " media-gallery--page" : ""
      }`}
    >
      {isPage ? (
        <div className="media-gallery__toolbar media-gallery__toolbar--page">
          <div>
            <p className="media-gallery__count">
              {items.length} {items.length === 1 ? "image" : "images"} in library
            </p>
          </div>
          <div className="media-gallery__actions">{uploadControl}</div>
        </div>
      ) : (
        <div className="media-gallery__toolbar">
          <div>
            <h2>{selectable ? "Choose from gallery" : "Media gallery"}</h2>
            <p>JPEG, PNG, WebP, or GIF · max 5MB</p>
          </div>
          <div className="media-gallery__actions">
            {uploadControl}
            {onClose ? (
              <button
                type="button"
                className="media-gallery__close"
                onClick={onClose}
              >
                Close
              </button>
            ) : null}
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <p className="media-gallery__empty">
          No images yet. Upload one from your device to start the gallery.
        </p>
      ) : (
        <ul className="media-gallery__grid">
          {items.map((item) => {
            const active = selectedUrl === item.url;
            return (
              <li
                key={item.id}
                className={`media-gallery__card ${active ? "is-selected" : ""}`}
              >
                <button
                  type="button"
                  className="media-gallery__thumb"
                  disabled={!selectable}
                  onClick={() => selectable && onSelect?.(item.url)}
                  title={selectable ? "Use this image" : item.originalName}
                >
                  <img src={item.url} alt={item.originalName} loading="lazy" />
                </button>
                <div className="media-gallery__meta">
                  <strong title={item.originalName}>{item.originalName}</strong>
                  <span>
                    {formatSize(item.size)}
                    {item.createdAt
                      ? ` · ${new Date(item.createdAt).toLocaleDateString()}`
                      : ""}
                  </span>
                </div>
                <div className="media-gallery__row-actions">
                  {selectable ? (
                    <button
                      type="button"
                      className="is-primary"
                      onClick={() => onSelect?.(item.url)}
                    >
                      {active ? "Selected" : "Use image"}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="is-danger"
                    disabled={busy || isSeedItem(item)}
                    title={
                      isSeedItem(item)
                        ? "Seed library images cannot be deleted"
                        : "Delete permanently"
                    }
                    onClick={() => onDelete(item)}
                  >
                    {isSeedItem(item) ? "Locked" : "Delete"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
