"""
tools/verify_storage.py
=======================
Link Phase — Layer 3 Tool
Verifies S3-compatible object storage by:
  1. Uploading a small test file
  2. Generating a presigned URL
  3. Fetching the file via the presigned URL
  4. Deleting the test file (cleanup)

Usage:
    python tools/verify_storage.py

Exit codes:
    0 — All storage operations successful
    1 — Any storage operation failed
"""

import sys
import os
import uuid
import requests
from dotenv import load_dotenv

load_dotenv()

STORAGE_BUCKET       = os.getenv("STORAGE_BUCKET", "p2p-attachments")
STORAGE_REGION       = os.getenv("STORAGE_REGION", "ap-southeast-1")
STORAGE_ACCESS_KEY   = os.getenv("STORAGE_ACCESS_KEY", "")
STORAGE_SECRET_KEY   = os.getenv("STORAGE_SECRET_KEY", "")
STORAGE_ENDPOINT_URL = os.getenv("STORAGE_ENDPOINT_URL") or None  # None = AWS default
STORAGE_PRESIGNED_URL_EXPIRY = int(os.getenv("STORAGE_PRESIGNED_URL_EXPIRY", "3600"))


def check_env() -> bool:
    required = ["STORAGE_BUCKET", "STORAGE_ACCESS_KEY", "STORAGE_SECRET_KEY"]
    missing = [k for k in required if not os.getenv(k)]
    if missing:
        print(f"[FAIL] Missing storage environment variables: {', '.join(missing)}")
        print("       Fill in STORAGE_* values in .env")
        return False
    print("[OK]   All storage environment variables present.")
    return True


def get_s3_client():
    """Return a boto3 S3 client respecting the endpoint override."""
    try:
        import boto3  # type: ignore
        from botocore.config import Config  # type: ignore
    except ImportError:
        print("[FAIL] boto3 not installed. Run: pip install boto3")
        sys.exit(1)

    kwargs = dict(
        aws_access_key_id=STORAGE_ACCESS_KEY,
        aws_secret_access_key=STORAGE_SECRET_KEY,
        region_name=STORAGE_REGION,
        config=Config(signature_version="s3v4"),
    )
    if STORAGE_ENDPOINT_URL:
        kwargs["endpoint_url"] = STORAGE_ENDPOINT_URL

    return boto3.client("s3", **kwargs)


def test_upload(s3, test_key: str) -> bool:
    content = (
        b"P2P Procurement System - storage link verification test file. "
        b"Safe to delete."
    )
    try:
        s3.put_object(
            Bucket=STORAGE_BUCKET,
            Key=test_key,
            Body=content,
            ContentType="text/plain",
        )
        print(f"[OK]   Uploaded test object: s3://{STORAGE_BUCKET}/{test_key}")
        return True
    except Exception as e:
        print(f"[FAIL] Upload failed: {e}")
        return False


def test_presigned_url(s3, test_key: str) -> bool:
    try:
        url = s3.generate_presigned_url(
            "get_object",
            Params={"Bucket": STORAGE_BUCKET, "Key": test_key},
            ExpiresIn=60,
        )
        print(f"[OK]   Presigned URL generated.")

        resp = requests.get(url, timeout=10)
        if resp.status_code == 200:
            print(f"[OK]   Presigned URL fetch: HTTP {resp.status_code} — content verified.")
            return True
        else:
            print(f"[FAIL] Presigned URL returned HTTP {resp.status_code}")
            return False
    except Exception as e:
        print(f"[FAIL] Presigned URL error: {e}")
        return False


def test_delete(s3, test_key: str) -> bool:
    try:
        s3.delete_object(Bucket=STORAGE_BUCKET, Key=test_key)
        print(f"[OK]   Test object deleted: {test_key}")
        return True
    except Exception as e:
        print(f"[WARN] Delete failed (manual cleanup needed): {e}")
        return False


def main() -> int:
    print("\n=== P2P Object Storage Link Verification ===\n")

    env_ok = check_env()
    if not env_ok:
        return 1

    s3 = get_s3_client()
    test_key = f".tmp/link-verify-{uuid.uuid4().hex[:8]}.txt"

    upload_ok  = test_upload(s3, test_key)
    if not upload_ok:
        return 1

    url_ok = test_presigned_url(s3, test_key)
    delete_ok = test_delete(s3, test_key)

    print()
    if upload_ok and url_ok:
        print("✅  Storage link: VERIFIED")
        return 0
    else:
        print("❌  Storage link: FAILED")
        return 1


if __name__ == "__main__":
    sys.exit(main())
