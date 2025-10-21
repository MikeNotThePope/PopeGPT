import { GET } from '../route';

describe('/api/favicon-dark', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should return SVG with correct content type', async () => {
    const response = await GET();

    expect(response.headers.get('Content-Type')).toBe('image/svg+xml');
  });

  it('should return SVG with cache control headers', async () => {
    const response = await GET();

    expect(response.headers.get('Cache-Control')).toBe(
      'public, max-age=86400, immutable'
    );
  });

  it('should generate dark favicon with default username "Pope"', async () => {
    delete process.env.NEXT_PUBLIC_USERNAME;

    const response = await GET();
    const svg = await response.text();

    expect(svg).toContain('<svg');
    expect(svg).toContain('width="64"');
    expect(svg).toContain('height="64"');
    expect(svg).toContain('>P</text>'); // First letter of "Pope"
  });

  it('should generate dark favicon with custom username', async () => {
    process.env.NEXT_PUBLIC_USERNAME = 'Sarah';

    const response = await GET();
    const svg = await response.text();

    expect(svg).toContain('>S</text>'); // First letter of "Sarah"
  });

  it('should use dark mode colors', async () => {
    const response = await GET();
    const svg = await response.text();

    // Cyan background for dark mode
    expect(svg).toContain('fill="#22d3ee"');
    // White stroke
    expect(svg).toContain('stroke="#ffffff"');
    // Black text (contrast against cyan)
    expect(svg).toContain('fill="#000000"');
  });

  it('should preserve case of username first letter', async () => {
    process.env.NEXT_PUBLIC_USERNAME = 'sarah';

    const response = await GET();
    const svg = await response.text();

    expect(svg).toContain('>s</text>'); // lowercase 's'
  });

  it('should handle single character username', async () => {
    process.env.NEXT_PUBLIC_USERNAME = 'Y';

    const response = await GET();
    const svg = await response.text();

    expect(svg).toContain('>Y</text>');
  });

  it('should have correct SVG structure', async () => {
    const response = await GET();
    const svg = await response.text();

    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(svg).toContain('viewBox="0 0 64 64"');
    expect(svg).toContain('<rect');
    expect(svg).toContain('<text');
    expect(svg).toContain('text-anchor="middle"');
    expect(svg).toContain('font-weight="900"');
  });

  it('should differ from light mode favicon in colors', async () => {
    process.env.NEXT_PUBLIC_USERNAME = 'Test';

    const response = await GET();
    const svg = await response.text();

    // Should NOT have light mode yellow
    expect(svg).not.toContain('fill="#facc15"');
    // Should have dark mode cyan
    expect(svg).toContain('fill="#22d3ee"');
    // Should have white stroke (not black)
    expect(svg).toContain('stroke="#ffffff"');
  });
});
