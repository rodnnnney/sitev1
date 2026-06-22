// Cloudflare Worker entry for sitev1. Serves the built SPA from the ASSETS
// binding and exposes a single server-side endpoint, /api/contributions, that
// proxies GitHub's GraphQL contribution calendar using a secret token so the
// token never reaches the browser.

interface Env {
  ASSETS: { fetch: (request: Request) => Promise<Response> };
  GITHUB_READ_TOKEN: string;
  GITHUB_LOGIN?: string;
}

const CONTRIBUTIONS_QUERY = `
  query ($login: String!, $from: DateTime, $to: DateTime) {
    user(login: $login) {
      contributionsCollection(from: $from, to: $to) {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              date
              contributionCount
              weekday
            }
          }
        }
      }
    }
  }
`;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/api/contributions") {
      return handleContributions(request, env, url);
    }
    return env.ASSETS.fetch(request);
  },
};

async function handleContributions(
  request: Request,
  env: Env,
  url: URL,
): Promise<Response> {
  if (!env.GITHUB_READ_TOKEN) {
    return json({ error: "GITHUB_READ_TOKEN secret is not set" }, 500);
  }

  // Edge-cache the response so we're not calling GitHub on every page load.
  const cache = (caches as unknown as { default: Cache }).default;
  const cacheKey = new Request(url.toString());
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  const login = env.GITHUB_LOGIN ?? "rodnnnney";
  const from = url.searchParams.get("from") || undefined;
  const to = url.searchParams.get("to") || undefined;

  const ghRes = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `bearer ${env.GITHUB_READ_TOKEN}`,
      "Content-Type": "application/json",
      "User-Agent": "sitev1-contributions",
    },
    body: JSON.stringify({
      query: CONTRIBUTIONS_QUERY,
      variables: { login, from, to },
    }),
  });

  if (!ghRes.ok) {
    return json({ error: `GitHub responded ${ghRes.status}` }, 502);
  }

  const payload = (await ghRes.json()) as {
    data?: {
      user?: {
        contributionsCollection?: { contributionCalendar?: unknown };
      };
    };
    errors?: unknown;
  };

  const calendar =
    payload.data?.user?.contributionsCollection?.contributionCalendar;
  if (!calendar) {
    return json({ error: "no contribution data", detail: payload.errors }, 502);
  }

  const res = json(calendar, 200, "public, max-age=3600, s-maxage=3600");
  await cache.put(cacheKey, res.clone());
  return res;
}

function json(
  body: unknown,
  status = 200,
  cacheControl = "no-store",
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": cacheControl,
    },
  });
}
