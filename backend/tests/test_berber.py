"""Backend tests for Berber (formerly حلاق دلفري) - phone-based auth schema."""
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
    assert r.status_code == 200, f"login failed {creds['phone']}: {r.status_code} {r.text}"
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


def test_services():
    r = requests.get(f"{API}/services", timeout=15)
    assert r.status_code == 200
    data = r.json()
    assert len(data) == 4
    by = {s["key"]: s for s in data}
    assert by["full"]["price"] == 10000
    assert by["kids"]["price"] == 5000
    assert by["beard"]["price"] == 5000
    assert by["blowdry"]["price"] == 5000


# ---------- Auth (phone-based) ----------
def test_login_admin_phone_returns_admin_role(admin_auth):
    assert admin_auth["user"]["role"] == "admin"
    assert admin_auth["user"]["phone"] == "07812059874"
    assert isinstance(admin_auth["token"], str) and len(admin_auth["token"]) > 20


def test_login_customer_and_barber(customer_auth, barber_auth):
    assert customer_auth["user"]["role"] == "customer"
    assert barber_auth["user"]["role"] == "barber"


def test_register_new_customer_phone_based():
    ts = int(time.time())
    phone = f"0779{ts % 10000000:07d}"
    payload = {"name": "TEST_New", "phone": phone, "password": "Test@1234", "role": "customer"}
    r = requests.post(f"{API}/auth/register", json=payload, timeout=20)
    assert r.status_code == 200, r.text
    body = r.json()
    assert "token" in body
    assert body["user"]["role"] == "customer"
    assert body["user"]["phone"] == phone

    # login with same phone + password
    lr = requests.post(f"{API}/auth/login", json={"phone": phone, "password": "Test@1234"}, timeout=20)
    assert lr.status_code == 200
    assert lr.json()["user"]["phone"] == phone


def test_register_duplicate_phone_rejected():
    r = requests.post(
        f"{API}/auth/register",
        json={"name": "Dup", "phone": CUSTOMER["phone"], "password": "whatever", "role": "customer"},
        timeout=15,
    )
    assert r.status_code == 400


def test_login_wrong_password_401():
    r = requests.post(f"{API}/auth/login", json={"phone": CUSTOMER["phone"], "password": "WRONG"}, timeout=15)
    assert r.status_code == 401


def test_login_unknown_phone_401():
    r = requests.post(f"{API}/auth/login", json={"phone": "07709999999", "password": "x"}, timeout=15)
    assert r.status_code == 401


def test_register_admin_phone_auto_promotes():
    # The admin phone is already registered, so duplicate -> 400. But role must still be admin on login.
    r = requests.post(
        f"{API}/auth/register",
        json={"name": "Admin", "phone": ADMIN["phone"], "password": ADMIN["password"], "role": "customer"},
        timeout=15,
    )
    assert r.status_code in (200, 400)
    lr = _login(ADMIN)
    assert lr["user"]["role"] == "admin"


# ---------- Bookings ----------
@pytest.fixture(scope="module")
def created_booking(customer_auth):
    body = {"service_key": "full", "address": "TEST_addr Baghdad", "notes": "TEST", "lat": 33.3152, "lng": 44.3661}
    r = requests.post(f"{API}/bookings", headers=_h(customer_auth["token"]), json=body, timeout=20)
    assert r.status_code == 200, r.text
    return r.json()


def test_create_booking_includes_customer_phone_and_coords(created_booking, customer_auth):
    assert created_booking["service_key"] == "full"
    assert created_booking["price"] == 10000
    assert created_booking["status"] == "pending"
    assert created_booking["customer_phone"] == customer_auth["user"]["phone"]
    assert created_booking["lat"] == 33.3152
    assert created_booking["lng"] == 44.3661


def test_customer_only_sees_own(customer_auth, created_booking):
    r = requests.get(f"{API}/bookings", headers=_h(customer_auth["token"]), timeout=15)
    assert r.status_code == 200
    items = r.json()
    assert created_booking["id"] in [b["id"] for b in items]
    assert all(b["customer_id"] == customer_auth["user"]["id"] for b in items)


def test_barber_sees_pending_with_customer_phone(barber_auth, created_booking):
    r = requests.get(f"{API}/bookings", headers=_h(barber_auth["token"]), timeout=15)
    assert r.status_code == 200
    items = r.json()
    match = next((b for b in items if b["id"] == created_booking["id"]), None)
    assert match is not None
    assert match.get("customer_phone")  # barber must see customer phone
    assert "lat" in match and "lng" in match


def test_barber_accepts_applies_fee(barber_auth, created_booking):
    bid = created_booking["id"]
    r = requests.patch(
        f"{API}/bookings/{bid}/status", headers=_h(barber_auth["token"]), json={"status": "accepted"}, timeout=20
    )
    assert r.status_code == 200, r.text
    fresh = r.json()
    assert fresh["status"] == "accepted"
    assert fresh["platform_fee"] == 1000
    assert fresh["barber_earnings"] == 10000 - 1000
    assert fresh["barber_id"] == barber_auth["user"]["id"]


def test_double_accept_rejected_409(barber_auth, created_booking):
    """State machine guard: re-accepting an already-accepted booking must 409."""
    bid = created_booking["id"]
    r = requests.patch(
        f"{API}/bookings/{bid}/status", headers=_h(barber_auth["token"]), json={"status": "accepted"}, timeout=15
    )
    assert r.status_code == 409, f"expected 409, got {r.status_code}: {r.text}"


# ---------- Wallet ----------
def test_wallet_barber_gross_fees_net(barber_auth):
    r = requests.get(f"{API}/wallet/me", headers=_h(barber_auth["token"]), timeout=15)
    assert r.status_code == 200
    w = r.json()
    assert w["role"] == "barber"
    assert w["jobs"] >= 1
    assert w["fees"] == 1000 * w["jobs"]
    assert w["net"] == w["gross"] - w["fees"]


def test_wallet_customer(customer_auth):
    r = requests.get(f"{API}/wallet/me", headers=_h(customer_auth["token"]), timeout=15)
    assert r.status_code == 200
    w = r.json()
    assert w["role"] == "customer"
    assert "spent" in w


# ---------- Admin & RBAC ----------
def test_admin_stats_requires_admin(admin_auth):
    r = requests.get(f"{API}/admin/stats", headers=_h(admin_auth["token"]), timeout=15)
    assert r.status_code == 200
    s = r.json()
    for k in ("users", "customers", "barbers", "bookings", "revenue"):
        assert k in s


def test_admin_stats_forbidden_for_customer(customer_auth):
    r = requests.get(f"{API}/admin/stats", headers=_h(customer_auth["token"]), timeout=15)
    assert r.status_code == 403


def test_admin_users_and_bookings(admin_auth):
    r1 = requests.get(f"{API}/admin/users", headers=_h(admin_auth["token"]), timeout=15)
    assert r1.status_code == 200 and isinstance(r1.json(), list)
    r2 = requests.get(f"{API}/admin/bookings", headers=_h(admin_auth["token"]), timeout=15)
    assert r2.status_code == 200 and isinstance(r2.json(), list)


# ---------- PWA static assets ----------
def test_pwa_manifest():
    r = requests.get(f"{BASE_URL}/manifest.json", timeout=15)
    assert r.status_code == 200
    data = r.json()
    assert "Berber" in data.get("name", "")


def test_pwa_service_worker():
    r = requests.get(f"{BASE_URL}/sw.js", timeout=15)
    assert r.status_code == 200
    assert "service" in r.text.lower() or "cache" in r.text.lower() or len(r.text) > 0


def test_pwa_icon_svg():
    r = requests.get(f"{BASE_URL}/icon.svg", timeout=15)
    assert r.status_code == 200
    assert "<svg" in r.text


def test_robots_disallow():
    r = requests.get(f"{BASE_URL}/robots.txt", timeout=15)
    assert r.status_code == 200
    assert "Disallow: /" in r.text


def test_index_has_noindex_meta():
    r = requests.get(f"{BASE_URL}/", timeout=15)
    assert r.status_code == 200
    html = r.text.lower()
    assert "noindex" in html and "nofollow" in html
