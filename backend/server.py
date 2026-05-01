from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import jwt
import bcrypt
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Literal
import uuid
from datetime import datetime, timezone, timedelta


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ.get('JWT_SECRET', 'halaq-delivery-super-secret-key-2026')
JWT_ALG = 'HS256'
PLATFORM_FEE = 1000  # IQD per accepted job
ADMIN_EMAIL = "tr1zfrhoy@gmail.com"

app = FastAPI()
api_router = APIRouter(prefix="/api")


# ---------------- Models ----------------
Role = Literal["customer", "barber", "admin"]
BookingStatus = Literal["pending", "accepted", "in_progress", "completed", "cancelled", "rejected"]


class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: EmailStr
    phone: Optional[str] = None
    role: Role = "customer"
    avatar: Optional[str] = None
    bio: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    rating: float = 5.0
    is_online: bool = True
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class RegisterIn(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None
    role: Role = "customer"
    lat: Optional[float] = None
    lng: Optional[float] = None


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class UpdateProfileIn(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    bio: Optional[str] = None
    avatar: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    is_online: Optional[bool] = None


class Booking(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_id: str
    customer_name: str
    customer_phone: Optional[str] = None
    barber_id: Optional[str] = None
    barber_name: Optional[str] = None
    service_key: str
    service_name: str
    price: int
    address: str
    notes: Optional[str] = None
    lat: float
    lng: float
    status: BookingStatus = "pending"
    platform_fee: int = 0
    barber_earnings: int = 0
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class CreateBookingIn(BaseModel):
    service_key: str
    address: str
    notes: Optional[str] = None
    lat: float
    lng: float
    barber_id: Optional[str] = None


class StatusUpdateIn(BaseModel):
    status: BookingStatus


class ChatMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str  # customer/barber id
    user_name: str
    user_role: Role
    sender: Literal["user", "admin"]
    text: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class SendMessageIn(BaseModel):
    text: str
    user_id: Optional[str] = None  # used by admin to reply to a user


# Service catalog
SERVICES = [
    {"key": "full", "name_ar": "حلاقة كاملة", "price": 10000, "icon": "Scissors"},
    {"key": "kids", "name_ar": "حلاقة أطفال", "price": 5000, "icon": "Baby"},
    {"key": "beard", "name_ar": "تحديد لحية / شعر", "price": 5000, "icon": "User"},
    {"key": "blowdry", "name_ar": "سشوار", "price": 5000, "icon": "Wind"},
]
SERVICE_BY_KEY = {s["key"]: s for s in SERVICES}


# ---------------- Auth helpers ----------------
def hash_pw(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()


def verify_pw(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False


def create_token(user_id: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(days=30),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


async def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")
    token = authorization.split(" ", 1)[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def require_role(*roles):
    async def _dep(user: dict = Depends(get_current_user)) -> dict:
        if user["role"] not in roles:
            raise HTTPException(status_code=403, detail="Forbidden")
        return user
    return _dep


# ---------------- Routes ----------------
@api_router.get("/")
async def root():
    return {"app": "halaq-delivery", "status": "ok"}


@api_router.get("/services")
async def get_services():
    return SERVICES


@api_router.post("/auth/register")
async def register(payload: RegisterIn):
    existing = await db.users.find_one({"email": payload.email})
    if existing:
        raise HTTPException(status_code=400, detail="البريد مستخدم مسبقا")
    role = payload.role
    # Auto-assign admin role for the configured admin email
    if payload.email.lower() == ADMIN_EMAIL.lower():
        role = "admin"
    user = User(
        name=payload.name,
        email=payload.email,
        phone=payload.phone,
        role=role,
        lat=payload.lat,
        lng=payload.lng,
    )
    doc = user.model_dump()
    doc["password"] = hash_pw(payload.password)
    await db.users.insert_one(doc)
    token = create_token(user.id, role)
    return {"token": token, "user": user.model_dump()}


@api_router.post("/auth/login")
async def login(payload: LoginIn):
    doc = await db.users.find_one({"email": payload.email})
    if not doc or not verify_pw(payload.password, doc.get("password", "")):
        raise HTTPException(status_code=401, detail="بيانات الدخول غير صحيحة")
    doc.pop("_id", None)
    doc.pop("password", None)
    token = create_token(doc["id"], doc["role"])
    return {"token": token, "user": doc}


@api_router.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return user


@api_router.patch("/auth/me")
async def update_me(payload: UpdateProfileIn, user: dict = Depends(get_current_user)):
    update = {k: v for k, v in payload.model_dump().items() if v is not None}
    if update:
        await db.users.update_one({"id": user["id"]}, {"$set": update})
    fresh = await db.users.find_one({"id": user["id"]}, {"_id": 0, "password": 0})
    return fresh


# ---------- Barbers (customer browses) ----------
@api_router.get("/barbers")
async def list_barbers():
    barbers = await db.users.find(
        {"role": "barber"}, {"_id": 0, "password": 0}
    ).to_list(500)
    return barbers


# ---------- Bookings ----------
@api_router.post("/bookings")
async def create_booking(payload: CreateBookingIn, user: dict = Depends(require_role("customer"))):
    svc = SERVICE_BY_KEY.get(payload.service_key)
    if not svc:
        raise HTTPException(status_code=400, detail="خدمة غير معروفة")
    barber_name = None
    if payload.barber_id:
        b = await db.users.find_one({"id": payload.barber_id, "role": "barber"}, {"_id": 0})
        if b:
            barber_name = b["name"]
    booking = Booking(
        customer_id=user["id"],
        customer_name=user["name"],
        customer_phone=user.get("phone"),
        barber_id=payload.barber_id,
        barber_name=barber_name,
        service_key=svc["key"],
        service_name=svc["name_ar"],
        price=svc["price"],
        address=payload.address,
        notes=payload.notes,
        lat=payload.lat,
        lng=payload.lng,
    )
    await db.bookings.insert_one(booking.model_dump())
    return booking.model_dump()


@api_router.get("/bookings")
async def list_bookings(user: dict = Depends(get_current_user)):
    if user["role"] == "customer":
        q = {"customer_id": user["id"]}
    elif user["role"] == "barber":
        q = {"$or": [{"barber_id": user["id"]}, {"barber_id": None, "status": "pending"}]}
    else:
        q = {}
    items = await db.bookings.find(q, {"_id": 0}).sort("created_at", -1).to_list(500)
    return items


@api_router.patch("/bookings/{booking_id}/status")
async def update_booking_status(booking_id: str, payload: StatusUpdateIn, user: dict = Depends(get_current_user)):
    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="الطلب غير موجود")

    update = {"status": payload.status}

    if payload.status == "accepted" and user["role"] == "barber":
        # Deduct platform fee + claim booking for barber
        update["barber_id"] = user["id"]
        update["barber_name"] = user["name"]
        update["platform_fee"] = PLATFORM_FEE
        update["barber_earnings"] = booking["price"] - PLATFORM_FEE

    if payload.status in ("rejected", "cancelled") and user["role"] == "customer":
        if booking["customer_id"] != user["id"]:
            raise HTTPException(status_code=403, detail="Forbidden")

    await db.bookings.update_one({"id": booking_id}, {"$set": update})
    fresh = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    return fresh


# ---------- Wallet ----------
@api_router.get("/wallet/me")
async def my_wallet(user: dict = Depends(get_current_user)):
    if user["role"] == "barber":
        completed = await db.bookings.find(
            {"barber_id": user["id"], "status": {"$in": ["accepted", "in_progress", "completed"]}},
            {"_id": 0},
        ).to_list(500)
        gross = sum(b["price"] for b in completed)
        fees = sum(b.get("platform_fee", 0) for b in completed)
        net = sum(b.get("barber_earnings", 0) for b in completed)
        return {
            "role": "barber",
            "jobs": len(completed),
            "gross": gross,
            "fees": fees,
            "net": net,
            "items": completed,
        }
    elif user["role"] == "customer":
        items = await db.bookings.find(
            {"customer_id": user["id"]}, {"_id": 0}
        ).to_list(500)
        spent = sum(b["price"] for b in items if b["status"] in ("accepted", "completed", "in_progress"))
        return {"role": "customer", "spent": spent, "jobs": len(items), "items": items}
    else:
        all_b = await db.bookings.find({}, {"_id": 0}).to_list(2000)
        revenue = sum(b.get("platform_fee", 0) for b in all_b)
        return {"role": "admin", "platform_revenue": revenue, "total_jobs": len(all_b)}


# ---------- Support Chat ----------
@api_router.get("/chat/messages")
async def get_my_messages(user: dict = Depends(get_current_user)):
    if user["role"] == "admin":
        # All threads grouped by user
        msgs = await db.chat_messages.find({}, {"_id": 0}).sort("created_at", 1).to_list(5000)
        threads = {}
        for m in msgs:
            threads.setdefault(m["user_id"], {"user_id": m["user_id"], "user_name": m["user_name"], "user_role": m["user_role"], "messages": []})
            threads[m["user_id"]]["messages"].append(m)
        return list(threads.values())
    msgs = await db.chat_messages.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", 1).to_list(2000)
    return msgs


@api_router.post("/chat/messages")
async def send_message(payload: SendMessageIn, user: dict = Depends(get_current_user)):
    if user["role"] == "admin":
        if not payload.user_id:
            raise HTTPException(status_code=400, detail="user_id required")
        target = await db.users.find_one({"id": payload.user_id}, {"_id": 0, "password": 0})
        if not target:
            raise HTTPException(status_code=404, detail="user not found")
        msg = ChatMessage(
            user_id=target["id"],
            user_name=target["name"],
            user_role=target["role"],
            sender="admin",
            text=payload.text,
        )
    else:
        msg = ChatMessage(
            user_id=user["id"],
            user_name=user["name"],
            user_role=user["role"],
            sender="user",
            text=payload.text,
        )
    await db.chat_messages.insert_one(msg.model_dump())
    return msg.model_dump()


# ---------- Admin ----------
@api_router.get("/admin/stats")
async def admin_stats(user: dict = Depends(require_role("admin"))):
    users_count = await db.users.count_documents({})
    customers = await db.users.count_documents({"role": "customer"})
    barbers = await db.users.count_documents({"role": "barber"})
    bookings = await db.bookings.count_documents({})
    pending = await db.bookings.count_documents({"status": "pending"})
    completed = await db.bookings.count_documents({"status": "completed"})
    accepted = await db.bookings.count_documents({"status": "accepted"})
    all_b = await db.bookings.find({}, {"_id": 0}).to_list(5000)
    revenue = sum(b.get("platform_fee", 0) for b in all_b)
    return {
        "users": users_count,
        "customers": customers,
        "barbers": barbers,
        "bookings": bookings,
        "pending": pending,
        "accepted": accepted,
        "completed": completed,
        "revenue": revenue,
    }


@api_router.get("/admin/users")
async def admin_users(user: dict = Depends(require_role("admin"))):
    users = await db.users.find({}, {"_id": 0, "password": 0}).to_list(2000)
    return users


@api_router.get("/admin/bookings")
async def admin_bookings(user: dict = Depends(require_role("admin"))):
    items = await db.bookings.find({}, {"_id": 0}).sort("created_at", -1).to_list(2000)
    return items


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
