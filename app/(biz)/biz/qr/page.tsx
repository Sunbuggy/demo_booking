import QRCodeGenerator from './components/QRCodeGenerator';

export default function QRPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">QR Code Generator</h1>
      <QRCodeGenerator />
    </main>
  );
}
