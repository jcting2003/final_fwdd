const HOST = process.env.QR_HOST || 'https://457a-2001-e68-5419-664f-4903-4ca3-151a-d5ff.ngrok-free.app.ngrok-free.app';  
const PORT = process.env.QR_PORT || 3000;
const tileCount = 22;

for (let tileId = 1; tileId <= tileCount; tileId++) {
  const url = `https://${HOST}:${PORT}/scan/tile/${tileId}`;
  await QRCode.toFile(`tile-${tileId}.png`, url);
  console.log(`QR for tile ${tileId}: ${url}`);
}
