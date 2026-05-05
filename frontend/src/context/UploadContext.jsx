import React, { createContext, useContext, useReducer, useCallback } from 'react';

const UploadContext = createContext();

const initialState = {
  images: [],           // { id, file, preview, serverId, status, rejectionReason }
  totalUploaded: 0,
  maxAllowed: 10,
  minRequired: 6,
  isUploading: false,
};

function uploadReducer(state, action) {
  switch (action.type) {
    case 'ADD_FILES': {
      const newFiles = action.payload.filter(
        (file) => state.images.length + 1 <= state.maxAllowed &&
        ['image/jpeg', 'image/png', 'image/heic', 'image/webp'].includes(file.type)
      );
      
      const newImages = newFiles.map((file) => ({
        id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        preview: URL.createObjectURL(file),
        serverId: null,
        status: 'pending',
        rejectionReason: null,
      }));

      return {
        ...state,
        images: [...state.images, ...newImages].slice(0, state.maxAllowed),
        totalUploaded: state.images.length + newImages.length,
      };
    }

    case 'REMOVE_IMAGE': {
      const filtered = state.images.filter((img) => img.id !== action.payload);
      return {
        ...state,
        images: filtered,
        totalUploaded: filtered.length,
      };
    }

    case 'UPLOAD_START':
      return { ...state, isUploading: true };

    case 'UPLOAD_SUCCESS': {
      const { localId, serverId } = action.payload;
      return {
        ...state,
        images: state.images.map((img) =>
          img.id === localId ? { ...img, serverId, status: 'processing' } : img
        ),
      };
    }

    case 'STATUS_UPDATE': {
      const { imageId, status, reason } = action.payload;
      return {
        ...state,
        images: state.images.map((img) =>
          img.serverId === imageId
            ? { ...img, status: status.toLowerCase(), rejectionReason: reason || null }
            : img
        ),
        isUploading: state.images.some((img) => img.status === 'processing'),
      };
    }

    case 'UPLOAD_COMPLETE':
      return { ...state, isUploading: false };

    default:
      return state;
  }
}

export function UploadProvider({ children }) {
  const [state, dispatch] = useReducer(uploadReducer, initialState);

  const addFiles = useCallback((files) => {
    dispatch({ type: 'ADD_FILES', payload: files });
  }, []);

  const removeImage = useCallback((id) => {
    dispatch({ type: 'REMOVE_IMAGE', payload: id });
  }, []);

  const startUpload = useCallback(() => {
    dispatch({ type: 'UPLOAD_START' });
  }, []);

  const uploadSuccess = useCallback((localId, serverId) => {
    dispatch({ type: 'UPLOAD_SUCCESS', payload: { localId, serverId } });
  }, []);

  const updateStatus = useCallback((imageId, status, reason) => {
    dispatch({ type: 'STATUS_UPDATE', payload: { imageId, status, reason } });
  }, []);

  const completeUpload = useCallback(() => {
    dispatch({ type: 'UPLOAD_COMPLETE' });
  }, []);

  const acceptedImages = state.images.filter((img) => img.status === 'accepted');
  const rejectedImages = state.images.filter((img) => img.status === 'rejected');

  return (
    <UploadContext.Provider
      value={{
        ...state,
        acceptedImages,
        rejectedImages,
        addFiles,
        removeImage,
        startUpload,
        uploadSuccess,
        updateStatus,
        completeUpload,
      }}
    >
      {children}
    </UploadContext.Provider>
  );
}

export function useUpload() {
  const context = useContext(UploadContext);
  if (!context) {
    throw new Error('useUpload must be used within UploadProvider');
  }
  return context;
}