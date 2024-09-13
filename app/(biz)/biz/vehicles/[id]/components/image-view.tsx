import React, { useState, useEffect } from 'react';
import {
  DownloadOutlined,
  RotateLeftOutlined,
  RotateRightOutlined,
  SwapOutlined,
  UndoOutlined,
  ZoomInOutlined,
  ZoomOutOutlined
} from '@ant-design/icons';
import { Image, Space } from 'antd';
import { Skeleton } from '@/components/ui/skeleton';

const onDownload = (imgUrl: string) => {
  fetch(imgUrl)
    .then((response) => response.blob())
    .then((blob) => {
      const url = URL.createObjectURL(new Blob([blob]));
      const link = document.createElement<'a'>('a');
      link.href = url;
      link.download = 'image.png';
      document.body.appendChild(link);
      link.click();
      URL.revokeObjectURL(url);
      link.remove();
    });
};

interface ImageViewProps {
  src: string | undefined;
}

const ImageView: React.FC<ImageViewProps> = ({ src }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);
  return (
    <>
      {!isLoaded && (
        <Skeleton className="min-w-[385px] min-h-[201px] md:h-[448px]" />
      )}
      {isLoaded && (
        <Image
          width="100%"
          height="100%"
          src={src}
          fallback="/placeholder.webp"
          className="transition-opacity opacity-0 duration-[2s]"
          onLoad={(image) => {
            const imgElement =
              image.currentTarget.querySelector('img.ant-image-img');
            if (imgElement) {
              imgElement.classList.remove('opacity-0');
            }
          }}
          preview={{
            toolbarRender: (
              _,
              {
                image: { url },
                transform: { scale },
                actions: {
                  onFlipY,
                  onFlipX,
                  onRotateLeft,
                  onRotateRight,
                  onZoomOut,
                  onZoomIn,
                  onReset
                }
              }
            ) => (
              <Space size={12} className="toolbar-wrapper">
                <DownloadOutlined onClick={() => onDownload(url)} />
                <SwapOutlined rotate={90} onClick={onFlipY} />
                <SwapOutlined onClick={onFlipX} />
                <RotateLeftOutlined onClick={onRotateLeft} />
                <RotateRightOutlined onClick={onRotateRight} />
                <ZoomOutOutlined disabled={scale === 1} onClick={onZoomOut} />
                <ZoomInOutlined disabled={scale === 50} onClick={onZoomIn} />
                <UndoOutlined onClick={onReset} />
              </Space>
            )
          }}
        />
      )}
    </>
  );
};

export default ImageView;
