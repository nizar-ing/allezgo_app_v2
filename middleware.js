// Vercel Edge Middleware — OG meta injection for social share bots.
// Only runs for /voyages-organises/:id, /omra/:id, /e-visa/:id routes.
// Regular browsers and Googlebot are passed through to the SPA unchanged.
export const config = {
  matcher: ['/voyages-organises/:id+', '/omra/:id+', '/e-visa/:id+'],
};

const SOCIAL_BOT_RE =
  /facebookexternalhit|twitterbot|linkedinbot|whatsapp|slackbot|telegrambot|discordbot|applebot|pinterest/i;

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export default async function middleware(request) {
  const ua = request.headers.get('user-agent') ?? '';
  if (!SOCIAL_BOT_RE.test(ua)) return; // let the SPA handle it normally

  const url = new URL(request.url);

  let meta;
  try {
    const res = await fetch(
      `https://api.allezgoo.com/api/og-meta?path=${encodeURIComponent(url.pathname)}`,
      { headers: { 'user-agent': 'AllezGoo-EdgeBot/1.0' } },
    );
    meta = await res.json();
  } catch {
    return; // API down — fall back to SPA shell
  }

  // Return a minimal HTML card for the bot: all og: tags + meta refresh for real browsers
  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>${esc(meta.title)}</title>
  <meta name="description" content="${esc(meta.description)}" />
  <meta property="og:site_name" content="AllezGoo" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${esc(meta.url)}" />
  <meta property="og:title" content="${esc(meta.title)}" />
  <meta property="og:description" content="${esc(meta.description)}" />
  <meta property="og:image" content="${esc(meta.image)}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${esc(meta.title)}" />
  <meta name="twitter:description" content="${esc(meta.description)}" />
  <meta name="twitter:image" content="${esc(meta.image)}" />
  <meta http-equiv="refresh" content="0; url=${esc(url.href)}" />
</head>
<body></body>
</html>`;

  return new Response(html, {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
}
