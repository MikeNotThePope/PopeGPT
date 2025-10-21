import { GET } from '../route';

describe('/api/favicon', () => {
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

  it('should generate favicon with default username "Pope"', async () => {
    delete process.env.NEXT_PUBLIC_USERNAME;

    const response = await GET();
    const svg = await response.text();

    expect(svg).toContain('<svg');
    expect(svg).toContain('width="64"');
    expect(svg).toContain('height="64"');
    expect(svg).toContain('>P</text>'); // First letter of "Pope"
  });

  it('should generate favicon with custom username', async () => {
    process.env.NEXT_PUBLIC_USERNAME = 'Mike';

    const response = await GET();
    const svg = await response.text();

    expect(svg).toContain('>M</text>'); // First letter of "Mike"
  });

  it('should use light mode colors', async () => {
    const response = await GET();
    const svg = await response.text();

    // Yellow background for light mode
    expect(svg).toContain('fill="#facc15"');
    // Black stroke
    expect(svg).toContain('stroke="#000000"');
    // Black text
    expect(svg).toContain('fill="#000000"');
  });

  it('should preserve case of username first letter', async () => {
    process.env.NEXT_PUBLIC_USERNAME = 'mike';

    const response = await GET();
    const svg = await response.text();

    expect(svg).toContain('>m</text>'); // lowercase 'm'
  });

  it('should handle single character username', async () => {
    process.env.NEXT_PUBLIC_USERNAME = 'X';

    const response = await GET();
    const svg = await response.text();

    expect(svg).toContain('>X</text>');
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
});
