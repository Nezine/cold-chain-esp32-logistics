"""A repeatable end-to-end demo; creates temporary data and closes its own server."""
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import threading
import urllib.request

from dev_api import make_server

ROOT = Path(__file__).resolve().parents[1]

def main():
    with tempfile.TemporaryDirectory(prefix='cold-chain-demo-') as directory:
        state = Path(directory)/'state.json'
        server = make_server(state, port=0)
        thread = threading.Thread(target=server.serve_forever,daemon=True)
        thread.start()
        base = f'http://127.0.0.1:{server.server_port}'
        def request(path, body=None):
            data = None if body is None else json.dumps(body).encode()
            req = urllib.request.Request(base+'/api/'+path,data=data,headers={'Content-Type':'application/json'})
            with urllib.request.urlopen(req,timeout=10) as response:
                return json.load(response)
        try:
            ship = request('shipments',{'name':'Lô hàng demo','min':2,'max':8})
            print(f'1. Created shipment #{ship["id"]}; waiting for readings.')
            subprocess.run([sys.executable,str(ROOT/'tools/sensor_bridge.py'),'--shipment-id',str(ship['id']),
                            '--session-id','demo-boot','--url',base+'/api/readings'],
                           input=(ROOT/'examples/firmware-demo.jsonl').read_text(),text=True,check=True,
                           stdout=subprocess.DEVNULL)
            ship = request('shipments')[0]
            assert ship['history'] == [5,9,12] and ship['severity'] == 'critical'
            alerts = request('alerts')
            assert [a['severity'] for a in alerts] == ['warning','critical']
            print('2. Firmware JSON -> HTTP -> C++: 5 C normal, 9 C warning, 12 C critical.')
            alert = alerts[-1]
            request(f'shipments/{ship["id"]}/responses',
                    {'alertId':alert['id'],'action':'moved_to_backup_cooler','note':'Chuyển sang thùng dự phòng'})
            print('3. Recorded dispatch response; measured temperature is still 12 C.')
        finally:
            server.shutdown();server.server_close();thread.join(timeout=2)
        # Restart the API with the same state; no in-memory data survives.
        restarted = make_server(state,port=0)
        worker = threading.Thread(target=restarted.serve_forever,daemon=True)
        worker.start()
        try:
            with urllib.request.urlopen(f'http://127.0.0.1:{restarted.server_port}/api/alerts') as response:
                persisted = json.load(response)
            assert persisted[-1]['responseStatus'] == 'responded'
            assert persisted[-1]['temperature'] == 12
            print('4. Restarted API: persisted response and original reading verified. DEMO PASS.')
        finally:
            restarted.shutdown();restarted.server_close();worker.join(timeout=2)

if __name__ == '__main__':
    main()
