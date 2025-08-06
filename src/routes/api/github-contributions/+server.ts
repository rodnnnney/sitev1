import { GITHUB_TOKEN } from '$env/static/private';
import { json } from '@sveltejs/kit';

export async function GET() {
	try {
		// Get last 365 days instead of current calendar year
		const today = new Date();
		const oneYearAgo = new Date();
		oneYearAgo.setFullYear(today.getFullYear() - 1);

		const query = `
			query {
				user(login: "rodnnnney") {
					contributionsCollection(from: "${oneYearAgo.toISOString()}", to: "${today.toISOString()}") {
						contributionCalendar {
							totalContributions
							weeks {
								contributionDays {
									contributionCount
									date
								}
							}
						}
					}
				}
			}
		`;
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

		if (data.errors) {
			throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
		}

		const contributionsData = data.data.user.contributionsCollection.contributionCalendar;

		return json({
			totalContributions: contributionsData.totalContributions,
			year: 'last year',
			weeks: contributionsData.weeks
		});
	} catch (error) {
		console.error('Failed to fetch GitHub contributions:', error);

		// Fallback response
		return json(
			{
				totalContributions: 965, // Your known last year count as fallback
				year: 'last year',
				weeks: []
			},
			{ status: 500 }
		);
	}
}
