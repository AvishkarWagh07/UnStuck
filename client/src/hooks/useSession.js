import { useCallback, useEffect, useState } from 'react';
import api from '../services/api.js';

// all the network stuff for the session screen lives here
export default function useSession(sessionId) {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // the server notice rides inside the state, so keep it there
  const applyPayload = useCallback((payload) => {
    if (payload && payload.state) {
      setState(payload.state);
    }
  }, []);

  const load = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/sessions/' + sessionId);
      setState(res.data.state);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    load();
  }, [load]);

  // wraps an action with the busy + error handling
  const run = useCallback(async (fn) => {
    setBusy(true);
    setError('');
    try {
      return await fn();
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setBusy(false);
    }
  }, []);

  const sendOutcome = useCallback(
    (outcomeKey, notes, durationSeconds) =>
      run(async () => {
        const res = await api.post('/sessions/' + sessionId + '/attempts', {
          outcomeKey,
          notes,
          durationSeconds
        });
        applyPayload(res.data);
        return res.data;
      }),
    [sessionId, run, applyPayload]
  );

  const goBack = useCallback(
    () =>
      run(async () => {
        const res = await api.post('/sessions/' + sessionId + '/back');
        applyPayload(res.data);
        return res.data;
      }),
    [sessionId, run, applyPayload]
  );

  const pause = useCallback(
    () =>
      run(async () => {
        const res = await api.post('/sessions/' + sessionId + '/pause');
        applyPayload(res.data);
        return res.data;
      }),
    [sessionId, run, applyPayload]
  );

  const resume = useCallback(
    () =>
      run(async () => {
        const res = await api.post('/sessions/' + sessionId + '/resume');
        applyPayload(res.data);
        return res.data;
      }),
    [sessionId, run, applyPayload]
  );

  const abandon = useCallback(
    () =>
      run(async () => {
        const res = await api.post('/sessions/' + sessionId + '/abandon');
        applyPayload(res.data);
        return res.data;
      }),
    [sessionId, run, applyPayload]
  );

  const confirm = useCallback(
    (resolved) =>
      run(async () => {
        const res = await api.post('/sessions/' + sessionId + '/resolve', { resolved });
        applyPayload(res.data);
        return res.data;
      }),
    [sessionId, run, applyPayload]
  );

  const sendFeedback = useCallback(
    (payload) =>
      run(async () => {
        const res = await api.post('/sessions/' + sessionId + '/feedback', payload);
        return res.data;
      }),
    [sessionId, run]
  );

  const explain = useCallback(
    (level) => run(async () => (await api.post('/assist/explain', { sessionId, level })).data),
    [sessionId, run]
  );

  const summarize = useCallback(
    () => run(async () => (await api.post('/assist/summarize', { sessionId })).data),
    [sessionId, run]
  );

  return {
    state,
    loading,
    busy,
    error,
    setError,
    reload: load,
    sendOutcome,
    goBack,
    pause,
    resume,
    abandon,
    confirm,
    sendFeedback,
    explain,
    summarize
  };
}
