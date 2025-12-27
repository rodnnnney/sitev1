import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

function decodeHtmlEntities(text: string): string {
	const entities: Record<string, string> = {
		'&amp;': '&',
		'&lt;': '<',
		'&gt;': '>',
		'&quot;': '"',
		'&#39;': "'",
		'&#x27;': "'",
		'&apos;': "'",
		'&#x2F;': '/',
		'&#x60;': '`',
		'&#x3D;': '=',
		'&nbsp;': ' '
	};

	return text
		.replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)))
		.replace(/&#x([a-fA-F0-9]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
		.replace(/&\w+;/g, (entity) => entities[entity] || entity);
}

export const GET: RequestHandler = async ({ url }) => {
	const targetUrl = url.searchParams.get('url');

	if (!targetUrl) {
		return json({ error: 'URL parameter required' }, { status: 400 });
	}

	try {
		const response = await fetch(targetUrl, {
			headers: {
				'User-Agent': 'Mozilla/5.0 (compatible; LinkPreview/1.0)'
			}
		});

		const html = await response.text();

		// Parse meta tags
		const getMetaContent = (property: string): string | null => {
			// Try og: tags
			const ogMatch = html.match(new RegExp(`<meta[^>]*property=["']og:${property}["'][^>]*content=["']([^"']*)["']`, 'i'));
			if (ogMatch) return ogMatch[1];

			// Try reverse order (content before property)
			const ogMatchReverse = html.match(new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*property=["']og:${property}["']`, 'i'));
			if (ogMatchReverse) return ogMatchReverse[1];

			// Try twitter: tags
			const twitterMatch = html.match(new RegExp(`<meta[^>]*name=["']twitter:${property}["'][^>]*content=["']([^"']*)["']`, 'i'));
			if (twitterMatch) return twitterMatch[1];

			return null;
		};

		// Get title from og:title or <title> tag
		let title = getMetaContent('title');
		if (!title) {
			const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
			title = titleMatch ? titleMatch[1] : null;
		}

		const image = getMetaContent('image');
		const description = getMetaContent('description');

		return json({
			title: title ? decodeHtmlEntities(title) : null,
			description: description ? decodeHtmlEntities(description) : null,
			image,
			url: targetUrl
		});
	} catch (error) {
		console.error('Error fetching preview:', error);
		return json({ error: 'Failed to fetch preview' }, { status: 500 });
	}
};
