import { useState } from 'react';

export default function ShipmentForm({ onCreate }) {
  const [name, setName] = useState('');
  const [minimum, setMinimum] = useState('2');
  const [maximum, setMaximum] = useState('8');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async (event) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await onCreate({ name: name.trim(), min: Number(minimum), max: Number(maximum) });
      setName('');
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <form className="panel integration-form" onSubmit={submit}>
      <h2>Create shipment</h2>
      <label>Shipment name<input required maxLength={256} value={name} onChange={(e) => setName(e.target.value)} /></label>
      <label>Minimum temperature (°C)<input required type="number" step="any" min="-100" max="150" value={minimum} onChange={(e) => setMinimum(e.target.value)} /></label>
      <label>Maximum temperature (°C)<input required type="number" step="any" min="-100" max="150" value={maximum} onChange={(e) => setMaximum(e.target.value)} /></label>
      <button disabled={busy} type="submit">{busy ? 'Creating…' : 'Create shipment'}</button>
      {error && <p role="alert">{error}</p>}
    </form>
  );
}
