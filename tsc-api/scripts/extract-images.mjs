const urls = process.argv.slice(2);
for (const url of urls) {
  const res = await fetch(url);
  const t = await res.text();
  const found = [
    ...t.matchAll(/https:\/\/[^\s"'<>]+\.(?:jpg|jpeg|png|webp|avif)/gi),
  ].map((m) => m[0].replace(/&amp;/g, "&"));
  console.log("\n#", url);
  console.log([...new Set(found)].slice(0, 30).join("\n"));
}
