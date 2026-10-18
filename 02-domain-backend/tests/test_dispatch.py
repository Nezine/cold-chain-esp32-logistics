"""Integration checks: real receiver -> alert log -> dispatch CLI -> persisted response."""
import json
from pathlib import Path
import subprocess
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[2]
CLI = ROOT / '02-domain-backend/build/dispatch'
RECEIVER = ROOT / '04-esp32-sensor/tools/build/serial_readings'

class DispatchTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.alerts = Path(self.temp.name) / 'alerts.jsonl'
        self.responses = Path(self.temp.name) / 'responses.jsonl'
        readings = [dict(device_id='device1', shipment_id='shipment1', sequence=i,
                         uptime_ms=i*2000, temperature=t, unit='C')
                    for i, t in enumerate([5, 9, 12])]
        subprocess.run([str(RECEIVER), str(self.alerts)], input='\n'.join(map(json.dumps, readings))+'\n',
                       text=True, capture_output=True, check=True)
        self.original = self.alerts.read_bytes()
        self.records = [json.loads(line) for line in self.alerts.read_text().splitlines()]
        self.id = self.records[0]['alert_id']

    def run_cli(self, command, *args, success=True, response_path=None):
        result = subprocess.run([str(CLI), command, str(self.alerts),
                                 str(response_path or self.responses), *args], text=True, capture_output=True)
        if success:
            self.assertEqual(result.returncode, 0, result.stderr)
            return json.loads(result.stdout)
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(self.alerts.read_bytes(), self.original)
        return result.stderr

    def test_receiver_ids_and_pending_alerts(self):
        self.assertEqual(len(self.records), 2)
        self.assertNotEqual(self.records[0]['alert_id'], self.records[1]['alert_id'])
        self.assertEqual([a['severity'] for a in self.records], ['WARNING', 'CRITICAL'])
        self.assertEqual([a['response_status'] for a in self.run_cli('list')], ['pending', 'pending'])
        self.assertFalse(self.responses.exists())

    def test_response_survives_new_process_without_changing_reading(self):
        note = 'Chuyển sang thùng dự phòng: "A"\nKiểm tra lại sau.'
        self.run_cli('respond', self.id, 'moved_to_backup_cooler', note)
        data = self.run_cli('list')  # A completely new process reloads the files.
        self.assertEqual(data[0]['response_status'], 'responded')
        self.assertEqual(data[0]['response']['note'], note)
        self.assertTrue(data[0]['response']['recorded_at'].endswith('Z'))
        self.assertEqual(data[0]['alert']['reading']['temperature'], 9)
        self.assertEqual(data[1]['response_status'], 'pending')
        self.assertEqual(self.alerts.read_bytes(), self.original)

    def test_duplicate_response_is_rejected(self):
        self.run_cli('respond', self.id, 'inspect')
        before = self.responses.read_bytes()
        self.assertIn('already', self.run_cli('respond', self.id, 'inspect', success=False))
        self.assertEqual(self.responses.read_bytes(), before)

    def test_unknown_alert_and_blank_action_are_rejected(self):
        self.assertIn('Unknown', self.run_cli('respond', 'missing', 'inspect', success=False))
        self.assertIn('blank', self.run_cli('respond', self.id, ' \t', success=False))
        self.assertFalse(self.responses.exists())

    def test_storage_failure_is_reported(self):
        self.assertIn('Cannot open', self.run_cli('respond', self.id, 'inspect', success=False,
                      response_path=Path(self.temp.name)/'missing'/'responses.jsonl'))

    def test_corrupt_storage_is_not_silently_ignored(self):
        self.responses.write_text('{broken\n')
        before = self.responses.read_bytes()
        self.assertIn('Invalid JSON', self.run_cli('respond', self.id, 'inspect', success=False))
        self.assertEqual(self.responses.read_bytes(), before)

    def test_same_file_and_alias_are_rejected(self):
        self.run_cli('respond', self.id, 'inspect', success=False, response_path=self.alerts)
        alias = Path(self.temp.name)/'alias'
        alias.symlink_to(self.alerts)
        self.run_cli('respond', self.id, 'inspect', success=False, response_path=alias)

    def test_legacy_alert_requires_explicit_migration(self):
        for alert in self.records:
            del alert['alert_id']
        self.alerts.write_text('\n'.join(map(json.dumps, self.records))+'\n')
        self.original = self.alerts.read_bytes()
        self.assertIn('alert_id', self.run_cli('list', success=False))

if __name__ == '__main__':
    unittest.main()
