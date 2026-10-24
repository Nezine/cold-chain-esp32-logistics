import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import App from './App';
import { getShipments, getAlerts, createShipment, recordResponse } from './services/shipmentService';

jest.mock('./services/shipmentService');
let shipments;
let alerts;
const shipment = { id: 1, name: 'Shipment A', min: 2, max: 8, temperature: 9,
  history: [5, 9], connection: 'ok', severity: 'warning' };
const alert = { id: 7, shipmentId: 1, readingId: 'device:boot:1', temperature: 9,
  severity: 'warning', time: '2026-10-24T10:00:00Z', responseStatus: 'pending' };

beforeEach(() => {
  jest.clearAllMocks();
  window.localStorage.setItem('coldchain-theme', 'dark');
  shipments = [{ ...shipment }];
  alerts = [{ ...alert }];
  getShipments.mockImplementation(async () => shipments);
  getAlerts.mockImplementation(async () => alerts);
});

async function showDashboard() {
  render(<App />);
  await screen.findByRole('heading', { name: 'Create shipment' });
}

test('shows backend warning instead of treating 9 C as critical', async () => {
  await showDashboard();
  expect(screen.getAllByText('WARNING').length).toBeGreaterThan(0);
  expect(screen.queryByText('CRITICAL')).not.toBeInTheDocument();
  expect(screen.getByText('1 shipments tracked')).toBeInTheDocument();
});

test('creates a shipment through the API and selects it', async () => {
  shipments = []; alerts = [];
  createShipment.mockImplementation(async (input) => {
    const created = { ...input, id: 2, connection: 'loading', severity: 'normal', temperature: null, history: [] };
    shipments = [created];
    return created;
  });
  await showDashboard();
  expect(screen.getByText('No shipments. Create one to get started.')).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Shipment name'), { target: { value: 'New shipment' } });
  fireEvent.click(screen.getByRole('button', { name: 'Create shipment' }));
  await waitFor(() => expect(createShipment).toHaveBeenCalledWith({ name: 'New shipment', min: 2, max: 8 }));
  await screen.findByText('No data yet');
  expect(screen.getByText('No pending alerts for this shipment.')).toBeInTheDocument();
});

test('records the chosen alert and preserves the measured temperature', async () => {
  recordResponse.mockImplementation(async (id, body) => {
    alerts = [{ ...alert, responseStatus: 'responded', response: body }];
    return { status: 'responded' };
  });
  await showDashboard();
  fireEvent.click(screen.getByRole('heading', { name: 'Shipment A' }));
  fireEvent.change(screen.getByLabelText('Response note'), { target: { value: 'Đã kiểm tra' } });
  fireEvent.click(screen.getByRole('button', { name: 'Record response' }));
  await screen.findByText('Response recorded. Measured temperature is unchanged.');
  expect(recordResponse).toHaveBeenCalledWith(1, { alertId: 7, action: 'inspected_shipment', note: 'Đã kiểm tra' });
  expect(document.getElementById('detailTemp')).toHaveTextContent('9°C');
  expect(screen.getByText('Responded')).toBeInTheDocument();
});

test('allows selecting a specific alert when a shipment has multiple pending alerts', async () => {
  alerts = [alert, { ...alert, id: 8, temperature: 12, severity: 'critical' }];
  recordResponse.mockRejectedValue(new Error('Alert already has a response'));
  await showDashboard();
  fireEvent.click(screen.getByRole('heading', { name: 'Shipment A' }));
  fireEvent.change(screen.getByLabelText('Alert'), { target: { value: '8' } });
  fireEvent.click(screen.getByRole('button', { name: 'Record response' }));
  await screen.findByText('Alert already has a response');
  expect(recordResponse.mock.calls[0][1].alertId).toBe(8);
  expect(screen.getByRole('button', { name: 'Record response' })).toBeEnabled();
});

test('shows a backend failure and retries without falling back to mock data', async () => {
  getShipments.mockRejectedValueOnce(new Error('Backend offline'));
  render(<App />);
  await screen.findByRole('alert');
  expect(screen.queryByRole('heading', { name: 'Shipment A' })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Retry connection' }));
  await screen.findByRole('heading', { name: 'Create shipment' });
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

test('polls new backend measurements and retains data on a subsequent outage', async () => {
  jest.useFakeTimers();
  try {
    await act(async () => { render(<App />); });
    shipments = [{ ...shipment, temperature: 5, severity: 'normal' }];
    await act(async () => { jest.advanceTimersByTime(2000); });
    expect(screen.getAllByText('5°C').length).toBeGreaterThan(0);
    getShipments.mockRejectedValueOnce(new Error('Backend offline'));
    await act(async () => { jest.advanceTimersByTime(2000); });
    expect(screen.getByRole('alert')).toHaveTextContent('Showing last received data');
    expect(screen.getAllByText('5°C').length).toBeGreaterThan(0);
  } finally {
    jest.useRealTimers();
  }
});
