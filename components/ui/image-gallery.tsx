'use client';
import React, { useState } from 'react';
import ImageGallery from 'react-image-gallery';
import { type ReactImageGalleryItem } from 'react-image-gallery';

const ImageGalleryComponent = ({
  items
}: {
  items: ReactImageGalleryItem[];
}) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | undefined>(
    undefined
  );

  const openModal = (image: string) => {
    setSelectedImage(image);
    setShowModal(true);
  };

  const closeModal = () => {
    setSelectedImage(undefined);
    setShowModal(false);
  };

  return (
    <div>
      <ImageGallery
        items={items}
        showPlayButton={false}
        onClick={(event) => openModal((event.target as HTMLImageElement).src)}
      />

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={closeModal}>
              &times;
            </span>
            <img src={selectedImage} alt="Selected Image" />
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageGalleryComponent;
