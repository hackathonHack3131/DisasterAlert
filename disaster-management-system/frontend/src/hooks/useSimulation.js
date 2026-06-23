import { useState, useCallback } from 'react';
import { api } from '../lib/api';

export default function useSimulation() {
  const [loading, setLoading] = useState(false);
  const [activeSimulation, setActiveSimulation] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const triggerSimulation = useCallback(async (type, payload) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post(
        `/api/simulate/${type.toLowerCase()}`,
        payload
      );
      setActiveSimulation(res.data.event);
      setResult({
        affectedUsers: res.data.affectedUserCount,
        emailsSent: res.data.emailsSent,
        sheltersActivated: res.data.sheltersActivated,
        disasterId: res.data.id,
      });
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Simulation failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const resolveSimulation = useCallback(async (id) => {
    setLoading(true);
    try {
      await api.patch(`/api/simulate/resolve/${id}`);
      setActiveSimulation(null);
      setResult(null);
    } catch (err) {
      console.error('Failed to resolve simulation:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const getActive = useCallback(async () => {
    try {
      const res = await api.get('/api/simulate/active');
      if (res.data && res.data.length > 0) {
        setActiveSimulation(res.data[0]);
      } else {
        setActiveSimulation(null);
      }
      return res.data;
    } catch (err) {
      console.error('Failed to fetch active simulations:', err);
      return [];
    }
  }, []);

  return {
    loading,
    activeSimulation,
    result,
    error,
    triggerSimulation,
    resolveSimulation,
    getActive
  };
}
