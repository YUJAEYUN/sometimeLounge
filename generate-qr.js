const QRCode = require('qrcode')
const fs = require('fs')

const url = 'https://sometime-lounge.vercel.app'

// Generate QR code as PNG
QRCode.toFile('qr-code.png', url, {
  color: {
    dark: '#000000',  // Black dots
    light: '#FFFFFF' // White background
  },
  width: 512,
  margin: 2
}, function (err) {
  if (err) throw err
  console.log('QR code saved as qr-code.png')
})

// Generate QR code as SVG
QRCode.toString(url, {
  type: 'svg',
  color: {
    dark: '#000000',
    light: '#FFFFFF'
  },
  width: 512,
  margin: 2
}, function (err, string) {
  if (err) throw err
  fs.writeFileSync('qr-code.svg', string)
  console.log('QR code saved as qr-code.svg')
})

// Generate QR code as terminal output
QRCode.toString(url, {type:'terminal'}, function (err, url) {
  if (err) throw err
  console.log('\nQR Code for SOMETIME LOUNGE:')
  console.log(url)
})
