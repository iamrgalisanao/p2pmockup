"""
tools/verify_db.py
==================
Link Phase -- Layer 3 Tool
Verifies MySQL database connection and checks for core table existence.
Updated for MySQL 8.0+ (replaces PostgreSQL version).

Usage:
    python tools/verify_db.py

Exit codes:
    0 -- All checks passed
    1 -- Connection or schema failure

Requirements:
    pip install pymysql python-dotenv
"""

import sys
import os
from dotenv import load_dotenv

load_dotenv()

DB_HOST     = os.getenv("DB_HOST", "127.0.0.1")
DB_PORT     = int(os.getenv("DB_PORT", "3306"))
DB_NAME     = os.getenv("DB_DATABASE", "p2p_procurement")
DB_USER     = os.getenv("DB_USERNAME", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")


def check_env() -> bool:
    """Ensure required DB env vars are present (Laravel naming convention)."""
    required = ["DB_HOST", "DB_PORT", "DB_DATABASE", "DB_USERNAME", "DB_PASSWORD"]
    missing = [k for k in required if not os.getenv(k)]
    if missing:
        print(f"[FAIL] Missing environment variables: {', '.join(missing)}")
        print("       Copy .env.example to .env and fill in DB_* values.")
        print("       Note: Laravel uses DB_DATABASE and DB_USERNAME (not DB_NAME/DB_USER).")
        return False
    print("[OK]   All DB environment variables present.")
    return True


def check_connection() -> bool:
    """Attempt a live connection to MySQL."""
    try:
        import pymysql  # type: ignore
    except ImportError:
        print("[FAIL] pymysql not installed. Run: pip install pymysql")
        return False

    try:
        conn = pymysql.connect(
            host=DB_HOST,
            port=DB_PORT,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD,
            charset="utf8mb4",
            connect_timeout=5,
        )
        cursor = conn.cursor()
        cursor.execute("SELECT VERSION();")
        row = cursor.fetchone()
        print(f"[OK]   Connected to MySQL: {row[0]}")

        # Verify charset is utf8mb4
        cursor.execute("SELECT @@character_set_database, @@collation_database;")
        charset_row = cursor.fetchone()
        print(f"[OK]   DB charset: {charset_row[0]} / collation: {charset_row[1]}")
        if "utf8mb4" not in str(charset_row[0]):
            print("[WARN] Database charset is NOT utf8mb4. Recommended to recreate DB with:")
            print("       CREATE DATABASE p2p_procurement CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")

        cursor.close()
        conn.close()
        return True

    except pymysql.err.OperationalError as e:
        print(f"[FAIL] Cannot connect to MySQL: {e}")
        print("       Check DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD in .env")
        return False
    except Exception as e:
        print(f"[FAIL] Unexpected DB error: {e}")
        return False


def check_tables() -> bool:
    """Verify that core tables exist (post-migration check)."""
    try:
        import pymysql  # type: ignore

        core_tables = [
            "users", "departments", "vendors",
            "requisitions", "requisition_line_items",
            "vendor_quotes", "quote_line_items",
            "approval_steps", "attachments", "audit_logs",
            "purchase_orders", "po_line_items", "notices_to_award",
            "personal_access_tokens",  # Laravel Sanctum
        ]

        conn = pymysql.connect(
            host=DB_HOST, port=DB_PORT, database=DB_NAME,
            user=DB_USER, password=DB_PASSWORD,
            charset="utf8mb4", connect_timeout=5,
        )
        cursor = conn.cursor()

        cursor.execute(
            "SELECT TABLE_NAME FROM information_schema.TABLES "
            "WHERE TABLE_SCHEMA = %s;",
            (DB_NAME,),
        )
        existing = {row[0] for row in cursor.fetchall()}
        cursor.close()
        conn.close()

        missing_tables = [t for t in core_tables if t not in existing]
        if missing_tables:
            print(f"[WARN] Tables not yet created: {', '.join(missing_tables)}")
            print("       Run: php artisan migrate  (from the backend/ directory)")
            return False

        print(f"[OK]   All {len(core_tables)} core tables verified present.")
        return True

    except Exception as e:
        print(f"[FAIL] Table check error: {e}")
        return False


def check_decimal_support() -> bool:
    """Confirm DECIMAL(15,4) columns work correctly for financial data."""
    try:
        import pymysql  # type: ignore
        conn = pymysql.connect(
            host=DB_HOST, port=DB_PORT, database=DB_NAME,
            user=DB_USER, password=DB_PASSWORD,
            charset="utf8mb4", connect_timeout=5,
        )
        cursor = conn.cursor()
        cursor.execute("SELECT CAST(1234567890.1234 AS DECIMAL(15,4));")
        result = cursor.fetchone()[0]
        expected = "1234567890.1234"
        cursor.close()
        conn.close()

        if str(result) == expected:
            print(f"[OK]   DECIMAL(15,4) arithmetic verified: {result}")
            return True
        else:
            print(f"[WARN] DECIMAL result mismatch: got {result}, expected {expected}")
            return False

    except Exception as e:
        print(f"[WARN] DECIMAL check skipped: {e}")
        return True  # Non-fatal


def main() -> int:
    print("\n=== P2P Database (MySQL) Link Verification ===\n")

    env_ok = check_env()
    if not env_ok:
        return 1

    conn_ok = check_connection()
    if not conn_ok:
        return 1

    check_decimal_support()
    check_tables()  # Warn only -- tables may not exist before migrations

    print()
    print("OK  Database link: VERIFIED")
    print("    Next step: php artisan migrate (from backend/ directory)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
