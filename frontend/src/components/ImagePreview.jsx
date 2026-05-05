import React from 'react';
import { useUpload } from '../context/UploadContext';

export default function ImagePreview({ image }) {
  const { removeImage } = useUpload();

  const getStatusIcon = () => {
    if (image.status === 'accepted') {
      return (
        <div className="absolute right-2 top-2 rounded-full bg-green-500 p-1">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
      );
    }
    if (image.status === 'rejected') {
      return (
        <div className="absolute right-2 top-2 rounded-full bg-red-500 p-1">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </div>
      );
    }
    if (image.status === 'processing') {
      return (
        <div className="absolute right-2 top-2 rounded-full bg-yellow-500 p-1">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" className="animate-spin">
            <circle cx="12" cy="12" r="10" strokeDasharray="30 70" />
          </svg>
        </div>
      );
    }
    return null;
  };

  const getBorderColor = () => {
    switch (image.status) {
      case 'accepted': return 'border-green-500';
      case 'rejected': return 'border-red-500';
      case 'processing': return 'border-yellow-500';
      default: return 'border-gray-200';
    }
  };

  return (
    <div className={`relative aspect-[2048/2560] w-full rounded-lg border-2 ${getBorderColor()} overflow-hidden shadow-md`}>
      <img
        src={image.preview}
        alt="uploaded"
        className="h-full w-full object-cover"
      />
      {getStatusIcon()}
      <button
        onClick={() => removeImage(image.id)}
        className="absolute left-2 top-2 rounded-full bg-white p-1.5 shadow-md hover:bg-gray-100"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
        </svg>
      </button>
      {image.rejectionReason && (
        <div className="absolute bottom-0 left-0 right-0 bg-red-500 px-2 py-1 text-xs text-white">
          {image.rejectionReason}
        </div>
      )}
    </div>
  );
}