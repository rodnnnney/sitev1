import { defineConfig, loadEnv, type Plugin } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import tailwindcss from '@tailwindcss/vite'

function githubContributionsDev(token: string): Plugin {
  const LOGIN = 'rodnnnney'
  const query = `query($login:String!,$from:DateTime,$to:DateTime){user(login:$login){contributionsCollection(from:$from,to:$to){contributionCalendar{totalContributions weeks{contributionDays{date contributionCount weekday}}}}}}`
  return {
    name: 'github-contributions-dev',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/contributions', async (_req, res) => {
        const send = (status: number, body: unknown) => {
          res.statusCode = status
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(body))
        }
        if (!token) return send(500, { error: 'GITHUB_READ_TOKEN not set in .env' })
        try {
          const year = new Date().getUTCFullYear()
          const r = await fetch('https://api.github.com/graphql', {
            method: 'POST',
            headers: {
              Authorization: `bearer ${token}`,
              'Content-Type': 'application/json',
              'User-Agent': 'sitev1-contributions-dev',
            },
            body: JSON.stringify({
              query,
              variables: {
                login: LOGIN,
                from: `${year}-01-01T00:00:00Z`,
                to: `${year}-12-31T23:59:59Z`,
              },
            }),
          })
          if (!r.ok) return send(502, { error: `GitHub ${r.status}` })
          const data = (await r.json()) as any
          const cal = data?.data?.user?.contributionsCollection?.contributionCalendar
          if (!cal) return send(502, { error: 'no data', detail: data?.errors ?? null })
          send(200, cal)
        } catch (e) {
          send(502, { error: String(e) })
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [
      tailwindcss(),
      svelte(),
      githubContributionsDev(env.GITHUB_READ_TOKEN),
    ],
  }
})
