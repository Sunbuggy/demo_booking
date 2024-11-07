import React, { useState, useEffect } from 'react';
import { pdfjs, Document, Page } from 'react-pdf';
import { Button } from 'antd';
import {
  DownloadOutlined,
  RotateLeftOutlined,
  RotateRightOutlined,
  ZoomInOutlined,
  ZoomOutOutlined
} from '@ant-design/icons';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PdfViewProps {
  src: string;
  width: number;
  height: number;
}

const PdfView: React.FC<PdfViewProps> = ({ src, width, height }) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [rotation, setRotation] = useState(0);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const zoomIn = () => setScale((prevScale) => Math.min(prevScale + 0.1, 2));
  const zoomOut = () => setScale((prevScale) => Math.max(prevScale - 0.1, 0.5));
  const rotateLeft = () => setRotation((prevRotation) => prevRotation - 90);
  const rotateRight = () => setRotation((prevRotation) => prevRotation + 90);

  return (
    <div className="flex flex-col items-center">
      <Document file={src} onLoadSuccess={onDocumentLoadSuccess}>
        <Page
          pageNumber={pageNumber}
          width={width * scale}
          height={height * scale}
          rotate={rotation}
        />
      </Document>
      <div className="flex gap-2 mt-2">
        <Button onClick={() => setPageNumber((prev) => Math.max(prev - 1, 1))} disabled={pageNumber <= 1}>
          Previous
        </Button>
        <Button onClick={() => setPageNumber((prev) => Math.min(prev + 1, numPages ?? 1))} disabled={pageNumber >= (numPages ?? 1)}>
          Next
        </Button>
        <ZoomInOutlined onClick={zoomIn} />
        <ZoomOutOutlined onClick={zoomOut} />
        <RotateLeftOutlined onClick={rotateLeft} />
        <RotateRightOutlined onClick={rotateRight} />
        <DownloadOutlined onClick={() => window.open(src)} />
      </div>
      <p>Page {pageNumber} of {numPages}</p>
    </div>
  );
};

export default PdfView;
