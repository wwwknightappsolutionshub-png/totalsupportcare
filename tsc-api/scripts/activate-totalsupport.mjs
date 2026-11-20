/**
 * Force-reseed Total Support Care pack pages/settings and activate it.
 * Usage: node scripts/activate-totalsupport.mjs
 */
process.env.FORCE_RESEED_PACKS = "1";

const { ensureSitePacks, activatePack, getActivePack, listPacks } = await import(
  "../src/services/packs.js"
);

ensureSitePacks();
const pack = activatePack("totalsupport");
if (!pack) {
  console.error("Failed to activate totalsupport — pack missing after seed.");
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      active: getActivePack()?.slug,
      packs: listPacks().map((p) => ({
        slug: p.slug,
        name: p.name,
        niche: p.niche,
        isActive: p.isActive,
      })),
    },
    null,
    2
  )
);
