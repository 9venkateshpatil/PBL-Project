from config import RISK_THRESHOLDS, SECURITY_POLICIES

FACTOR_DEFINITIONS = {
    "new_device": {
        "id": "new_device",
        "name": "New Device / Unrecognized Fingerprint",
        "description": "Session initialized from a novel device hardware/browser fingerprint",
        "weight": 20,
        "category": "Device Identity",
        "icon": "laptop"
    },
    "unknown_ip": {
        "id": "unknown_ip",
        "name": "Unknown IP Address",
        "description": "Connection originated from an unwhitelisted subnet or foreign ASN",
        "weight": 25,
        "category": "Network",
        "icon": "globe"
    },
    "unusual_time": {
        "id": "unusual_time",
        "name": "Unusual Login Time",
        "description": "Authentication initiated outside normal operating hours (02:00 - 05:00 local)",
        "weight": 15,
        "category": "Behavioral",
        "icon": "clock"
    },
    "failed_logins": {
        "id": "failed_logins",
        "name": "Multiple Failed Logins",
        "description": "3 or more consecutive invalid authentication challenges in past 15 min",
        "weight": 30,
        "category": "Authentication",
        "icon": "alert-triangle"
    },
    "suspicious_download": {
        "id": "suspicious_download",
        "name": "Suspicious Download Velocity",
        "description": "Abnormal volume or rapid sequential file extraction patterns detected",
        "weight": 25,
        "category": "Data Access",
        "icon": "download"
    },
    "unusual_location": {
        "id": "unusual_location",
        "name": "Unusual Geographic Location",
        "description": "Impossible travel or access detected from high-risk geopolitical region/Tor exit node",
        "weight": 35,
        "category": "Geo-Telemetry",
        "icon": "map-pin"
    }
}

class RiskEngine:
    """
    Risk Analysis Engine for dynamic session risk scoring and adaptive security orchestration.
    """

    @classmethod
    def get_factor_catalog(cls) -> list:
        return list(FACTOR_DEFINITIONS.values())

    @classmethod
    def evaluate(cls, active_factors: dict = None, base_score: int = 5) -> dict:
        """
        Calculates total risk score (0-100) based on active factor toggles or telemetry.
        """
        if active_factors is None:
            active_factors = {}

        total_score = base_score
        detected_factors = []

        for factor_id, is_active in active_factors.items():
            if is_active and factor_id in FACTOR_DEFINITIONS:
                factor = FACTOR_DEFINITIONS[factor_id]
                total_score += factor["weight"]
                detected_factors.append({
                    "id": factor_id,
                    "name": factor["name"],
                    "weight": factor["weight"],
                    "category": factor["category"],
                    "description": factor["description"],
                    "icon": factor["icon"]
                })

        # Cap score between 0 and 100
        total_score = max(0, min(100, total_score))

        # Determine Risk Level
        if total_score <= RISK_THRESHOLDS["LOW_MAX"]:
            risk_level = "LOW"
        elif total_score <= RISK_THRESHOLDS["MEDIUM_MAX"]:
            risk_level = "MEDIUM"
        else:
            risk_level = "HIGH"

        policy = SECURITY_POLICIES[risk_level]

        return {
            "score": total_score,
            "level": risk_level,
            "policy": policy,
            "detected_factors": detected_factors,
            "factors_count": len(detected_factors),
            "thresholds": RISK_THRESHOLDS,
            "recommendation": cls._get_recommendation(risk_level, total_score)
        }

    @staticmethod
    def _get_recommendation(level: str, score: int) -> str:
        if level == "LOW":
            return f"Session verified as benign ({score}/100). Standard AES-128 cryptographic envelope applied."
        elif level == "MEDIUM":
            return f"Moderate risk detected ({score}/100). Stepping up encryption to AES-192 with enhanced file auditing."
        else:
            return f"Critical threat telemetry ({score}/100). Elevating to AES-256 with mandatory OTP challenge and restricted data export."
