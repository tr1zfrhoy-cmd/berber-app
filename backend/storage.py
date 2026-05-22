"""Object storage helpers using Emergent Storage API.
Used for user avatars and barber portfolio uploads.
"""
import os
import uuid
import requests
import logging
from typing import Tuple

logger = logging.getLogger(__name__)

STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
APP_NAME = os.environ.get("APP_STORAGE_NAME", "berber")
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY", "")

_storage_key = None  # session-scoped

MIME = {
    "jpg": "image/jpeg", "jpeg": "image/jpeg",
    "png": "image/png", "gif": "image/gif",
    "webp": "image/webp", "heic": "image/heic", "heif": "image/heif",
}

MAX_BYTES = 6 * 1024 * 1024  # 6MB safety cap


def init_storage() -> str:
    """Initialize storage and return reusable storage_key."""
    global _storage_key
    if _storage_key:
        return _storage_key
    emergent_key = os.environ.get("EMERGENT_LLM_KEY", "")
    if not emergent_key:
        raise RuntimeError("EMERGENT_LLM_KEY not configured")
    resp = requests.post(
        f"{STORAGE_URL}/init",
        json={"emergent_key": emergent_key},
        timeout=30,
    )
    resp.raise_for_status()
    _storage_key = resp.json()["storage_key"]
    logger.info("Object storage initialized")
    return _storage_key


def _ensure_key() -> str:
    return init_storage()


def put_image(user_id: str, data: bytes, ext: str, kind: str = "img") -> dict:
    """Upload an image. Returns {"path": "<full_path>", "size": N}."""
    if len(data) > MAX_BYTES:
        raise ValueError("File too large (max 6MB)")
    ext = (ext or "jpg").lower().strip(".")
    if ext not in MIME:
        ext = "jpg"
    content_type = MIME[ext]
    path = f"{APP_NAME}/{kind}/{user_id}/{uuid.uuid4()}.{ext}"
    key = _ensure_key()
    resp = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data,
        timeout=120,
    )
    if resp.status_code == 403:
        # storage key expired — refresh once
        global _storage_key
        _storage_key = None
        key = _ensure_key()
        resp = requests.put(
            f"{STORAGE_URL}/objects/{path}",
            headers={"X-Storage-Key": key, "Content-Type": content_type},
            data=data,
            timeout=120,
        )
    resp.raise_for_status()
    out = resp.json()
    return {"path": out.get("path", path), "size": out.get("size", len(data)), "content_type": content_type}


def get_image(path: str) -> Tuple[bytes, str]:
    """Returns (bytes, content_type)."""
    key = _ensure_key()
    resp = requests.get(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key},
        timeout=60,
    )
    if resp.status_code == 403:
        global _storage_key
        _storage_key = None
        key = _ensure_key()
        resp = requests.get(
            f"{STORAGE_URL}/objects/{path}",
            headers={"X-Storage-Key": key},
            timeout=60,
        )
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")
