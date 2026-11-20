import AdminPageHeader from "./AdminPageHeader";
import MediaGallery from "./MediaGallery";

export default function AdminMedia() {
  return (
    <div className="admin-panel">
      <AdminPageHeader
        eyebrow="Library"
        title="Media"
        description="Upload images from your device. Assets here are available when editing CMS image fields. Deleting removes the file permanently from the server."
        meta="JPEG, PNG, WebP, or GIF · max 5MB"
      />
      <MediaGallery variant="page" />
    </div>
  );
}
