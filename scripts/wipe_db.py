"""One-shot DB wipe script — clears ALL users and dependent collections so
the project starts from a truly empty state. Run manually:

    python3 /app/scripts/wipe_db.py

After wiping, the admin can re-register from the auth screen using the phone
configured in backend/.env (ADMIN_PHONE) and will be auto-elevated to admin.
"""
import asyncio
import os
import sys
from pathlib import Path

# Make backend importable so we reuse its env loading.
ROOT = Path("/app/backend")
sys.path.insert(0, str(ROOT))

from dotenv import load_dotenv
load_dotenv(ROOT / ".env")

from motor.motor_asyncio import AsyncIOMotorClient


COLLECTIONS_TO_CLEAR = [
    "users",
    "bookings",
    "chat_messages",
    "wallet_txns",
    "ratings",
    "reports",
    "files",
]


async def main():
    mongo_url = os.environ["MONGO_URL"]
    db_name = os.environ["DB_NAME"]
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]

    print(f"Connected to DB: {db_name}\n")
    print("Before wipe:")
    for c in COLLECTIONS_TO_CLEAR:
        n = await db[c].count_documents({})
        print(f"  {c:<16} {n:>4} docs")

    print("\nWiping...")
    for c in COLLECTIONS_TO_CLEAR:
        r = await db[c].delete_many({})
        print(f"  {c:<16} deleted {r.deleted_count} docs")

    print("\nAfter wipe:")
    for c in COLLECTIONS_TO_CLEAR:
        n = await db[c].count_documents({})
        print(f"  {c:<16} {n:>4} docs")

    # `settings` collection is kept intact — that's where the admin-edited
    # legal text, services, commission, support whatsapp/email live.
    print("\nDone. The `settings` collection was kept (preserves admin config).")
    client.close()


if __name__ == "__main__":
    asyncio.run(main())
