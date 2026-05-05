import React from 'react';
import { useUpload } from '../context/UploadContext';
import { uploadImages } from '../services/api';

const USER_ID = '550e8400-e29b-41d4-a716-446655440000'; // Demo user ID

export default function BottomBar() {
  const { images, minRequired, startUpload, uploadSuccess, completeUpload } = useUpload();

  const pendingImages = images.filter((img) => img.status === 'pending');
  const canContinue = images.length >= minRequired && pendingImages.length > 0;

  const handleContinue = async () => {
    if (!canContinue) return;

    startUpload();

    const filesToUpload = pendingImages.map((img) => img.file);

    try {
      const result = await uploadImages(filesToUpload, USER_ID);
      
      result.images.forEach((serverImg, index) => {
        const localImg = pendingImages[index];
        if (localImg && serverImg.imageId) {
          uploadSuccess(localImg.id, serverImg.imageId);
        }
      });
    } catch (error) {
      console.error('Upload failed:', error);
    }

    completeUpload();
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex w-full flex-col items-center justify-center border-t border-light-border bg-white py-4 shadow-lg">
      <button
        onClick={handleContinue}
        disabled={!canContinue}
        className={`flex w-80 items-center justify-center rounded-md px-8 py-3 text-base font-semibold text-white transition-all ${
          canContinue
            ? 'bg-custom-orange hover:bg-orange-600 active:scale-95'
            : 'cursor-not-allowed bg-gray-300'
        }`}
      >
        Continue
      </button>
    </div>
  );
}