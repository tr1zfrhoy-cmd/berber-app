"""Backend tests for حلاق دلفري app."""
import os
import time
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://haircut-on-demand-2.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN = {"email": "tr1zfrhoy@gmail.com", "password": "Admin@2026"}
CUSTOMER = {"email": "customer@test.com", "password": "Test@1234"}
BARBER = {"email": "barber@test.com", "password": "Test@1234"}


def _login(creds):
    r = requests.post(f"{API}/auth/login", json=creds, timeout=20)
    assert r.status_code == 200, f"login failed {creds['email']}: {r.status_code} {r.text}"
    return r.json()


@pytest.fixture(scope="module")
def admin_tok():
    return _login(ADMIN)["token"]


@pytest.fixture(scope="module")
def customer_auth():
    return _login(CUSTOMER)


@pytest.fixture(scope="module")
def barber_auth():
    return _login(BARBER)


def _h(t):
    return {"Authorization": f"Bearer {t}"}


# ---------- Auth & basics ----------
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


def test_register_new_customer_and_login():
    ts = int(time.time())
    payload = {"name": "TEST_New", "email": f"TEST_new_{ts}@example.com", "password": "Test@1234", "role": "customer"}
    r = requests.post(f"{API}/auth/register", json=payload, timeout=20)
    assert r.status_code == 200, r.text
    body = r.json()
    assert "token" in body and body["user"]["role"] == "customer"
    # login
    lr = requests.post(f"{API}/auth/login", json={"email": payload["email"], "password": payload["password"]}, timeout=20)
    assert lr.status_code == 200


def test_admin_email_auto_promotes_role():
    # registering admin email even as customer should produce admin role.
    # Admin already exists, so we expect 400. Login and confirm role=admin.
    r = requests.post(f"{API}/auth/register", json={"name": "Admin", "email": ADMIN["email"], "password": "Admin@2026", "role": "customer"}, timeout=20)
    assert r.status_code in (200, 400)
    lr = _login(ADMIN)
    assert lr["user"]["role"] == "admin"


def test_login_invalid():
    r = requests.post(f"{API}/auth/login", json={"email": "nope@example.com", "password": "x"}, timeout=15)
    assert r.status_code == 401


# ---------- Booking flow ----------
@pytest.fixture(scope="module")
def created_booking(customer_auth):
    body = {"service_key": "full", "address": "TEST_addr", "notes": "TEST", "lat": 33.31, "lng": 44.36}
    r = requests.post(f"{API}/bookings", headers=_h(customer_auth["token"]), json=body, timeout=20)
    assert r.status_code == 200, r.text
    return r.json()


def test_create_booking_price(created_booking):
    assert created_booking["service_key"] == "full"
    assert created_booking["price"] == 10000
    assert created_booking["status"] == "pending"


def test_customer_only_sees_own(customer_auth, created_booking):
    r = requests.get(f"{API}/bookings", headers=_h(customer_auth["token"]), timeout=15)
    assert r.status_code == 200
    items = r.json()
    ids = [b["id"] for b in items]
    assert created_booking["id"] in ids
    assert all(b["customer_id"] == customer_auth["user"]["id"] for b in items)


def test_barber_sees_pending(barber_auth, created_booking):
    r = requests.get(f"{API}/bookings", headers=_h(barber_auth["token"]), timeout=15)
    assert r.status_code == 200
    ids = [b["id"] for b in r.json()]
    assert created_booking["id"] in ids


def test_barber_accepts_applies_fee(barber_auth, created_booking):
    bid = created_booking["id"]
    r = requests.patch(f"{API}/bookings/{bid}/status", headers=_h(barber_auth["token"]), json={"status": "accepted"}, timeout=20)
    assert r.status_code == 200, r.text
    fresh = r.json()
    assert fresh["status"] == "accepted"
    assert fresh["platform_fee"] == 1000
    assert fresh["barber_earnings"] == 10000 - 1000
    assert fresh["barber_id"] == barber_auth["user"]["id"]


def test_wallet_barber(barber_auth):
    r = requests.get(f"{API}/wallet/me", headers=_h(barber_auth["token"]), timeout=15)
    assert r.status_code == 200
    w = r.json()
    assert w["role"] == "barber"
    assert w["jobs"] >= 1
    assert w["fees"] >= 1000
    assert w["net"] == w["gross"] - w["fees"]


def test_wallet_customer(customer_auth):
    r = requests.get(f"{API}/wallet/me", headers=_h(customer_auth["token"]), timeout=15)
    assert r.status_code == 200
    w = r.json()
    assert w["role"] == "customer"
    assert "spent" in w


def test_wallet_admin(admin_tok):
    r = requests.get(f"{API}/wallet/me", headers=_h(admin_tok), timeout=15)
    assert r.status_code == 200
    w = r.json()
    assert w["role"] == "admin"
    assert "platform_revenue" in w


# ---------- Chat ----------
def test_chat_user_sends_admin_replies(customer_auth, admin_tok):
    cid = customer_auth["user"]["id"]
    r1 = requests.post(f"{API}/chat/messages", headers=_h(customer_auth["token"]), json={"text": "TEST_hi"}, timeout=15)
    assert r1.status_code == 200
    assert r1.json()["sender"] == "user"

    # admin replies
    r2 = requests.post(f"{API}/chat/messages", headers=_h(admin_tok), json={"text": "TEST_reply", "user_id": cid}, timeout=15)
    assert r2.status_code == 200
    assert r2.json()["sender"] == "admin"
    assert r2.json()["user_id"] == cid

    # admin without user_id => 400
    rbad = requests.post(f"{API}/chat/messages", headers=_h(admin_tok), json={"text": "no target"}, timeout=15)
    assert rbad.status_code == 400

    # user sees own
    r3 = requests.get(f"{API}/chat/messages", headers=_h(customer_auth["token"]), timeout=15)
    assert r3.status_code == 200
    assert all(m["user_id"] == cid for m in r3.json())

    # admin sees threads
    r4 = requests.get(f"{API}/chat/messages", headers=_h(admin_tok), timeout=15)
    assert r4.status_code == 200
    threads = r4.json()
    assert isinstance(threads, list) and len(threads) >= 1
    assert "messages" in threads[0]


# ---------- Admin ----------
def test_admin_stats(admin_tok):
    r = requests.get(f"{API}/admin/stats", headers=_h(admin_tok), timeout=15)
    assert r.status_code == 200
    s = r.json()
    for k in ("users", "customers", "barbers", "bookings", "revenue"):
        assert k in s
    assert s["revenue"] >= 1000  # we created and accepted one


def test_admin_stats_forbidden_for_customer(customer_auth):
    r = requests.get(f"{API}/admin/stats", headers=_h(customer_auth["token"]), timeout=15)
    assert r.status_code == 403


def test_admin_users_and_bookings(admin_tok):
    r1 = requests.get(f"{API}/admin/users", headers=_h(admin_tok), timeout=15)
    assert r1.status_code == 200 and isinstance(r1.json(), list)
    r2 = requests.get(f"{API}/admin/bookings", headers=_h(admin_tok), timeout=15)
    assert r2.status_code == 200 and isinstance(r2.json(), list)


def test_update_profile(customer_auth):
    r = requests.patch(f"{API}/auth/me", headers=_h(customer_auth["token"]), json={"bio": "TEST_bio", "lat": 33.31, "lng": 44.36}, timeout=15)
    assert r.status_code == 200
    assert r.json().get("bio") == "TEST_bio"
