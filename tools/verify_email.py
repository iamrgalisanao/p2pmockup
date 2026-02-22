"""
tools/verify_email.py
=====================
Link Phase -- Layer 3 Tool
Verifies SMTP credentials by sending a test email to the configured FROM address.
Confirms the mail server is reachable and credentials are valid.

Usage:
    python tools/verify_email.py [--to recipient@example.com]

Exit codes:
    0 -- Email sent successfully
    1 -- Connection or authentication failure
"""

import sys
import os
import smtplib
import argparse
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

SMTP_HOST       = os.getenv("SMTP_HOST", "")
SMTP_PORT       = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER       = os.getenv("SMTP_USER", "")
SMTP_PASSWORD   = os.getenv("SMTP_PASSWORD", "")
SMTP_USE_TLS    = os.getenv("SMTP_USE_TLS", "true").lower() == "true"
SMTP_FROM_NAME  = os.getenv("SMTP_FROM_NAME", "P2P Procurement System")
SMTP_FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL", SMTP_USER)


def check_env() -> bool:
    """Ensure required SMTP env vars are present."""
    required = ["SMTP_HOST", "SMTP_USER", "SMTP_PASSWORD", "SMTP_FROM_EMAIL"]
    missing = [k for k in required if not os.getenv(k)]
    if missing:
        print(f"[FAIL] Missing SMTP environment variables: {', '.join(missing)}")
        print("       Fill in SMTP_* values in .env")
        return False
    print("[OK]   All SMTP environment variables present.")
    return True


def send_test_email(to_address: str) -> bool:
    """Attempt STARTTLS SMTP connection and send a test email."""
    subject = "[P2P System] SMTP Link Verification - Test Email"
    body = (
        "This is an automated test email sent by the P2P Procurement System "
        "link verification tool.\n\n"
        "If you received this, SMTP is correctly configured.\n\n"
        "You may disregard this message."
    )

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"]    = f"{SMTP_FROM_NAME} <{SMTP_FROM_EMAIL}>"
    msg["To"]      = to_address
    msg.attach(MIMEText(body, "plain"))

    try:
        print(f"[....] Connecting to {SMTP_HOST}:{SMTP_PORT} ...")
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as server:
            if SMTP_USE_TLS:
                server.ehlo()
                server.starttls()
                server.ehlo()
                print("[OK]   STARTTLS handshake successful.")
            server.login(SMTP_USER, SMTP_PASSWORD)
            print("[OK]   SMTP authentication successful.")
            server.sendmail(SMTP_FROM_EMAIL, [to_address], msg.as_string())
            print(f"[OK]   Test email sent to: {to_address}")
        return True

    except smtplib.SMTPAuthenticationError:
        print("[FAIL] SMTP authentication failed. Check SMTP_USER and SMTP_PASSWORD.")
        return False
    except smtplib.SMTPConnectError as e:
        print(f"[FAIL] Cannot connect to SMTP server: {e}")
        return False
    except Exception as e:
        print(f"[FAIL] Unexpected SMTP error: {e}")
        return False


def main() -> int:
    parser = argparse.ArgumentParser(description="Verify SMTP link for P2P system.")
    parser.add_argument(
        "--to",
        default=SMTP_FROM_EMAIL,
        help="Email address to send the test to (default: SMTP_FROM_EMAIL)",
    )
    args = parser.parse_args()

    print("\n=== P2P Email (SMTP) Link Verification ===\n")

    env_ok = check_env()
    if not env_ok:
        return 1

    success = send_test_email(args.to)

    print()
    if success:
        print("OK  Email link: VERIFIED")
        return 0
    else:
        print("FAIL  Email link: FAILED")
        return 1


if __name__ == "__main__":
    sys.exit(main())
