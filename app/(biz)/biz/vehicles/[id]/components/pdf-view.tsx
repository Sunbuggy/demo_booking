import React, { useState, useEffect, useRef } from 'react';
import {
  DownloadOutlined,
  RotateLeftOutlined,
  RotateRightOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  UndoOutlined
} from '@ant-design/icons';
import PSPDFKit from 'pspdfkit';

const onDownload = (pdfUrl: string) => {
  fetch(pdfUrl)
    .then((response) => response.blob())
    .then((blob) => {
      const url = URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'document.pdf';
      document.body.appendChild(link);
      link.click();
      URL.revokeObjectURL(url);
      link.remove();
    });
};

interface PdfViewProps {
  src: string;
  height: number;
  width: number;
}

const PdfView: React.FC<PdfViewProps> = ({ src, width, height }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isClient, setIsClient] = useState(false); // Flag to detect client-side rendering
  const containerRef = useRef<HTMLDivElement>(null);

  // Set `isClient` to true after component mounts on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || typeof window === 'undefined') return; // Ensure client-side rendering

    let instance: any = null;

    const loadPdf = async () => {
      try {
        instance = await PSPDFKit.load({
          container: containerRef.current!,
          document: src,
          baseUrl: `${window.location.origin}/`,
          initialViewState: new PSPDFKit.ViewState({ zoom: zoomLevel })
        });
        setIsLoaded(true);
      } catch (error) {
        console.error("Failed to load PDF:", error);
      }
    };

    loadPdf();

    return () => {
      if (instance) PSPDFKit.unload(containerRef.current!);
    };
  }, [isClient, src, zoomLevel]); // Depend on `isClient` to ensure client-only rendering

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.1, 3));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.1, 0.5));
  const handleRotateLeft = () => {
    if (containerRef.current) {
      containerRef.current.style.transform = `rotate(-90deg)`;
    }
  };
  const handleRotateRight = () => {
    if (containerRef.current) {
      containerRef.current.style.transform = `rotate(90deg)`;
    }
  };
  const handleReset = () => {
    setZoomLevel(1);
    if (containerRef.current) {
      containerRef.current.style.transform = `rotate(0deg)`;
    }
  };

  return (
    <div style={{ width, height }}>
      {!isLoaded && (
        <>
temp
        </>
     )}
      <div ref={containerRef} style={{ display: isLoaded ? 'block' : 'none', height, width }}>
      </div>
      {isLoaded && (
        <div className="toolbar-wrapper flex justify-center gap-2 mt-2">
          <DownloadOutlined onClick={() => onDownload(src)} />
          <RotateLeftOutlined onClick={handleRotateLeft} />
          <RotateRightOutlined onClick={handleRotateRight} />
          <ZoomOutOutlined disabled={zoomLevel <= 0.5} onClick={handleZoomOut} />
          <ZoomInOutlined disabled={zoomLevel >= 3} onClick={handleZoomIn} />
          <UndoOutlined onClick={handleReset} />
        </div>
      )}
    </div>
  );
};

export default PdfView;
