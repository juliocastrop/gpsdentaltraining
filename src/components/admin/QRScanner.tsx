import { useState, useRef, useEffect } from 'react';
import Button from '../ui/Button';

interface QRScannerProps {
  onScan: (data: string) => void;
  onError?: (error: string) => void;
  isProcessing?: boolean;
}

export default function QRScanner({ onScan, onError, isProcessing = false }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scanIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  async function startScanning() {
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsScanning(true);
        setHasPermission(true);

        // Start scanning frames
        scanIntervalRef.current = window.setInterval(scanFrame, 200);
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setHasPermission(false);
      const errorMessage = err instanceof Error ? err.message : 'Camera access denied';
      setError(errorMessage);
      onError?.(errorMessage);
    }
  }

  function stopScanning() {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }

    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }

    setIsScanning(false);
  }

  async function scanFrame() {
    if (!videoRef.current || !canvasRef.current || isProcessing) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    try {
      // Use BarcodeDetector API if available
      if ('BarcodeDetector' in window) {
        const barcodeDetector = new (window as unknown as { BarcodeDetector: new (opts: { formats: string[] }) => { detect: (source: HTMLCanvasElement) => Promise<Array<{ rawValue: string }>> } }).BarcodeDetector({
          formats: ['qr_code'],
        });

        const barcodes = await barcodeDetector.detect(canvas);

        if (barcodes.length > 0) {
          const qrData = barcodes[0].rawValue;
          stopScanning();
          onScan(qrData);
        }
      } else {
        // Fallback: Use jsQR library (would need to be imported)
        // For now, show manual entry option
        console.log('BarcodeDetector not supported, use manual entry');
      }
    } catch (err) {
      console.error('QR scanning error:', err);
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gps-navy-dark">QR Code Scanner</h3>
        <p className="text-sm text-gray-600">Point the camera at a ticket QR code</p>
      </div>

      <div className="relative aspect-video bg-gray-900">
        {!isScanning ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
            {hasPermission === false ? (
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <p className="text-white mb-4">Camera access denied</p>
                <p className="text-gray-400 text-sm mb-4">
                  Please allow camera access to scan QR codes
                </p>
                <Button onClick={startScanning} variant="primary">
                  Try Again
                </Button>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-16 h-16 bg-gps-navy/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <Button onClick={startScanning} variant="primary" size="lg">
                  Start Scanner
                </Button>
              </div>
            )}
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
            />
            {/* Scanning overlay */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 border-[40px] border-black/50" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-gps-gold" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-gps-gold" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-gps-gold" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-gps-gold" />
              </div>
              {isProcessing && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="text-white flex items-center gap-2">
                    <div className="spinner" />
                    <span>Processing...</span>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {isScanning && (
        <div className="p-4 border-t border-gray-200">
          <Button onClick={stopScanning} variant="outline" className="w-full">
            Stop Scanner
          </Button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border-t border-red-200">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}
