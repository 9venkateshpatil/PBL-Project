import sys
import os
import io
import json
import unittest

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app import create_app
from database import init_db, get_db_connection
from crypto_engine import CryptoEngine
from risk_engine import RiskEngine

class CloudCryptTestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.client = self.app.test_client()

    def test_01_health_check(self):
        res = self.client.get("/api/health")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["status"], "healthy")
        self.assertIn("AES-GCM", data["crypto_engine"])

    def test_02_crypto_engine_primitives(self):
        sample = b"CloudCrypt Secret B.Tech Cybersecurity Payload 2026"

        for bits in [128, 192, 256]:
            enc = CryptoEngine.encrypt_data(sample, key_bits=bits)
            self.assertEqual(enc["key_bits"], bits)
            self.assertEqual(enc["algorithm"], f"AES-{bits}-GCM")
            self.assertIsNotNone(enc["salt_hex"])
            self.assertIsNotNone(enc["nonce_hex"])
            self.assertIsNotNone(enc["auth_tag_hex"])

            # Verify decryption matches original sample exactly
            dec = CryptoEngine.decrypt_data(
                ciphertext_with_tag=enc["encrypted_payload"],
                salt_hex=enc["salt_hex"],
                nonce_hex=enc["nonce_hex"],
                key_bits=bits
            )
            self.assertEqual(dec, sample)

    def test_03_risk_engine_scoring(self):
        # Clean state
        eval_low = RiskEngine.evaluate({})
        self.assertTrue(eval_low["score"] <= 30)
        self.assertEqual(eval_low["level"], "LOW")
        self.assertEqual(eval_low["policy"]["encryption"], "AES-128")

        # Medium risk: new device (+20) + unusual time (+15)
        eval_med = RiskEngine.evaluate({"new_device": True, "unusual_time": True})
        self.assertTrue(31 <= eval_med["score"] <= 70)
        self.assertEqual(eval_med["level"], "MEDIUM")
        self.assertEqual(eval_med["policy"]["encryption"], "AES-192")

        # High risk: failed logins (+30) + unusual location (+35) + unknown IP (+25)
        eval_high = RiskEngine.evaluate({"failed_logins": True, "unusual_location": True, "unknown_ip": True})
        self.assertTrue(eval_high["score"] > 70)
        self.assertEqual(eval_high["level"], "HIGH")
        self.assertEqual(eval_high["policy"]["encryption"], "AES-256")
        self.assertTrue(eval_high["policy"]["mfa_required"])

    def test_04_auth_and_session(self):
        # Valid login
        res = self.client.post("/api/auth/login", json={
            "email": "secops@cloudcrypt.io",
            "password": "cloudcrypt123"
        })
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])

        # Quick preset login (high risk)
        res_high = self.client.post("/api/auth/quick-login", json={"mode": "high"})
        self.assertEqual(res_high.status_code, 200)
        session_high = res_high.get_json()["session"]
        self.assertEqual(session_high["risk_level"], "HIGH")

    def test_05_dynamic_file_upload_and_download_flow(self):
        # 1. Reset risk to LOW
        self.client.post("/api/risk/reset")

        # 2. Upload file in LOW risk mode -> Expect AES-128
        test_payload = b"Low risk confidential report payload"
        data = {
            "file": (io.BytesIO(test_payload), "low_risk_test.txt")
        }
        res_up = self.client.post("/api/files/upload", data=data, content_type="multipart/form-data")
        self.assertEqual(res_up.status_code, 201)
        up_json = res_up.get_json()
        file_id = up_json["file"]["id"]
        self.assertEqual(up_json["file"]["encryption_algo"], "AES-128-GCM")

        # 3. Download low risk file -> Decrypted successfully
        res_down = self.client.get(f"/api/files/{file_id}/download")
        self.assertEqual(res_down.status_code, 200)
        self.assertEqual(res_down.data, test_payload)

        # 4. Inspect file cryptographic envelope
        res_inspect = self.client.get(f"/api/files/{file_id}/inspect")
        self.assertEqual(res_inspect.status_code, 200)
        insp_json = res_inspect.get_json()["inspection"]
        self.assertEqual(insp_json["key_size_bits"], 128)
        self.assertIn("nonce_iv_hex", insp_json["crypto_metadata"])
        self.assertIn("plaintext_sha256", insp_json["crypto_metadata"])

    def test_06_high_risk_otp_restriction(self):
        # 1. Simulate HIGH risk
        sim_res = self.client.post("/api/risk/simulate", json={
            "factors": {"failed_logins": True, "unknown_ip": True, "unusual_location": True}
        })
        self.assertEqual(sim_res.status_code, 200)
        self.assertEqual(sim_res.get_json()["session"]["risk_level"], "HIGH")

        # 2. Upload in HIGH risk mode -> Expect AES-256
        test_high_payload = b"Top secret database credentials"
        data = {
            "file": (io.BytesIO(test_high_payload), "top_secret.txt")
        }
        res_up = self.client.post("/api/files/upload", data=data, content_type="multipart/form-data")
        self.assertEqual(res_up.status_code, 201)
        file_id = res_up.get_json()["file"]["id"]
        self.assertEqual(res_up.get_json()["file"]["encryption_algo"], "AES-256-GCM")
        self.assertTrue(res_up.get_json()["file"]["requires_otp"])

        # 3. Attempt download without OTP -> Expect 403 Forbidden
        res_blocked = self.client.get(f"/api/files/{file_id}/download")
        self.assertEqual(res_blocked.status_code, 403)
        self.assertTrue(res_blocked.get_json()["requires_otp"])

        # 4. Verify OTP challenge
        otp_res = self.client.post("/api/auth/verify-otp", json={"code": "749215"})
        self.assertEqual(otp_res.status_code, 200)
        self.assertTrue(otp_res.get_json()["success"])

        # 5. Download now authorized -> Decrypted successfully
        res_unlocked = self.client.get(f"/api/files/{file_id}/download")
        self.assertEqual(res_unlocked.status_code, 200)
        self.assertEqual(res_unlocked.data, test_high_payload)

    def test_07_activity_logs_and_analytics(self):
        # Check logs
        log_res = self.client.get("/api/activity")
        self.assertEqual(log_res.status_code, 200)
        events = log_res.get_json()["events"]
        self.assertGreater(len(events), 0)

        # Check analytics
        ana_res = self.client.get("/api/analytics")
        self.assertEqual(ana_res.status_code, 200)
        ana_data = ana_res.get_json()
        self.assertIn("metrics", ana_data)
        self.assertIn("risk_distribution", ana_data)
        self.assertIn("encryption_distribution", ana_data)

if __name__ == "__main__":
    unittest.main()
