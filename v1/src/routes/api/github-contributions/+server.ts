import { json } from '@sveltejs/kit';
import { GITHUB_TOKEN } from '$env/static/private';

export async function GET() {
	const query = `
		query {
			user(login: "rodnnnney") {
				contributionsCollection {
					contributionCalendar {
						totalContributions
					}
				}
			}
		}
	`;

	try {
		const response = await fetch('https://api.github.com/graphql', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${GITHUB_TOKEN}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ query })
		});

		if (!response.ok) {
			throw new Error(`GitHub API error: ${response.status}`);
		}

		const data = await response.json();
		const totalContributions =
			data.data?.user?.contributionsCollection?.contributionCalendar?.totalContributions ?? 0;

		return json({
			totalContributions,
			year: new Date().getFullYear()
		});
	} catch (error) {
		console.error('GitHub API error:', error);
		return json(
			{
				totalContributions: 0,
				year: new Date().getFullYear()
			},
			{ status: 500 }
		);
	}
}
