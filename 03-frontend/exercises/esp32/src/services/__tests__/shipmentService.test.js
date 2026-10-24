import { getShipments, recordResponse } from '../shipmentService';

beforeEach(() => { global.fetch = jest.fn(); });
afterEach(() => { delete global.fetch; });

test('posts response to the selected shipment with its alert ID', async () => {
  fetch.mockResolvedValue({ ok: true, json: async () => ({ status: 'responded' }) });
  const body = { alertId: 7, action: 'inspect', note: 'Checked' };
  await recordResponse(2, body);
  expect(fetch).toHaveBeenCalledWith('/api/shipments/2/responses', expect.objectContaining({
    method: 'POST', body: JSON.stringify(body),
  }));
});

test('propagates backend validation messages rather than returning mock shipments', async () => {
  fetch.mockResolvedValue({ ok: false, status: 409, json: async () => ({ error: 'Duplicate response' }) });
  await expect(getShipments()).rejects.toThrow('Duplicate response');
});
