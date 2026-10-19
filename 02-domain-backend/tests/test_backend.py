"""C++ backend integration tests, including actual disk persistence and concurrency."""
from concurrent.futures import ThreadPoolExecutor
import json
from pathlib import Path
import subprocess
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
BINARY = ROOT / 'build/backend'

class BackendTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.state = Path(self.temp.name) / 'state.json'

    def call(self, command, body=None, shipment_id=None, status=200):
        args = [str(BINARY), str(self.state), command]
        if shipment_id is not None:
            args.append(str(shipment_id))
        result = subprocess.run(args, input='' if body is None else json.dumps(body), text=True, capture_output=True)
        self.assertEqual(result.returncode, 0 if status < 400 else 1, result.stderr + result.stdout)
        data = json.loads(result.stdout)
        self.assertEqual(data['status'], status, data)
        return data['body']

    def create(self, **changes):
        return self.call('create-shipment', {'name': 'Lô hàng mẫu', 'min': 2, 'max': 8, **changes}, status=201)

    def reading(self, number, temperature, **changes):
        return {'shipmentId': 1, 'temperature': temperature, 'unit': 'C', 'deviceId': 'device1',
                'readingId': f'device1:boot1:{number}', 'time': f'2026-10-19T10:00:{number:02d}Z', **changes}

    def test_create_and_reload_in_separate_process(self):
        ship = self.create()
        self.assertEqual(ship['id'], 1)
        self.assertIsNone(ship['temperature'])
        self.assertEqual(ship['connection'], 'loading')
        self.assertEqual(self.call('shipments'), [ship])
        self.assertEqual(self.create(name='Next')['id'], 2)

    def test_boundaries_observer_and_recovery_keep_history(self):
        self.create()
        values = [2, 8, 8.1, 10, 10.1, 0, -0.1, 5]
        severities = ['normal', 'normal', 'warning', 'warning', 'critical', 'warning', 'critical', 'normal']
        for i, (temperature, severity) in enumerate(zip(values, severities)):
            ship = self.call('add-reading', self.reading(i, temperature), status=201)
            self.assertEqual(ship['severity'], severity)
        alerts = self.call('alerts')
        self.assertEqual(len(alerts), 5)
        self.assertTrue(all(a['responseStatus'] == 'pending' for a in alerts))
        self.assertEqual(self.call('shipments')[0]['history'], values[-6:])
        self.assertEqual(len(self.call('readings', shipment_id=1)['readings']), 8)

    def test_response_persists_without_modifying_measurement(self):
        self.create()
        self.call('add-reading', self.reading(0, 12), status=201)
        before = self.call('shipments')
        response = self.call('respond', {'alertId': 1, 'action': 'inspect', 'note': 'Thùng "A"\nĐã kiểm tra'}, shipment_id=1)
        self.assertEqual(response['status'], 'responded')
        self.assertEqual(self.call('alerts')[0]['response']['note'], 'Thùng "A"\nĐã kiểm tra')
        self.assertEqual(self.call('shipments'), before)
        self.call('respond', {'alertId': 1, 'action': 'inspect'}, shipment_id=1, status=409)

    def test_rejected_mutations_leave_disk_identical(self):
        self.create()
        self.call('add-reading', self.reading(1, 9), status=201)
        before = self.state.read_bytes()
        self.call('add-reading', self.reading(1, 9), status=409)
        self.call('add-reading', self.reading(0, 5), status=409)
        self.call('add-reading', self.reading(2, 5, unit='F'), status=400)
        self.call('add-reading', self.reading(2, True), status=400)
        self.call('add-reading', self.reading(2, 5, shipmentId=999), status=404)
        self.call('add-reading', self.reading(2, 5, time='2026-02-30T10:00:00Z'), status=400)
        self.call('add-reading', self.reading(2, 5, time='2026-0T-19T10:00:00Z'), status=400)
        self.call('add-reading', self.reading(2, 5, deviceId=''), status=400)
        self.assertEqual(self.state.read_bytes(), before)

    def test_input_validation(self):
        for body in [{'name':'', 'min':2,'max':8}, {'name':'A','min':8,'max':2},
                     {'name':'A','min':2,'max':8,'criticalMargin':0},
                     {'name':'A','min':'2','max':8}, {'name':'A','min':2},
                     {'name':'A','min':2,'max':8,'criticalMargin':True},
                     {'name':'A','min':2,'max':8,'criticalMargin':None}]:
            self.call('create-shipment', body, status=400)
        self.assertFalse(self.state.exists())
        self.call('readings', shipment_id=999, status=404)

    def test_response_cannot_target_other_shipment_or_normal_reading(self):
        self.create(); self.create(name='Other')
        self.call('add-reading', self.reading(0, 12), status=201)
        self.call('respond', {'alertId':1,'action':'inspect'}, shipment_id=2, status=404)
        self.call('respond', {'alertId':999,'action':'inspect'}, shipment_id=1, status=404)
        self.call('respond', {'alertId':1,'action':' '}, shipment_id=1, status=400)
        self.call('respond', {'alertId':1,'action':'inspect','note':42}, shipment_id=1, status=400)
        self.call('respond', {'alertId':1,'action':'inspect','note':None}, shipment_id=1, status=400)

    def test_custom_shipment_range(self):
        self.create(min=-20, max=-10, criticalMargin=3)
        self.assertEqual(self.call('add-reading', self.reading(0, -12), status=201)['severity'], 'normal')
        self.assertEqual(self.call('add-reading', self.reading(1, -8), status=201)['severity'], 'warning')
        self.assertEqual(self.call('add-reading', self.reading(2, -6), status=201)['severity'], 'critical')

    def test_parallel_creates_do_not_lose_records(self):
        def create(i):
            result = subprocess.run([str(BINARY),str(self.state),'create-shipment'],
                                    input=json.dumps({'name':f'Ship {i}','min':2,'max':8}),
                                    text=True,capture_output=True,check=True)
            return json.loads(result.stdout)['body']['id']
        with ThreadPoolExecutor(max_workers=6) as pool:
            ids = list(pool.map(create, range(12)))
        self.assertEqual(sorted(ids), list(range(1,13)))
        self.assertEqual(len(self.call('shipments')),12)

    def test_parallel_responses_accept_only_one(self):
        self.create(); self.call('add-reading', self.reading(0,12), status=201)
        def respond(_):
            result = subprocess.run([str(BINARY),str(self.state),'respond','1'],
                                    input='{"alertId":1,"action":"inspect"}',text=True,capture_output=True)
            return json.loads(result.stdout)['status']
        with ThreadPoolExecutor(max_workers=4) as pool:
            statuses = list(pool.map(respond, range(4)))
        self.assertEqual(sorted(statuses),[200,409,409,409])

    def test_corruption_is_reported_without_overwrite(self):
        self.state.write_text('{broken')
        before = self.state.read_bytes()
        self.call('create-shipment', {'name':'A','min':2,'max':8}, status=500)
        self.assertEqual(self.state.read_bytes(),before)
        self.state.write_text('{"version":2,"shipments":[],"readings":[],"alerts":[],"responses":[]}')
        self.call('shipments', status=500)

    def test_malformed_or_oversized_json(self):
        for raw,status in [('{oops',400),('[]',400),('{"name":NaN}',400),('{} {}',400),('x'*65537,413)]:
            result = subprocess.run([str(BINARY),str(self.state),'create-shipment'],input=raw,text=True,capture_output=True)
            self.assertEqual(json.loads(result.stdout)['status'],status)
            self.assertEqual(result.returncode,1)

if __name__ == '__main__':
    unittest.main()
