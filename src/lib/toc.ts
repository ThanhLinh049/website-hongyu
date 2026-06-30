export interface TocItem {
  id: string;
  text: string;
  level: number; // 2 = h2, 3 = h3
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')   // strip accents
    .replace(/[^a-z0-9\s-]/g, '')      // drop punctuation
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80) || 'section';
}

// Parse post HTML, ensure every <h2>/<h3> has a stable id, and return both the
// id-augmented HTML and a flat table of contents. No DOM/cheerio dependency —
// WordPress heading markup is simple enough for a focused regex pass.
export function buildToc(html: string): { html: string; toc: TocItem[] } {
  if (!html || typeof html !== 'string') return { html: html || '', toc: [] };

  const toc: TocItem[] = [];
  const used = new Set<string>();

  const decode = (s: string) =>
    s
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#0?39;|&apos;/g, "'")
      .replace(/&nbsp;/g, ' ');

  const out = html.replace(/<h([23])([^>]*)>([\s\S]*?)<\/h\1>/gi, (match, lvl, attrs, inner) => {
    const text = decode(inner.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim());
    if (!text) return match;

    // Reuse an existing id when the author already set one.
    const existing = /\sid=["']([^"']+)["']/i.exec(attrs);
    let id = existing ? existing[1] : slugify(text);

    // Guarantee uniqueness across the document.
    let unique = id;
    let n = 2;
    while (used.has(unique)) unique = `${id}-${n++}`;
    used.add(unique);
    id = unique;

    const newAttrs = existing
      ? attrs.replace(/\sid=["'][^"']+["']/i, ` id="${id}"`)
      : `${attrs} id="${id}"`;

    toc.push({ id, text, level: Number(lvl) });
    return `<h${lvl}${newAttrs}>${inner}</h${lvl}>`;
  });

  return { html: out, toc };
}
