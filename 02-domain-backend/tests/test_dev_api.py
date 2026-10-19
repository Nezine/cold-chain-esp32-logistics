"""HTTP -> real C++ -> persistent state, plus the real firmware-format bridge."""
import importlib.util
import json
from pathlib import Path
import subprocess
import tempfile
import threading
import unittest
import urllib.error
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('dev_api', ROOT / 'tools/dev_api.py')
api = importlib.util.module_from_spec(spec)
spec.loader.exec_module(api)

class ApiTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.server = api.make_server(Path(self.temp.name)/'state.json', port=0)
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.url = f'http://127.0.0.1:{self.server.server_port}'
        self.addCleanup(self.stop)

    def stop(self):
        self.server.shutdown(); self.server.server_close(); self.thread.join(timeout=2)

    def request(self,path,body=None,status=200,raw=None,content_type='application/json'):
        request = urllib.request.Request(self.url+path,
                    data=raw if raw is not None else (None if body is None else json.dumps(body).encode()),
                    headers={'Content-Type':content_type})
        try:
            response = urllib.request.urlopen(request,timeout=10)
        except urllib.error.HTTPError as error:
            response = error
        with response:
            self.assertEqual(response.status,status)
            self.assertEqual(response.headers.get_content_type(),'application/json')
            return json.load(response)

    def test_end_to_end_firmware_bridge_and_dispatch(self):
        self.assertEqual(self.request('/api/health')['backend'],'cpp')
        self.request('/api/shipments',{'name':'Demo','min':2,'max':8},status=201)
        lines = 'ESP32 boot text\n' + '\n'.join(json.dumps(dict(device_id='device1',shipment_id='shipment1',sequence=i,
                 uptime_ms=i*2000,temperature=t,unit='C')) for i,t in enumerate([5,9,12]))+'\n'
        bridge = subprocess.run(['python3',str(ROOT/'tools/sensor_bridge.py'),'--shipment-id','1',
                    '--session-id','test-boot','--url',self.url+'/api/readings'],
                    input=lines,text=True,capture_output=True)
        self.assertEqual(bridge.returncode,0,bridge.stderr)
        ship = self.request('/api/shipments')[0]
        self.assertEqual(ship['history'],[5,9,12])
        self.assertEqual(ship['severity'],'critical')
        self.assertEqual(len(self.request('/api/shipments/1/readings')['readings']),3)
        alerts = self.request('/api/alerts')
        self.assertEqual(len(alerts),2)
        response = self.request('/api/shipments/1/responses',{'alertId':alerts[0]['id'],'action':'inspect','note':'Đã kiểm tra'})
        self.assertEqual(response['status'],'responded')
        self.request('/api/shipments/1/responses',{'alertId':alerts[0]['id'],'action':'inspect'},status=409)
        self.assertEqual(self.request('/api/shipments')[0]['temperature'],12)
        replay = subprocess.run(['python3',str(ROOT/'tools/sensor_bridge.py'),'--shipment-id','1',
                    '--session-id','test-boot','--url',self.url+'/api/readings'],
                    input=lines,text=True,capture_output=True)
        self.assertNotEqual(replay.returncode,0)
        self.assertEqual(len(self.request('/api/alerts')),2)

    def test_transport_validation(self):
        self.request('/api/shipments',raw=b'{broken',status=400)
        self.request('/api/shipments',raw=b'{}',content_type='text/plain',status=415)
        self.request('/api/shipments',raw=b'x'*65537,status=413)
        self.request('/api/shipments',raw=b'\xff',status=400)
        self.request('/api/missing',status=404)
        self.request('/api/shipments/999/readings',status=404)

if __name__ == '__main__':
    unittest.main()
