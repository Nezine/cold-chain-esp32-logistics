"""Chromium smoke test against a running CRA dev server and an isolated real C++ backend.
Requires Playwright and installed Chromium; no request interception or mocked responses.
Starts/stops only its own backend on the port configured in the CRA proxy (8080).
"""
import argparse
import importlib.util
import json
import re
from pathlib import Path
import tempfile
import threading
import urllib.request

from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[4]
spec = importlib.util.spec_from_file_location('dev_api', ROOT/'02-domain-backend/tools/dev_api.py')
api = importlib.util.module_from_spec(spec)
spec.loader.exec_module(api)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--frontend-url', default='http://127.0.0.1:3000')
    parser.add_argument('--chromium', default='/usr/bin/chromium')
    args = parser.parse_args()
    with tempfile.TemporaryDirectory(prefix='cold-chain-ui-') as directory:
        state = Path(directory)/'state.json'
        server = None
        worker = None
        def start():
            nonlocal server, worker
            server = api.make_server(state, port=8080)
            worker = threading.Thread(target=server.serve_forever, daemon=True)
            worker.start()
        def stop():
            nonlocal server
            if server:
                server.shutdown(); server.server_close(); worker.join(timeout=2)
                server = None
        def request(path, body=None):
            req = urllib.request.Request('http://127.0.0.1:8080/api/'+path,
                    data=None if body is None else json.dumps(body).encode(),
                    headers={'Content-Type':'application/json'})
            with urllib.request.urlopen(req, timeout=10) as response:
                return json.load(response)
        try:
            start()  # Fails if somebody else's backend owns this port; never stops it.
            with sync_playwright() as p:
                browser = p.chromium.launch(executable_path=args.chromium, headless=True,
                                            args=['--no-sandbox','--disable-dev-shm-usage'])
                page = browser.new_page()
                errors = []
                page.on('pageerror', lambda error: errors.append(str(error)))
                # The current UI monitors shipments; creation is an API operation.
                created = request('shipments', {'name':'Browser shipment','min':2,'max':8})
                shipment_id = created['id']
                page.goto(args.frontend_url)
                expect(page.get_by_role('heading', name='Browser shipment', exact=True)).to_be_visible(timeout=30000)
                page.get_by_role('heading', name='Browser shipment', exact=True).click()
                expect(page.get_by_text('No data yet')).to_be_visible()
                for i, (temperature, severity) in enumerate([(5,'NORMAL'),(9,'WARNING'),(12,'CRITICAL')]):
                    request('readings', {'shipmentId':shipment_id,'deviceId':'device1',
                            'readingId':f'ui:boot:{i}','temperature':temperature,'unit':'C',
                            'time':f'2026-10-24T10:00:0{i}Z'})
                    expect(page.locator('#detailTemp')).to_have_text(f'{temperature}°C',timeout=15000)
                    expect(page.locator('.status-badge')).to_have_text(severity)
                alerts = request('alerts')
                page.get_by_label('Alert',exact=True).select_option(str(alerts[-1]['id']))
                page.get_by_label('Action taken',exact=True).select_option('moved_to_backup_cooler')
                page.get_by_label('Note (optional)').fill('Đã chuyển sang thùng dự phòng')
                page.get_by_role('button',name='Record response',exact=True).click()
                expect(page.get_by_text(re.compile(r'Response recorded for alert #'))).to_be_visible()
                expect(page.get_by_text('RESPONDED',exact=True)).to_be_visible()
                # The old local simulator ticked after four seconds. Wait across several polls.
                page.wait_for_timeout(4500)
                expect(page.locator('#detailTemp')).to_have_text('12°C')
                assert len(request('shipments/1/readings')['readings']) == 3
                stop()
                expect(page.get_by_role('status').filter(has_text='Connection lost')).to_be_visible(timeout=15000)
                expect(page.locator('#detailTemp')).to_have_text('12°C')
                start()
                expect(page.get_by_role('status').filter(has_text='Connection lost')).to_have_count(0,timeout=15000)
                page.reload()
                expect(page.get_by_text('RESPONDED',exact=True)).to_be_visible(timeout=15000)
                assert request('alerts')[-1]['responseStatus'] == 'responded'
                assert request('shipments')[0]['temperature'] == 12
                assert not errors, errors
                browser.close()
            print('PASS: API create -> UI loading -> 5/9/12 C -> selected alert response -> no simulated drift -> outage -> restart/reload persistence.')
        finally:
            stop()

if __name__ == '__main__':
    main()
