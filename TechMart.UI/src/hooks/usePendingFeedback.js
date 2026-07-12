import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export const usePendingFeedback = () => {
  const { user } = useAuth();
  const [pendingItems, setPendingItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchPendingFeedback = async () => {
    if (!user) {
      setPendingItems([]);
      return;
    }
    setLoading(true);
    try {
      const response = await api.get('/chat/pending-feedback');
      setPendingItems(response.data);
    } catch (err) {
      console.error('Failed to fetch pending feedback items', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingFeedback();
  }, [user]);

  return {
    pendingItems,
    hasPending: pendingItems.length > 0,
    loading,
    refreshPending: fetchPendingFeedback
  };
};
