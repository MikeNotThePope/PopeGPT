import { NextResponse } from 'next/server';

export async function GET() {
  const username = process.env.NEXT_PUBLIC_USERNAME || 'Pope';
  const firstLetter = username.charAt(0);

  // Generate SVG favicon for dark mode
  const svg = `<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <rect width="64" height="64" fill="#22d3ee" stroke="#ffffff" stroke-width="4"/>
  <text x="32" y="48" font-family="Arial, sans-serif" font-size="40" font-weight="900" text-anchor="middle" fill="#000000">${firstLetter}</text>
</svg>`;

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400, immutable',
    },
  });
}
