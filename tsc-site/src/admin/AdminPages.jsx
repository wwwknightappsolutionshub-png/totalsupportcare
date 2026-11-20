import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useToast } from "../components/Toast";
import AdminPageHeader from "./AdminPageHeader";
import CmsSectionEditor from "./CmsSectionEditor";
import { labelForType } from "./cmsFieldSchemas";
import {
  blockTypeOptions,
  cloneSections,
  createBlankSection,
  sectionsFromBlockTypes,
} from "./cmsBlocks";

function slugifyPath(title) {
  const slug = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return slug ? `/${slug}` : "/";
}

const DEFAULT_CREATE_BLOCKS = ["page_hero", "rich_text"];

export default function AdminPages() {
  const toast = useToast();
  const [pages, setPages] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [page, setPage] = useState(null);
  const [draftSections, setDraftSections] = useState([]);
  const [showJson, setShowJson] = useState(false);
  const [draftJson, setDraftJson] = useState("");
  const [busy, setBusy] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newPath, setNewPath] = useState("");
  const [pathTouched, setPathTouched] = useState(false);
  const [addToNav, setAddToNav] = useState(true);
  const [startMode, setStartMode] = useState("blocks");
  const [templateId, setTemplateId] = useState("");
  const [createBlocks, setCreateBlocks] = useState([...DEFAULT_CREATE_BLOCKS]);
  const [addBlockType, setAddBlockType] = useState("rich_text");

  useEffect(() => {
    api.adminPages().then((d) => {
      setPages(d.items);
      if (d.items[0]) setSelectedId(d.items[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    api.adminPage(selectedId).then((d) => {
      setPage(d);
      setDraftSections(structuredClone(d.draftSections || []));
      setDraftJson(JSON.stringify(d.draftSections || [], null, 2));
      setShowJson(false);
    });
  }, [selectedId]);

  function updateSection(index, nextSection) {
    setDraftSections((prev) => prev.map((s, i) => (i === index ? nextSection : s)));
  }

  function moveSection(index, dir) {
    setDraftSections((prev) => {
      const next = [...prev];
      const j = index + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[index], next[j]] = [next[j], next[index]];
      return next;
    });
  }

  function removeSection(index) {
    setDraftSections((prev) => prev.filter((_, i) => i !== index));
  }

  function addSection() {
    setDraftSections((prev) => [
      ...prev,
      createBlankSection(addBlockType, page?.title || "Section"),
    ]);
    toast.success(`Added ${labelForType(addBlockType)}.`);
  }

  function applyJsonToDraft() {
    const parsed = JSON.parse(draftJson);
    if (!Array.isArray(parsed)) {
      throw new Error("Sections must be a JSON array");
    }
    setDraftSections(parsed);
    return parsed;
  }

  async function saveDraft() {
    setBusy(true);
    try {
      let sections = draftSections;
      if (showJson) {
        sections = applyJsonToDraft();
      }
      const updated = await api.patchPage(selectedId, {
        draftSections: sections,
      });
      setPage(updated);
      setDraftSections(structuredClone(updated.draftSections || []));
      setDraftJson(JSON.stringify(updated.draftSections || [], null, 2));
      toast.success("Draft saved.");
    } catch (err) {
      toast.error(err.message || "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function publish() {
    setBusy(true);
    try {
      let sections = draftSections;
      if (showJson) {
        sections = applyJsonToDraft();
      }
      await api.patchPage(selectedId, { draftSections: sections });
      await api.publishPage(selectedId);
      const refreshed = await api.adminPage(selectedId);
      setPage(refreshed);
      setDraftSections(structuredClone(refreshed.draftSections || []));
      setDraftJson(JSON.stringify(refreshed.draftSections || [], null, 2));
      toast.success("Published. Live site will serve this version.");
      const list = await api.adminPages();
      setPages(list.items);
    } catch (err) {
      toast.error(err.message || "Publish failed");
    } finally {
      setBusy(false);
    }
  }

  function toggleJson() {
    if (!showJson) {
      setDraftJson(JSON.stringify(draftSections, null, 2));
      setShowJson(true);
      return;
    }
    try {
      applyJsonToDraft();
      setShowJson(false);
    } catch (err) {
      toast.error(err.message || "Invalid JSON");
    }
  }

  function openCreate() {
    setCreating(true);
    setNewTitle("");
    setNewPath("");
    setPathTouched(false);
    setAddToNav(true);
    setStartMode("blocks");
    setCreateBlocks([...DEFAULT_CREATE_BLOCKS]);
    setTemplateId(pages[0]?.id || "");
  }

  function onTitleChange(value) {
    setNewTitle(value);
    if (!pathTouched) setNewPath(slugifyPath(value));
  }

  function toggleCreateBlock(type) {
    setCreateBlocks((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  }

  async function resolveCreateSections(title) {
    if (startMode === "template") {
      if (!templateId) throw new Error("Choose a page to copy from.");
      const source = await api.adminPage(templateId);
      const sourceSections =
        source.draftSections?.length > 0
          ? source.draftSections
          : source.sections || [];
      if (!sourceSections.length) {
        throw new Error("That page has no sections to copy.");
      }
      return cloneSections(sourceSections, title);
    }
    if (!createBlocks.length) {
      throw new Error("Select at least one block.");
    }
    return sectionsFromBlockTypes(createBlocks, title);
  }

  async function createPage(e) {
    e.preventDefault();
    const title = newTitle.trim();
    let path = newPath.trim();
    if (!title) {
      toast.error("Enter a page title.");
      return;
    }
    if (!path.startsWith("/")) path = `/${path}`;
    path = path.toLowerCase().replace(/\/+/g, "/");
    if (!/^\/[a-z0-9\-/]*$/.test(path) || path === "/") {
      toast.error(
        "Path must look like /my-page (lowercase letters, numbers, hyphens)."
      );
      return;
    }

    setBusy(true);
    try {
      const sections = await resolveCreateSections(title);
      const created = await api.createPage({
        title,
        path,
        sections,
      });

      if (addToNav) {
        try {
          const { settings } = await api.adminSettings();
          const nav = Array.isArray(settings.nav) ? [...settings.nav] : [];
          if (!nav.some((item) => item.to === path)) {
            nav.push({ label: title, to: path });
            await api.patchSettings({ nav });
          }
        } catch {
          /* page still created */
        }
      }

      const list = await api.adminPages();
      setPages(list.items);
      setSelectedId(created.id);
      setCreating(false);
      toast.success(`Page “${title}” created as draft — edit blocks below.`);
    } catch (err) {
      toast.error(
        err?.data?.error === "path_exists"
          ? "That path already exists."
          : err?.data?.error === "forbidden"
            ? "Only the site owner can create pages."
            : err.message || "Could not create page"
      );
    } finally {
      setBusy(false);
    }
  }

  const blockOptions = blockTypeOptions();

  return (
    <div className="admin-panel admin-cms-page">
      <AdminPageHeader
        eyebrow="Content"
        title="Site CMS"
        description="Build pages from blocks, or copy an existing page’s layout and edit its sections."
        actions={
          <button type="button" className="admin-btn" onClick={openCreate}>
            + Add page
          </button>
        }
      />
      <nav className="admin-cms__tabs" aria-label="Pages">
        {pages.map((p) => (
          <button
            key={p.id}
            type="button"
            className={p.id === selectedId && !creating ? "is-active" : ""}
            onClick={() => {
              setCreating(false);
              setSelectedId(p.id);
            }}
          >
            <strong>{p.title}</strong>
            <span>{p.status}</span>
          </button>
        ))}
        <button
          type="button"
          className={`admin-cms__tabs-add${creating ? " is-active" : ""}`}
          onClick={openCreate}
        >
          + Add page
        </button>
      </nav>

      {creating ? (
        <form className="admin-cms__create" onSubmit={createPage}>
          <h2>New page</h2>
          <p>
            Choose which blocks to start with, or copy the layout from an
            existing page. You can add and rearrange blocks after creating.
          </p>
          <label>
            Title
            <input
              value={newTitle}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="e.g. Careers"
              required
              autoFocus
            />
          </label>
          <label>
            URL path
            <input
              value={newPath}
              onChange={(e) => {
                setPathTouched(true);
                setNewPath(e.target.value);
              }}
              placeholder="/careers"
              required
            />
          </label>

          <fieldset className="admin-cms__create-mode">
            <legend>Starting layout</legend>
            <label className="admin-cms__create-check">
              <input
                type="radio"
                name="startMode"
                checked={startMode === "blocks"}
                onChange={() => setStartMode("blocks")}
              />
              Build from blocks
            </label>
            <label className="admin-cms__create-check">
              <input
                type="radio"
                name="startMode"
                checked={startMode === "template"}
                onChange={() => setStartMode("template")}
              />
              Copy an existing page
            </label>
          </fieldset>

          {startMode === "blocks" ? (
            <fieldset className="admin-cms__create-blocks">
              <legend>Blocks to include</legend>
              <div className="admin-cms__block-grid">
                {blockOptions.map((opt) => (
                  <label key={opt.type} className="admin-cms__create-check">
                    <input
                      type="checkbox"
                      checked={createBlocks.includes(opt.type)}
                      onChange={() => toggleCreateBlock(opt.type)}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </fieldset>
          ) : (
            <label>
              Copy layout from
              <select
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                required
              >
                <option value="">Select a page…</option>
                {pages.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({p.path})
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="admin-cms__create-check">
            <input
              type="checkbox"
              checked={addToNav}
              onChange={(e) => setAddToNav(e.target.checked)}
            />
            Add to main site navigation
          </label>
          <div className="admin-cms__create-actions">
            <button type="submit" className="is-primary" disabled={busy}>
              {busy ? "Creating…" : "Create draft"}
            </button>
            <button
              type="button"
              onClick={() => setCreating(false)}
              disabled={busy}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      {!creating ? (
        <div className="admin-cms__editor admin-cms__editor--full">
          {page ? (
            <>
              <div className="admin-cms__toolbar">
                <div>
                  <h2>{page.title}</h2>
                  <p>
                    {page.path} · status {page.status}
                    {page.status === "draft"
                      ? " · publish before it appears on the live site"
                      : ""}
                  </p>
                </div>
                <div className="admin-cms__actions">
                  <button type="button" onClick={toggleJson}>
                    {showJson ? "Form editor" : "Advanced JSON"}
                  </button>
                  <button type="button" onClick={saveDraft} disabled={busy}>
                    {busy ? "Saving…" : "Save draft"}
                  </button>
                  <button
                    type="button"
                    className="is-primary"
                    onClick={publish}
                    disabled={busy}
                  >
                    Publish
                  </button>
                  {page.status === "published" ? (
                    <a
                      href={page.path === "/" ? "/" : page.path}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open page
                    </a>
                  ) : null}
                </div>
              </div>

              {!showJson ? (
                <div className="admin-cms__add-block">
                  <label>
                    Add block
                    <select
                      value={addBlockType}
                      onChange={(e) => setAddBlockType(e.target.value)}
                    >
                      {blockOptions.map((opt) => (
                        <option key={opt.type} value={opt.type}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button type="button" onClick={addSection}>
                    + Add to page
                  </button>
                </div>
              ) : null}

              {!showJson && draftSections.length > 0 ? (
                <nav
                  className="cms-sections__toc cms-sections__toc--bar"
                  aria-label="Sections"
                >
                  {draftSections.map((section, i) => (
                    <a key={section.id} href={`#cms-section-${section.id}`}>
                      <span>{String(i + 1).padStart(2, "0")}</span>
                      {labelForType(section.type)}
                      {section.enabled === false ? " (hidden)" : ""}
                    </a>
                  ))}
                </nav>
              ) : null}

              {showJson ? (
                <label className="admin-cms__label">
                  Draft sections (JSON)
                  <textarea
                    value={draftJson}
                    onChange={(e) => setDraftJson(e.target.value)}
                    spellCheck={false}
                  />
                </label>
              ) : draftSections.length === 0 ? (
                <p className="cms-muted">
                  No blocks yet. Use “Add block” above to build this page.
                </p>
              ) : (
                <div className="cms-sections cms-sections--stack">
                  <div className="cms-sections__editors">
                    {draftSections.map((section, index) => (
                      <div key={section.id} id={`cms-section-${section.id}`}>
                        <CmsSectionEditor
                          section={section}
                          onChange={(next) => updateSection(index, next)}
                          onMoveUp={() => moveSection(index, -1)}
                          onMoveDown={() => moveSection(index, 1)}
                          onRemove={() => removeSection(index)}
                          canMoveUp={index > 0}
                          canMoveDown={index < draftSections.length - 1}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <p>Select a page.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
