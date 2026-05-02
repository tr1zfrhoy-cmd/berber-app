"""Backend tests for Berber iteration 3: wallet_balance, hair/beard split, fee=500, dynamic settings, ratings, barber profile."""
import os
import time
import requests
import pytest

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"

ADMIN = {"phone": "07812059874", "password": "Admin@2026"}
CUSTOMER = {"phone": "07700000001", "password": "Test@1234"}
BARBER = {"phone": "07700000002", "password": "Test@1234"}


def _login(creds):
    r = requests.post(f"{API}/auth/login", json=creds, timeout=20)
    if r.status_code != 200:
        # Try register — DB may have been cleared
        role = "admin" if creds["phone"] == ADMIN["phone"] else (
            "barber" if creds["phone"] == BARBER["phone"] else "customer"
        )
        name = {"07812059874": "المدير", "07700000001": "علي", "07700000002": "حسن الحلاق"}[creds["phone"]]
        rr = requests.post(
            f"{API}/auth/register",
            json={"name": name, "phone": creds["phone"], "password": creds["password"], "role": role},
            timeout=20,
        )
        assert rr.status_code == 200, f"register fallback failed: {rr.status_code} {rr.text}"
        return rr.json()
    return r.json()


def _h(t):
    return {"Authorization": f"Bearer {t}"}


@pytest.fixture(scope="module")
def admin_auth():
    return _login(ADMIN)


@pytest.fixture(scope="module")
def customer_auth():
    return _login(CUSTOMER)


@pytest.fixture(scope="module")
def barber_auth():
    return _login(BARBER)


# ---------- Basics ----------
def test_root():
    r = requests.get(f"{API}/", timeout=15)
    assert r.status_code == 200
    assert r.json().get("status") == "ok"


def test_services_has_5_including_hair_and_beard():
    r = requests.get(f"{API}/services", timeout=15)
    assert r.status_code == 200
    data = r.json()
    keys = {s["key"] for s in data}
    # Must include separate hair and beard
    assert "hair" in keys and "beard" in keys, f"hair/beard missing: {keys}"
    assert "full" in keys and "kids" in keys and "blowdry" in keys
    by = {s["key"]: s for s in data}
    assert by["full"]["price"] == 10000
    assert by["hair"]["price"] == 5000
    assert by["beard"]["price"] == 5000


# ---------- Auth ----------
def test_login_admin_phone_returns_admin_role(admin_auth):
    assert admin_auth["user"]["role"] == "admin"
    assert admin_auth["user"]["phone"] == "07812059874"


def test_login_customer_and_barber(customer_auth, barber_auth):
    assert customer_auth["user"]["role"] == "customer"
    assert barber_auth["user"]["role"] == "barber"
    # iteration-3: user model includes wallet_balance, rating_avg, rating_count, portfolio
    for key in ("wallet_balance", "rating_avg", "rating_count", "portfolio"):
        assert key in barber_auth["user"], f"barber missing field {key}"


def test_register_duplicate_phone_rejected():
    r = requests.post(
        f"{API}/auth/register",
        json={"name": "Dup", "phone": CUSTOMER["phone"], "password": "whatever"},
        timeout=15,
    )
    assert r.status_code == 400


def test_login_wrong_password_401():
    r = requests.post(f"{API}/auth/login", json={"phone": CUSTOMER["phone"], "password": "WRONG"}, timeout=15)
    assert r.status_code == 401


# ---------- Admin Settings (dynamic) ----------
def test_admin_get_settings_requires_admin(admin_auth, customer_auth):
    r = requests.get(f"{API}/admin/settings", headers=_h(customer_auth["token"]), timeout=15)
    assert r.status_code == 403
    r2 = requests.get(f"{API}/admin/settings", headers=_h(admin_auth["token"]), timeout=15)
    assert r2.status_code == 200
    s = r2.json()
    assert "platform_fee" in s
    assert "services" in s and isinstance(s["services"], list)


def test_admin_patch_settings_platform_fee(admin_auth):
    # Set fee to a known value: 500 (iteration-3 default)
    r = requests.patch(
        f"{API}/admin/settings",
        headers=_h(admin_auth["token"]),
        json={"platform_fee": 500},
        timeout=15,
    )
    assert r.status_code == 200
    assert r.json()["platform_fee"] == 500


# ---------- Wallet flow (iteration-3 semantics) ----------
@pytest.fixture(scope="module")
def zero_out_barber_wallet(admin_auth, barber_auth):
    """Reset barber's wallet to 0 via admin adjust."""
    bid = barber_auth["user"]["id"]
    # Fetch current balance
    r = requests.get(f"{API}/admin/users/{bid}", headers=_h(admin_auth["token"]), timeout=15)
    assert r.status_code == 200
    cur = int(r.json()["user"].get("wallet_balance", 0) or 0)
    if cur != 0:
        requests.post(
            f"{API}/admin/users/{bid}/wallet",
            headers=_h(admin_auth["token"]),
            json={"amount": -cur, "reason": "TEST_reset"},
            timeout=15,
        )
    # Verify zero
    rr = requests.get(f"{API}/admin/users/{bid}", headers=_h(admin_auth["token"]), timeout=15)
    assert int(rr.json()["user"].get("wallet_balance", 0) or 0) == 0
    return True


@pytest.fixture(scope="module")
def booking_hair(customer_auth):
    """Test hair-only service (iteration-3 split)."""
    body = {"service_key": "hair", "address": "TEST_addr hair", "lat": 33.3152, "lng": 44.3661}
    r = requests.post(f"{API}/bookings", headers=_h(customer_auth["token"]), json=body, timeout=20)
    assert r.status_code == 200, r.text
    b = r.json()
    assert b["service_key"] == "hair"
    assert b["price"] == 5000
    return b


@pytest.fixture(scope="module")
def booking_full(customer_auth):
    body = {"service_key": "full", "address": "TEST_addr full", "lat": 33.3152, "lng": 44.3661}
    r = requests.post(f"{API}/bookings", headers=_h(customer_auth["token"]), json=body, timeout=20)
    assert r.status_code == 200
    return r.json()


def test_barber_zero_wallet_gets_402_on_accept(zero_out_barber_wallet, barber_auth, booking_hair):
    r = requests.patch(
        f"{API}/bookings/{booking_hair['id']}/status",
        headers=_h(barber_auth["token"]),
        json={"status": "accepted"},
        timeout=20,
    )
    assert r.status_code == 402, f"expected 402, got {r.status_code}: {r.text}"
    # Arabic error contains رصيد
    assert "رصيد" in r.text


def test_admin_topup_barber_wallet(admin_auth, barber_auth):
    bid = barber_auth["user"]["id"]
    r = requests.post(
        f"{API}/admin/users/{bid}/wallet",
        headers=_h(admin_auth["token"]),
        json={"amount": 2000, "reason": "TEST_topup"},
        timeout=15,
    )
    assert r.status_code == 200
    assert r.json()["balance"] == 2000


def test_barber_accepts_deducts_fee_from_wallet(admin_auth, barber_auth, booking_full):
    # Current balance should be 2000 after prior test
    r = requests.patch(
        f"{API}/bookings/{booking_full['id']}/status",
        headers=_h(barber_auth["token"]),
        json={"status": "accepted"},
        timeout=20,
    )
    assert r.status_code == 200, r.text
    fresh = r.json()
    assert fresh["status"] == "accepted"
    assert fresh["platform_fee"] == 500
    # Iteration-3: barber_earnings = full price (fee taken from wallet, not netted off)
    assert fresh["barber_earnings"] == fresh["price"] == 10000
    # Verify wallet balance went from 2000 -> 1500
    bid = barber_auth["user"]["id"]
    rr = requests.get(f"{API}/admin/users/{bid}", headers=_h(admin_auth["token"]), timeout=15)
    assert rr.status_code == 200
    data = rr.json()
    assert int(data["user"]["wallet_balance"]) == 1500
    # wallet txns recorded, at least one commission
    txns = data.get("txns", [])
    assert any(t["kind"] == "commission" and t["booking_id"] == booking_full["id"] for t in txns)


def test_admin_wallet_negative_adjustment(admin_auth, barber_auth):
    bid = barber_auth["user"]["id"]
    r = requests.post(
        f"{API}/admin/users/{bid}/wallet",
        headers=_h(admin_auth["token"]),
        json={"amount": -500, "reason": "TEST_deduct"},
        timeout=15,
    )
    assert r.status_code == 200
    assert r.json()["balance"] == 1000


# ---------- Rating flow ----------
def test_rating_before_completion_returns_400(customer_auth, booking_full):
    # booking_full is currently 'accepted', not 'completed'
    r = requests.post(
        f"{API}/bookings/{booking_full['id']}/rating",
        headers=_h(customer_auth["token"]),
        json={"stars": 5},
        timeout=15,
    )
    assert r.status_code == 400


def _complete_booking(admin_auth, booking_id):
    # Use barber route would be safer; but simulate by directly using customer? No: status 'completed' is set by barber.
    # We'll have the barber flip to completed.
    pass


def test_rate_completed_booking_updates_barber_avg(admin_auth, barber_auth, customer_auth, booking_full):
    # Barber flips to completed
    r0 = requests.patch(
        f"{API}/bookings/{booking_full['id']}/status",
        headers=_h(barber_auth["token"]),
        json={"status": "completed"},
        timeout=15,
    )
    assert r0.status_code == 200
    # Customer rates
    r = requests.post(
        f"{API}/bookings/{booking_full['id']}/rating",
        headers=_h(customer_auth["token"]),
        json={"stars": 5, "comment": "TEST ممتاز"},
        timeout=15,
    )
    assert r.status_code == 200, r.text
    doc = r.json()
    assert doc["stars"] == 5
    # Barber aggregate updated
    bid = barber_auth["user"]["id"]
    bp = requests.get(f"{API}/barbers/{bid}", timeout=15)
    assert bp.status_code == 200
    body = bp.json()
    assert body["barber"]["rating_count"] >= 1
    assert body["barber"]["rating_avg"] >= 1
    assert any(rr["booking_id"] == booking_full["id"] for rr in body["ratings"])


def test_double_rating_returns_400(customer_auth, booking_full):
    r = requests.post(
        f"{API}/bookings/{booking_full['id']}/rating",
        headers=_h(customer_auth["token"]),
        json={"stars": 4},
        timeout=15,
    )
    assert r.status_code == 400
    assert "تم التقييم" in r.text or "مسبق" in r.text


# ---------- Barber profile + PATCH /auth/me (avatar/portfolio) ----------
def test_get_barber_public_profile(barber_auth):
    bid = barber_auth["user"]["id"]
    r = requests.get(f"{API}/barbers/{bid}", timeout=15)
    assert r.status_code == 200
    body = r.json()
    assert body["barber"]["id"] == bid
    # wallet_balance must be excluded from public profile
    assert "wallet_balance" not in body["barber"]
    assert "ratings" in body


def test_patch_me_persists_avatar_and_portfolio(barber_auth):
    payload = {
        "avatar": "https://example.com/avatar.png",
        "portfolio": [
            "https://example.com/1.jpg",
            "https://example.com/2.jpg",
        ],
    }
    r = requests.patch(f"{API}/auth/me", headers=_h(barber_auth["token"]), json=payload, timeout=15)
    assert r.status_code == 200
    fresh = r.json()
    assert fresh["avatar"] == payload["avatar"]
    assert fresh["portfolio"] == payload["portfolio"]


# ---------- Admin & RBAC ----------
def test_admin_stats_requires_admin(admin_auth):
    r = requests.get(f"{API}/admin/stats", headers=_h(admin_auth["token"]), timeout=15)
    assert r.status_code == 200


def test_admin_stats_forbidden_for_customer(customer_auth):
    r = requests.get(f"{API}/admin/stats", headers=_h(customer_auth["token"]), timeout=15)
    assert r.status_code == 403


def test_admin_users_and_bookings(admin_auth):
    r1 = requests.get(f"{API}/admin/users", headers=_h(admin_auth["token"]), timeout=15)
    assert r1.status_code == 200 and isinstance(r1.json(), list)
    r2 = requests.get(f"{API}/admin/bookings", headers=_h(admin_auth["token"]), timeout=15)
    assert r2.status_code == 200 and isinstance(r2.json(), list)


# ---------- PWA ----------
def test_pwa_manifest():
    r = requests.get(f"{BASE_URL}/manifest.json", timeout=15)
    assert r.status_code == 200
    assert "Berber" in r.json().get("name", "")
