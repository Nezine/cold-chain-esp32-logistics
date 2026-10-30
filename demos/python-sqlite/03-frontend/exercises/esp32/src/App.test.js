import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';
import DetailPanel from './components/DetailPanel';
import { getSeverity } from './domain/status';
import { createAlertSubject } from './domain/AlertObserver';
import { getShipments, createShipment, sendReading } from './services/shipmentService';
jest.mock('./services/shipmentService');
beforeEach(() => {
  jest.clearAllMocks();
  window.matchMedia = jest.fn().mockReturnValue({ matches: false });
  Object.defineProperty(window, 'crypto', {configurable:true, value:{randomUUID:jest.fn(() => 'test-uuid')}});
});

function sample(id, name) {
  return {id,name,min:2,max:8,deviceId:`sensor-${id}`,temperature:null,severity:'normal',
    connection:'loading',history:[],status:'planned',alerts:[]};
}

test('creating second shipment clears filter and selects it in details', async () => {
  let rows = [sample(1, 'Shipment A')];
  getShipments.mockImplementation(async () => [...rows]);
  createShipment.mockImplementation(async data => {
    const created = {...sample(rows.length + 1, data.name), deviceId:data.deviceId};
    rows = [...rows, created];
    return created;
  });
  render(<App />);
  fireEvent.click(await screen.findByRole('heading', {name:'Shipment A',level:3}));
  fireEvent.change(screen.getByPlaceholderText('Search shipment...'), {target:{value:'Shipment A'}});
  fireEvent.change(screen.getByLabelText('Tên chuyến'), {target:{value:'Shipment B'}});
  fireEvent.click(screen.getByRole('button', {name:/Tạo chuyến/}));
  await waitFor(() => expect(screen.getByLabelText('Chọn chuyến')).toHaveValue('2'));
  expect(screen.getByPlaceholderText('Search shipment...')).toHaveValue('');
  expect(screen.getByRole('heading', {name:'Shipment B',level:2})).toBeInTheDocument();
  expect(screen.getByRole('heading', {name:'Shipment A',level:3})).toBeInTheDocument();
  expect(screen.getByRole('heading', {name:'Shipment B',level:3})).toBeInTheDocument();
  // A third submission must remain possible, including a duplicate display name.
  fireEvent.click(screen.getByRole('button', {name:/Tạo chuyến/}));
  await waitFor(() => expect(screen.getByLabelText('Chọn chuyến')).toHaveValue('3'));
  expect(createShipment).toHaveBeenCalledTimes(2);
  expect(rows.map(s => s.id)).toEqual([1,2,3]);
});

test('dropdown and card selection target the same shipment for readings', async () => {
  const rows = [sample(1,'Shipment A'),sample(2,'Shipment B')];
  getShipments.mockResolvedValue(rows);
  sendReading.mockResolvedValue(rows[1]);
  render(<App />);
  fireEvent.click(await screen.findByRole('heading',{name:'Shipment B',level:3}));
  expect(screen.getByLabelText('Chọn chuyến')).toHaveValue('2');
  fireEvent.click(screen.getByRole('button',{name:'12°C',exact:true}));
  await waitFor(() => expect(sendReading).toHaveBeenCalledWith(expect.objectContaining({shipmentId:2,deviceId:'sensor-2',temperature:12})));
  await waitFor(() => expect(screen.getByLabelText('Chọn chuyến')).not.toBeDisabled());
  fireEvent.change(screen.getByLabelText('Chọn chuyến'), {target:{value:'1'}});
  expect(screen.getByRole('heading',{name:'Shipment A',level:2})).toBeInTheDocument();
});

test('loads an empty repository and exposes creation', async () => {
  getShipments.mockResolvedValue([]);
  render(<App />);
  expect(await screen.findByText(/Chưa có chuyến hàng/)).toBeInTheDocument();
  expect(screen.getByRole('button', {name:/Tạo chuyến/})).toBeInTheDocument();
});
test('shows API failure instead of mock data', async () => {
  getShipments.mockRejectedValue(new Error('offline'));
  render(<App />);
  expect(await screen.findByRole('alert')).toHaveTextContent('offline');
});
test.each([[0,'warning'],[2,'normal'],[8,'normal'],[9,'warning'],[10,'warning'],[12,'critical'],[-1,'critical']])('classifies %s as %s', (temperature, expected) => {
  expect(getSeverity({temperature,min:2,max:8})).toBe(expected);
});
test('observer unsubscribe removes listener', () => {
  const subject = createAlertSubject(); const listener = jest.fn();
  const unsubscribe = subject.subscribe(listener);
  subject.notify({id:1}); unsubscribe(); subject.notify({id:2});
  expect(listener).toHaveBeenCalledTimes(1);
});
test('response records action and note without inventing a temperature', async () => {
  const shipment = {id:1,name:'Demo',min:2,max:8,temperature:12,severity:'critical',connection:'ok',
    history:[12],status:'in_transit',alerts:[{id:3,severity:'critical',status:'open',opened:new Date().toISOString(),responses:[]}]};
  const onResolve = jest.fn().mockResolvedValue(undefined);
  render(<DetailPanel shipment={shipment} onResolve={onResolve} />);
  fireEvent.change(screen.getByLabelText('Ghi chú'), {target:{value:'Checked cooler'}});
  fireEvent.click(screen.getByRole('button', {name:'Ghi nhận xử lý'}));
  await waitFor(() => expect(onResolve).toHaveBeenCalledWith(shipment,
    {alertId:3,action:'moved_to_backup_cooler',note:'Checked cooler'}));
  expect(screen.getByRole('heading', {name:'12°C'})).toBeInTheDocument();
});
