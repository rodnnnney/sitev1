import { json } from '@sveltejs/kit';

export async function GET() {
	// Always return fallback data for now to avoid build issues
	return json({
		totalContributions: 965,
		year: 'last year',
		weeks: []
	});
}
