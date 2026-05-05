import { useCallback, useEffect } from 'react';
import { useUpload } from '../context/UploadContext';
import { useWebSocket } from './useWebSocket';

const USER_ID = '550e8400-e29b-41d4-a716-446655440000';

export function useImageUpload() {
  const { updateStatus } = useUpload();

  const handleStatusUpdate = useCallback(
    (data) => {
      updateStatus(data.imageId, data.status, data.reason);
    },
    [updateStatus]
  );

  useWebSocket(USER_ID, handleStatusUpdate);
}