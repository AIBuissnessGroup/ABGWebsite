import QRCode from 'qrcode';

// Renders a pass's check-in QR as a PNG so emails can load it by URL
// (Gmail strips inline data: images). The token itself is already in the attendee's email.
export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get('t') || '';
  if (!/^[A-Za-z0-9-]{8,64}$/.test(token)) {
    return new Response('Invalid code', { status: 400 });
  }

  const png = await QRCode.toBuffer(token, {
    width: 480,
    margin: 1,
    color: { dark: '#00274c', light: '#ffffff' },
  });

  return new Response(new Uint8Array(png), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
