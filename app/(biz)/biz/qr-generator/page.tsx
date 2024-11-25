import QRGenerator from './components/QRGenerator';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-24">
      <h1 className="text-4xl font-bold mb-8">QR Code Generator</h1>
      <QRGenerator />
    </main>
  );
}
