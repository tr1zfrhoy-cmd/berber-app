from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header, UploadFile, File, Response, Query
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

from storage import put_image, get_image, init_storage as _init_storage


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALG = 'HS256'
DEFAULT_PLATFORM_FEE = 500  # IQD per accepted job (default, overridable via /api/admin/settings)
ADMIN_PHONE = os.environ.get('ADMIN_PHONE', '07812059874')
ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', 'tr1zfrhoy@gmail.com')
SUPPORT_WHATSAPP = os.environ.get('SUPPORT_WHATSAPP', '9647512614831')
DEFAULT_SUPPORT_EMAIL = os.environ.get('SUPPORT_EMAIL', ADMIN_EMAIL)

# Default legal pages — admin can override any time from the dashboard. Both
# strings support the placeholders {{whatsapp}} and {{email}} which are
# substituted with the current values at render time, so the contact info
# stays in sync with the rest of the admin settings.
DEFAULT_PRIVACY_TEXT = """# سياسة الخصوصية

## مقدمة
نحن في تطبيق **Berber** نلتزم بحماية خصوصية مستخدمينا (الزبائن والحلاقين). توضّح هذه السياسة أنواع البيانات التي نجمعها، وكيفية استخدامها وحمايتها، وحقوقك تجاه بياناتك. باستخدامك للتطبيق فإنك توافق على ما ورد في هذه السياسة.

## ١. البيانات التي نجمعها
- بيانات الحساب: الاسم الكامل، رقم الهاتف، كلمة المرور (مشفرة).
- بيانات الموقع الجغرافي: نطلب موقعك لتحديد الحلاقين القريبين منك ولإيصال الخدمة لباب بيتك.
- بيانات الخدمة: تفاصيل الحجوزات، الأسعار، التقييمات، والمحادثات مع الدعم.
- بيانات الحلاق: الصورة الشخصية، معرض الأعمال، نبذة عن الحلاق، رصيد المحفظة.
- البيانات التقنية: نوع الجهاز، نظام التشغيل، عنوان IP، وأوقات الاستخدام (لأغراض الأمان).

## ٢. كيفية استخدام البيانات
- تنفيذ خدمة الحجز وإيصال الحلاق إلى موقعك.
- تواصل الحلاق مع الزبون عبر الهاتف لتأكيد الموقع.
- حساب العمولات وإدارة محفظة الحلاق.
- تحسين تجربة المستخدم وتطوير ميزات جديدة.
- حماية المنصة من الاحتيال وسوء الاستخدام.
- إرسال إشعارات عن الطلبات الجديدة وحالة الحجز.

## ٣. مشاركة البيانات
لا نبيع بياناتك لأي طرف ثالث. نشارك جزءاً محدوداً منها فقط في الحالات التالية:
- بين الزبون والحلاق لإتمام الحجز (الاسم، الهاتف، العنوان).
- مع الإدارة لمعالجة الشكاوى وإدارة المحفظة.
- عند طلب رسمي من جهة قضائية أو حكومية مختصة.

## ٤. تخزين البيانات وحمايتها
- البيانات مخزّنة على خوادم آمنة بنظام تشفير حديث.
- كلمات المرور مشفّرة بـ bcrypt (لا يمكن استرجاعها كنص واضح).
- جلسات الدخول مؤمّنة عبر JWT.
- نطبّق إجراءات أمنية قياسية لمنع الوصول غير المصرّح به.

## ٥. حقوقك
- حق الوصول: يمكنك الاطلاع على بياناتك في صفحة الإعدادات.
- حق التعديل: يمكنك تحديث الاسم، الهاتف، الصورة، والموقع في أي وقت.
- حق الحذف: يمكنك طلب حذف حسابك وكل بياناتك بمراسلة الدعم على واتساب.
- حق التحكم بالإشعارات: يمكنك تفعيلها أو إيقافها من إعدادات جهازك.

## ٦. الإشعارات والموقع
نطلب صلاحيات الموقع والإشعارات لتقديم الخدمة بأفضل شكل. يمكنك رفضها أو إلغاؤها في أي وقت من إعدادات نظام التشغيل، علماً أن بعض الميزات قد تتأثر.

## ٧. حماية الأطفال
التطبيق غير موجّه للأطفال دون 13 سنة. لا نجمع بيانات منهم عمداً.

## ٨. التغييرات على هذه السياسة
قد نُحدّث هذه السياسة من وقت لآخر. سنُشعرك بالتغييرات الجوهرية عبر التطبيق أو الواتساب. الاستمرار في استخدام التطبيق بعد التحديث يُعدّ موافقة على السياسة الجديدة.

## ٩. التواصل معنا
لأي استفسار أو طلب يخص خصوصيتك، يرجى التواصل معنا عبر:
- واتساب: {{whatsapp}}
- بريد إلكتروني: {{email}}
"""

DEFAULT_TERMS_TEXT = """# الشروط والأحكام

## مقدمة
مرحباً بك في تطبيق **Berber** — منصة لتقديم خدمات الحلاقة المنزلية في العراق. باستخدامك للتطبيق فإنك توافق على الشروط والأحكام التالية. إذا لم توافق على أي بند منها، يُرجى عدم استخدام التطبيق.

## ١. تعريفات
- «التطبيق»: تطبيق Berber بنسختيه الموقع والموبايل.
- «الزبون»: الشخص الذي يطلب خدمة الحلاقة عبر التطبيق.
- «الحلاق»: مقدّم الخدمة المسجّل في التطبيق.
- «الإدارة»: الجهة المالكة والمشغّلة للتطبيق.
- «العمولة»: المبلغ الذي تستقطعه الإدارة من الحلاق عند قبول الحجز.

## ٢. الخدمات
يقدّم التطبيق وسيلة تواصل بين الزبائن والحلاقين. الخدمات الفعلية تُنفّذ من قبل الحلاق المستقل، وأسعارها تُعرض داخل التطبيق وقد تتغيّر من وقت لآخر بقرار من الإدارة.

## ٣. التسجيل والحساب
- يجب أن تكون 18 سنة فأكثر لاستخدام التطبيق.
- تتعهّد بتقديم بيانات صحيحة (الاسم، رقم الهاتف).
- أنت مسؤول عن سرية كلمة المرور وأي نشاط يتم عبر حسابك.
- يحق للإدارة إيقاف أو حذف أي حساب يخالف الشروط.

## ٤. التزامات الزبون
- تقديم عنوان دقيق وكامل لتسهيل وصول الحلاق.
- التواجد في الموقع المتفق عليه عند الموعد.
- دفع المبلغ المستحق نقداً للحلاق عند انتهاء الخدمة.
- احترام الحلاق وعدم تعرّضه لأي إساءة.
- تقييم الخدمة بصدق بعد إتمامها.

## ٥. التزامات الحلاق
- تقديم خدمة بمستوى مهني عالٍ ونظافة كاملة.
- الالتزام بالموعد والتواجد في موقع الزبون في الوقت المتفق.
- استخدام أدوات معقّمة وآمنة.
- احترام الزبون وحفظ خصوصيته.
- عدم طلب أي مبلغ إضافي عن السعر المعلَن في التطبيق.
- الاحتفاظ برصيد كافٍ في المحفظة لتغطية العمولة عن كل حجز يقبله.

## ٦. الأسعار والعمولة
- الأسعار قابلة للتعديل من قبل الإدارة وتُعرض داخل التطبيق دائماً بسعرها الحالي.
- تُحتسب عمولة ثابتة على الحلاق عن كل حجز يقبله، وتُخصم من رصيد محفظته آلياً.
- إذا لم يكن في محفظة الحلاق رصيد كافٍ، فلن يستطيع قبول الطلب حتى يقوم بشحنها.
- شحن المحفظة يتم بالتواصل مع الإدارة عبر واتساب الرسمي ({{whatsapp}}).
- الإدارة غير مسؤولة عن أي اتفاقات نقدية مباشرة بين الزبون والحلاق خارج التطبيق.

## ٧. الإلغاء والاسترجاع
- يمكن للزبون إلغاء الحجز قبل قبوله من الحلاق.
- بعد قبول الحلاق للحجز، يجب التواصل مع الحلاق مباشرة لأي تعديل.
- العمولة المخصومة من الحلاق غير قابلة للاسترجاع إلا بقرار صريح من الإدارة في حال خطأ تقني مثبت.
- في حال نزاع، يُرجى التواصل مع الدعم خلال 48 ساعة من وقت الحجز.

## ٨. التقييمات والمحتوى
- التقييمات يجب أن تكون صادقة ومحترمة.
- يُمنع نشر محتوى مسيء أو عنصري أو مخالف للقانون.
- للإدارة الحق في حذف أي تقييم أو محتوى مخالف دون إشعار.
- صور معرض الحلاق يجب أن تكون من أعماله الشخصية فقط.

## ٩. المسؤولية
- Berber منصّة وساطة، وليست طرفاً في تنفيذ الخدمة الفعلية.
- الحلاق مسؤول مسؤولية كاملة عن جودة عمله وأي ضرر ينتج عنه.
- الإدارة غير مسؤولة عن خلافات شخصية بين الزبون والحلاق إلا بحدود ما يخص استخدام التطبيق.
- في حالات الطوارئ أو الحوادث، تواصل مع الجهات المختصة فوراً.

## ١٠. حظر الاستخدام
يُمنع استخدام التطبيق لأي غرض غير مشروع، وكذلك يُمنع محاولة اختراق النظام أو استخدامه لإرسال محتوى ضار أو احتيالي. أي مخالفة قد تؤدي إلى إيقاف الحساب فوراً واتخاذ الإجراءات القانونية.

## ١١. تعديل الشروط
يحق للإدارة تعديل هذه الشروط في أي وقت. سيتم إشعارك بأي تعديل جوهري عبر التطبيق. استمرارك في استخدام التطبيق بعد التعديل يُعدّ موافقةً على الشروط الجديدة.

## ١٢. الاختصاص القضائي
تخضع هذه الشروط لقوانين جمهورية العراق. أي نزاع ينشأ عنها يُحال إلى المحاكم العراقية المختصة.

## ١٣. التواصل
لأي استفسار أو شكوى:
- واتساب: {{whatsapp}}
- بريد إلكتروني: {{email}}
"""

DEFAULT_SERVICES = [
    {"key": "full", "name_ar": "حلاقة كاملة", "price": 10000, "icon": "Scissors", "active": True},
    {"key": "kids", "name_ar": "حلاقة أطفال", "price": 5000, "icon": "Baby", "active": True},
    {"key": "hair", "name_ar": "شعر فقط", "price": 5000, "icon": "User", "active": True},
    {"key": "beard", "name_ar": "لحية فقط", "price": 5000, "icon": "Scissors", "active": True},
    {"key": "blowdry", "name_ar": "سشوار", "price": 5000, "icon": "Wind", "active": True},
]


def normalize_phone(p: str) -> str:
    """Strip spaces/dashes, keep digits and leading +."""
    if not p:
        return p
    p = p.strip().replace(" ", "").replace("-", "")
    return p

app = FastAPI()
api_router = APIRouter(prefix="/api")


# ---------------- Models ----------------
Role = Literal["customer", "barber", "admin"]
BookingStatus = Literal["pending", "accepted", "in_progress", "completed", "cancelled", "rejected"]


class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    phone: str
    email: Optional[str] = None
    role: Role = "customer"
    avatar: Optional[str] = None
    bio: Optional[str] = None
    portfolio: List[str] = Field(default_factory=list)
    wallet_balance: int = 0  # barber's commission wallet
    lat: Optional[float] = None
    lng: Optional[float] = None
    rating_avg: float = 0.0
    rating_count: int = 0
    is_online: bool = True
    notifications_enabled: bool = False
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class RegisterIn(BaseModel):
    name: str
    phone: str
    password: str
    email: Optional[str] = None
    role: Role = "customer"
    lat: Optional[float] = None
    lng: Optional[float] = None


class LoginIn(BaseModel):
    phone: str
    password: str


class UpdateProfileIn(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    bio: Optional[str] = None
    avatar: Optional[str] = None
    portfolio: Optional[List[str]] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    is_online: Optional[bool] = None
    notifications_enabled: Optional[bool] = None


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


# Dynamic service catalog & settings (stored in DB, editable by admin)
SETTINGS_KEY = "global"


async def get_settings() -> dict:
    s = await db.settings.find_one({"_key": SETTINGS_KEY}, {"_id": 0})
    if not s:
        s = {
            "_key": SETTINGS_KEY,
            "platform_fee": DEFAULT_PLATFORM_FEE,
            "services": DEFAULT_SERVICES,
            "support_whatsapp": SUPPORT_WHATSAPP,
            "support_email": DEFAULT_SUPPORT_EMAIL,
            "privacy_text": DEFAULT_PRIVACY_TEXT,
            "terms_text": DEFAULT_TERMS_TEXT,
        }
        await db.settings.insert_one(s)
        s.pop("_id", None)
    # Ensure all keys exist
    s.setdefault("platform_fee", DEFAULT_PLATFORM_FEE)
    s.setdefault("services", DEFAULT_SERVICES)
    s.setdefault("support_whatsapp", SUPPORT_WHATSAPP)
    s.setdefault("support_email", DEFAULT_SUPPORT_EMAIL)
    s.setdefault("privacy_text", DEFAULT_PRIVACY_TEXT)
    s.setdefault("terms_text", DEFAULT_TERMS_TEXT)
    return s


async def get_service(key: str) -> Optional[dict]:
    s = await get_settings()
    for svc in s.get("services", []):
        if svc["key"] == key and svc.get("active", True):
            return svc
    return None


class SettingsIn(BaseModel):
    platform_fee: Optional[int] = None
    services: Optional[List[dict]] = None
    support_whatsapp: Optional[str] = None
    support_email: Optional[str] = None
    privacy_text: Optional[str] = None
    terms_text: Optional[str] = None


class WalletTopupIn(BaseModel):
    amount: int  # positive = add, negative = deduct
    reason: Optional[str] = None


class RatingIn(BaseModel):
    stars: int  # 1..5
    comment: Optional[str] = None


class ChangePasswordIn(BaseModel):
    current_password: str
    new_password: str


class AdminSetPasswordIn(BaseModel):
    new_password: str


class CreateReportIn(BaseModel):
    barber_id: str
    image_url: str
    reason: Optional[str] = None


class UpdateReportIn(BaseModel):
    status: Literal["pending", "reviewed", "dismissed"]


class Report(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    barber_id: str
    barber_name: Optional[str] = None
    image_url: str
    reporter_id: str
    reporter_name: str
    reporter_role: Role
    reason: Optional[str] = None
    status: Literal["pending", "reviewed", "dismissed"] = "pending"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class WalletTxn(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    amount: int
    kind: Literal["topup", "commission", "adjust"]
    reason: Optional[str] = None
    booking_id: Optional[str] = None
    balance_after: int = 0
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


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
@api_router.post("/admin/wipe")
async def admin_wipe(payload: dict, user: dict = Depends(require_role("admin"))):
    """Dangerous, admin-only: wipe all users + dependent collections. Used to
    sync a clean preview state into production. Requires an explicit
    confirmation phrase in the request body to prevent accidents."""
    if (payload or {}).get("confirm") != "WIPE_ALL_USERS_AND_DATA":
        raise HTTPException(status_code=400, detail="confirmation phrase missing")

    targets = ["users", "bookings", "chat_messages", "wallet_txns", "ratings", "reports", "files"]
    result = {}
    for col in targets:
        r = await db[col].delete_many({})
        result[col] = r.deleted_count
    # The caller (current admin) just deleted themselves. Their token becomes
    # invalid on next request. They must re-register with ADMIN_PHONE to get
    # the admin role back.
    logger.warning(f"DB wipe executed by {user.get('phone')}: {result}")
    return {"wiped": result, "note": "Re-register with ADMIN_PHONE to restore admin access"}


@api_router.get("/")
async def root():
    return {"app": "halaq-delivery", "status": "ok"}


@api_router.get("/services")
async def get_services():
    s = await get_settings()
    return [x for x in s.get("services", DEFAULT_SERVICES) if x.get("active", True)]


@api_router.get("/config")
async def get_config():
    """Public config: support whatsapp, email, and visible services."""
    s = await get_settings()
    return {
        "support_whatsapp": s.get("support_whatsapp", SUPPORT_WHATSAPP),
        "support_email": s.get("support_email", DEFAULT_SUPPORT_EMAIL),
        "platform_fee": s.get("platform_fee", DEFAULT_PLATFORM_FEE),
    }


def _render_legal(template: str, s: dict) -> str:
    """Substitute {{whatsapp}} and {{email}} placeholders with live values."""
    if not template:
        return ""
    whatsapp = s.get("support_whatsapp", SUPPORT_WHATSAPP)
    email = s.get("support_email", DEFAULT_SUPPORT_EMAIL)
    return template.replace("{{whatsapp}}", whatsapp).replace("{{email}}", email)


@api_router.get("/legal/privacy")
async def get_privacy_policy():
    """Public — full Privacy Policy text with live placeholders substituted."""
    s = await get_settings()
    return {
        "text": _render_legal(s.get("privacy_text", DEFAULT_PRIVACY_TEXT), s),
        "support_whatsapp": s.get("support_whatsapp", SUPPORT_WHATSAPP),
        "support_email": s.get("support_email", DEFAULT_SUPPORT_EMAIL),
    }


@api_router.get("/legal/terms")
async def get_terms():
    """Public — full Terms & Conditions text with live placeholders substituted."""
    s = await get_settings()
    return {
        "text": _render_legal(s.get("terms_text", DEFAULT_TERMS_TEXT), s),
        "support_whatsapp": s.get("support_whatsapp", SUPPORT_WHATSAPP),
        "support_email": s.get("support_email", DEFAULT_SUPPORT_EMAIL),
    }


@api_router.post("/auth/register")
async def register(payload: RegisterIn):
    phone = normalize_phone(payload.phone)
    if not phone or len(phone) < 6:
        raise HTTPException(status_code=400, detail="رقم الهاتف غير صالح")
    existing = await db.users.find_one({"phone": phone})
    if existing:
        raise HTTPException(status_code=400, detail="رقم الهاتف مستخدم مسبقا")
    # Public register cannot self-elevate to admin; only the configured admin phone becomes admin.
    role = payload.role if payload.role in ("customer", "barber") else "customer"
    if phone == ADMIN_PHONE:
        role = "admin"
    user = User(
        name=payload.name,
        phone=phone,
        email=payload.email,
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
    phone = normalize_phone(payload.phone)
    doc = await db.users.find_one({"phone": phone})
    if not doc or not verify_pw(payload.password, doc.get("password", "")):
        raise HTTPException(status_code=401, detail="رقم الهاتف أو كلمة المرور غير صحيحة")
    doc.pop("_id", None)
    doc.pop("password", None)
    token = create_token(doc["id"], doc["role"])
    return {"token": token, "user": doc}


@api_router.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return user


@api_router.post("/auth/change-password")
async def change_password(payload: ChangePasswordIn, user: dict = Depends(get_current_user)):
    """User updates their own password. Requires the current password."""
    if not payload.new_password or len(payload.new_password) < 4:
        raise HTTPException(status_code=400, detail="كلمة المرور الجديدة قصيرة جداً (4 أحرف على الأقل)")
    doc = await db.users.find_one({"id": user["id"]})
    if not doc or not verify_pw(payload.current_password, doc.get("password", "")):
        raise HTTPException(status_code=401, detail="كلمة المرور الحالية غير صحيحة")
    await db.users.update_one({"id": user["id"]}, {"$set": {"password": hash_pw(payload.new_password)}})
    return {"ok": True}


@api_router.post("/admin/users/{user_id}/password")
async def admin_reset_password(user_id: str, payload: AdminSetPasswordIn, user: dict = Depends(require_role("admin"))):
    """Admin resets any user's password without needing the current one."""
    if not payload.new_password or len(payload.new_password) < 4:
        raise HTTPException(status_code=400, detail="كلمة المرور قصيرة جداً (4 أحرف على الأقل)")
    target = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    if not target:
        raise HTTPException(status_code=404, detail="المستخدم غير موجود")
    await db.users.update_one({"id": user_id}, {"$set": {"password": hash_pw(payload.new_password)}})
    return {"ok": True, "user_id": user_id, "name": target.get("name")}


@api_router.patch("/auth/me")
async def update_me(payload: UpdateProfileIn, user: dict = Depends(get_current_user)):
    update = {k: v for k, v in payload.model_dump().items() if v is not None}
    # If phone is being changed, ensure uniqueness
    if "phone" in update:
        normalized = normalize_phone(update["phone"])
        if not normalized or len(normalized) < 6:
            raise HTTPException(status_code=400, detail="رقم الهاتف غير صالح")
        clash = await db.users.find_one({"phone": normalized, "id": {"$ne": user["id"]}})
        if clash:
            raise HTTPException(status_code=400, detail="رقم الهاتف مستخدم مسبقا")
        update["phone"] = normalized
    # Accept full URLs or internal storage paths (e.g., "/api/files/berber/...")
    def _ok(u: str) -> bool:
        return isinstance(u, str) and (u.startswith(("http://", "https://", "/api/files/")) or u == "")

    if "avatar" in update and update["avatar"] and not _ok(update["avatar"]):
        raise HTTPException(status_code=400, detail="رابط صورة غير صالح")
    if "portfolio" in update and update["portfolio"]:
        for u in update["portfolio"]:
            if not _ok(u):
                raise HTTPException(status_code=400, detail="رابط صورة غير صالح في المعرض")
    if update:
        await db.users.update_one({"id": user["id"]}, {"$set": update})
    fresh = await db.users.find_one({"id": user["id"]}, {"_id": 0, "password": 0})
    return fresh


# ---------- Barbers (customer browses) ----------
@api_router.get("/barbers")
async def list_barbers():
    barbers = await db.users.find(
        {"role": "barber"}, {"_id": 0, "password": 0}
    ).limit(100).to_list(100)
    return barbers


# ---------- Bookings ----------
@api_router.post("/bookings")
async def create_booking(payload: CreateBookingIn, user: dict = Depends(require_role("customer"))):
    svc = await get_service(payload.service_key)
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
        # If barber is offline, only show their already-claimed bookings (no new pending).
        if user.get("is_online", True):
            q = {"$or": [{"barber_id": user["id"]}, {"barber_id": None, "status": "pending"}]}
        else:
            q = {"barber_id": user["id"]}
    else:
        q = {}
    items = await db.bookings.find(q, {"_id": 0}).sort("created_at", -1).limit(100).to_list(100)
    return items


@api_router.patch("/bookings/{booking_id}/status")
async def update_booking_status(booking_id: str, payload: StatusUpdateIn, user: dict = Depends(get_current_user)):
    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="الطلب غير موجود")

    update = {"status": payload.status}

    if payload.status == "accepted" and user["role"] == "barber":
        if booking["status"] != "pending" or (booking.get("barber_id") and booking["barber_id"] != user["id"]):
            raise HTTPException(status_code=409, detail="الطلب غير متاح للقبول")
        settings = await get_settings()
        fee = int(settings.get("platform_fee", DEFAULT_PLATFORM_FEE))
        current_balance = int(user.get("wallet_balance", 0) or 0)
        if current_balance < fee:
            raise HTTPException(
                status_code=402,
                detail=f"رصيد محفظتك غير كافٍ ({current_balance:,} د.ع). الرجاء شحن المحفظة — تحتاج {fee:,} د.ع لقبول الطلب."
            )
        new_balance = current_balance - fee
        await db.users.update_one({"id": user["id"]}, {"$set": {"wallet_balance": new_balance}})
        await db.wallet_txns.insert_one(WalletTxn(
            user_id=user["id"],
            amount=-fee,
            kind="commission",
            reason=f"عمولة حجز: {booking['service_name']}",
            booking_id=booking["id"],
            balance_after=new_balance,
        ).model_dump())
        update["barber_id"] = user["id"]
        update["barber_name"] = user["name"]
        update["platform_fee"] = fee
        update["barber_earnings"] = booking["price"]  # keeps 100% of price (fee already deducted from wallet)

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
        bookings = await db.bookings.find(
            {"barber_id": user["id"], "status": {"$in": ["accepted", "in_progress", "completed"]}},
            {"_id": 0},
        ).sort("created_at", -1).limit(50).to_list(50)
        # Aggregate gross / fees over the same scope (only on barber's bookings)
        agg = await db.bookings.aggregate([
            {"$match": {"barber_id": user["id"], "status": {"$in": ["accepted", "in_progress", "completed"]}}},
            {"$group": {"_id": None, "gross": {"$sum": "$price"}, "fees": {"$sum": "$platform_fee"}, "n": {"$sum": 1}}},
        ]).to_list(1)
        gross = agg[0]["gross"] if agg else 0
        fees = agg[0]["fees"] if agg else 0
        n = agg[0]["n"] if agg else 0
        txns = await db.wallet_txns.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).limit(50).to_list(50)
        fresh = await db.users.find_one({"id": user["id"]}, {"_id": 0, "password": 0})
        return {
            "role": "barber",
            "jobs": n,
            "gross": gross,
            "fees": fees,
            "balance": int(fresh.get("wallet_balance", 0) or 0),
            "items": bookings,
            "txns": txns,
        }
    elif user["role"] == "customer":
        items = await db.bookings.find(
            {"customer_id": user["id"]}, {"_id": 0}
        ).sort("created_at", -1).limit(50).to_list(50)
        spent_agg = await db.bookings.aggregate([
            {"$match": {"customer_id": user["id"], "status": {"$in": ["accepted", "completed", "in_progress"]}}},
            {"$group": {"_id": None, "spent": {"$sum": "$price"}, "n": {"$sum": 1}}},
        ]).to_list(1)
        spent = spent_agg[0]["spent"] if spent_agg else 0
        total_jobs = await db.bookings.count_documents({"customer_id": user["id"]})
        return {"role": "customer", "spent": spent, "jobs": total_jobs, "items": items}
    else:
        rev_agg = await db.bookings.aggregate([
            {"$group": {"_id": None, "revenue": {"$sum": "$platform_fee"}, "n": {"$sum": 1}}},
        ]).to_list(1)
        revenue = rev_agg[0]["revenue"] if rev_agg else 0
        total_jobs = rev_agg[0]["n"] if rev_agg else 0
        return {"role": "admin", "platform_revenue": revenue, "total_jobs": total_jobs}


# ---------- Support Chat ----------
@api_router.get("/chat/messages")
async def get_my_messages(user: dict = Depends(get_current_user)):
    if user["role"] == "admin":
        # All threads grouped by user (latest 500 messages)
        msgs = await db.chat_messages.find({}, {"_id": 0}).sort("created_at", -1).limit(500).to_list(500)
        msgs.reverse()  # chronological order
        threads = {}
        for m in msgs:
            threads.setdefault(m["user_id"], {"user_id": m["user_id"], "user_name": m["user_name"], "user_role": m["user_role"], "messages": []})
            threads[m["user_id"]]["messages"].append(m)
        return list(threads.values())
    msgs = await db.chat_messages.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).limit(100).to_list(100)
    msgs.reverse()
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
    rev_agg = await db.bookings.aggregate([
        {"$group": {"_id": None, "revenue": {"$sum": "$platform_fee"}}}
    ]).to_list(1)
    revenue = rev_agg[0]["revenue"] if rev_agg else 0
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
async def admin_users(user: dict = Depends(require_role("admin")), skip: int = 0, limit: int = 100):
    limit = min(max(int(limit), 1), 200)
    users = await db.users.find({}, {"_id": 0, "password": 0}).sort("created_at", -1).skip(int(skip)).limit(limit).to_list(limit)
    return users


@api_router.get("/admin/bookings")
async def admin_bookings(user: dict = Depends(require_role("admin")), skip: int = 0, limit: int = 100):
    limit = min(max(int(limit), 1), 200)
    items = await db.bookings.find({}, {"_id": 0}).sort("created_at", -1).skip(int(skip)).limit(limit).to_list(limit)
    return items


# ---------- Admin: Settings (dynamic prices / commission) ----------
@api_router.get("/admin/settings")
async def admin_get_settings(user: dict = Depends(require_role("admin"))):
    return await get_settings()


@api_router.patch("/admin/settings")
async def admin_update_settings(payload: SettingsIn, user: dict = Depends(require_role("admin"))):
    update = {k: v for k, v in payload.model_dump().items() if v is not None}
    if update:
        await db.settings.update_one(
            {"_key": SETTINGS_KEY},
            {"$set": update, "$setOnInsert": {"_key": SETTINGS_KEY}},
            upsert=True,
        )
    return await get_settings()


# ---------- Admin: Barber detail + wallet top-up ----------
@api_router.get("/admin/users/{user_id}")
async def admin_get_user(user_id: str, user: dict = Depends(require_role("admin"))):
    u = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    if not u:
        raise HTTPException(status_code=404, detail="المستخدم غير موجود")
    bookings = await db.bookings.find(
        {"$or": [{"customer_id": user_id}, {"barber_id": user_id}]}, {"_id": 0}
    ).sort("created_at", -1).limit(100).to_list(100)
    txns = await db.wallet_txns.find({"user_id": user_id}, {"_id": 0}).sort("created_at", -1).limit(100).to_list(100)
    return {"user": u, "bookings": bookings, "txns": txns}


@api_router.delete("/admin/users/{user_id}")
async def admin_delete_user(user_id: str, user: dict = Depends(require_role("admin"))):
    """Permanently delete a user (customer or barber) and their related records.
    Admin cannot delete themselves. Admin accounts cannot be deleted via this endpoint."""
    target = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    if not target:
        raise HTTPException(status_code=404, detail="المستخدم غير موجود")
    if target["id"] == user["id"]:
        raise HTTPException(status_code=400, detail="لا يمكن حذف حسابك")
    if target.get("role") == "admin":
        raise HTTPException(status_code=400, detail="لا يمكن حذف حساب مدير")

    # Delete the user
    await db.users.delete_one({"id": user_id})
    # Cleanup related data so DB stays consistent
    deleted_bookings = await db.bookings.delete_many({"$or": [{"customer_id": user_id}, {"barber_id": user_id}]})
    deleted_txns = await db.wallet_txns.delete_many({"user_id": user_id})
    deleted_chat = await db.chat_messages.delete_many({"user_id": user_id})
    deleted_ratings = await db.ratings.delete_many({"$or": [{"customer_id": user_id}, {"barber_id": user_id}]})
    return {
        "deleted": True,
        "user_id": user_id,
        "name": target["name"],
        "removed": {
            "bookings": deleted_bookings.deleted_count,
            "wallet_txns": deleted_txns.deleted_count,
            "chat_messages": deleted_chat.deleted_count,
            "ratings": deleted_ratings.deleted_count,
        },
    }




@api_router.post("/admin/users/{user_id}/wallet")
async def admin_topup_wallet(user_id: str, payload: WalletTopupIn, user: dict = Depends(require_role("admin"))):
    target = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    if not target:
        raise HTTPException(status_code=404, detail="المستخدم غير موجود")
    if target.get("role") != "barber":
        raise HTTPException(status_code=400, detail="المحفظة متاحة للحلاقين فقط")
    current = int(target.get("wallet_balance", 0) or 0)
    new_balance = current + int(payload.amount)
    if new_balance < 0:
        new_balance = 0
    await db.users.update_one({"id": user_id}, {"$set": {"wallet_balance": new_balance}})
    kind = "topup" if payload.amount >= 0 else "adjust"
    await db.wallet_txns.insert_one(WalletTxn(
        user_id=user_id,
        amount=int(payload.amount),
        kind=kind,
        reason=payload.reason or ("شحن يدوي" if payload.amount >= 0 else "خصم يدوي"),
        balance_after=new_balance,
    ).model_dump())
    fresh = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    return {"user": fresh, "balance": new_balance}


# ---------- Ratings ----------
@api_router.post("/bookings/{booking_id}/rating")
async def rate_booking(booking_id: str, payload: RatingIn, user: dict = Depends(require_role("customer"))):
    if payload.stars < 1 or payload.stars > 5:
        raise HTTPException(status_code=400, detail="التقييم يجب أن يكون بين 1 و 5")
    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="الطلب غير موجود")
    if booking["customer_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="ليس طلبك")
    if booking["status"] != "completed":
        raise HTTPException(status_code=400, detail="يمكن التقييم بعد اكتمال الخدمة فقط")
    if not booking.get("barber_id"):
        raise HTTPException(status_code=400, detail="لا يوجد حلاق لتقييمه")
    existing = await db.ratings.find_one({"booking_id": booking_id})
    if existing:
        raise HTTPException(status_code=400, detail="تم التقييم مسبقا")
    rating_doc = {
        "id": str(uuid.uuid4()),
        "booking_id": booking_id,
        "customer_id": user["id"],
        "customer_name": user["name"],
        "barber_id": booking["barber_id"],
        "stars": payload.stars,
        "comment": payload.comment,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.ratings.insert_one(rating_doc)
    # Incremental rating aggregate (avoid scanning all ratings)
    barber_doc = await db.users.find_one({"id": booking["barber_id"]}, {"_id": 0, "rating_avg": 1, "rating_count": 1})
    old_count = int(barber_doc.get("rating_count", 0) or 0)
    old_avg = float(barber_doc.get("rating_avg", 0) or 0)
    new_count = old_count + 1
    new_avg = (old_avg * old_count + payload.stars) / new_count
    await db.users.update_one(
        {"id": booking["barber_id"]},
        {"$set": {"rating_avg": round(new_avg, 2), "rating_count": new_count}},
    )
    rating_doc.pop("_id", None)
    return rating_doc


@api_router.get("/barbers/{barber_id}")
async def barber_profile(barber_id: str):
    b = await db.users.find_one({"id": barber_id, "role": "barber"}, {"_id": 0, "password": 0, "wallet_balance": 0})
    if not b:
        raise HTTPException(status_code=404, detail="الحلاق غير موجود")
    ratings = await db.ratings.find({"barber_id": barber_id}, {"_id": 0}).sort("created_at", -1).limit(20).to_list(20)
    return {"barber": b, "ratings": ratings}


# ---------- Reports (content moderation for Barber Works feed) ----------
@api_router.post("/reports")
async def create_report(payload: CreateReportIn, user: dict = Depends(get_current_user)):
    """Any authenticated user (customer/barber) can flag an image in the feed."""
    barber = await db.users.find_one({"id": payload.barber_id, "role": "barber"}, {"_id": 0, "password": 0})
    if not barber:
        raise HTTPException(status_code=404, detail="الحلاق غير موجود")
    if not payload.image_url:
        raise HTTPException(status_code=400, detail="رابط الصورة مطلوب")
    report = Report(
        barber_id=payload.barber_id,
        barber_name=barber.get("name"),
        image_url=payload.image_url,
        reporter_id=user["id"],
        reporter_name=user["name"],
        reporter_role=user["role"],
        reason=(payload.reason or "").strip() or None,
    )
    await db.reports.insert_one(report.model_dump())
    return report.model_dump()


@api_router.get("/admin/reports")
async def admin_list_reports(status: Optional[str] = None, user: dict = Depends(require_role("admin"))):
    q = {}
    if status in ("pending", "reviewed", "dismissed"):
        q["status"] = status
    items = await db.reports.find(q, {"_id": 0}).sort("created_at", -1).limit(300).to_list(300)
    pending_count = await db.reports.count_documents({"status": "pending"})
    return {"items": items, "pending": pending_count}


@api_router.patch("/admin/reports/{report_id}")
async def admin_update_report(report_id: str, payload: UpdateReportIn, user: dict = Depends(require_role("admin"))):
    rep = await db.reports.find_one({"id": report_id}, {"_id": 0})
    if not rep:
        raise HTTPException(status_code=404, detail="البلاغ غير موجود")
    await db.reports.update_one({"id": report_id}, {"$set": {"status": payload.status}})
    fresh = await db.reports.find_one({"id": report_id}, {"_id": 0})
    return fresh


# ---------- File Upload (avatars + portfolio images) ----------
@api_router.post("/upload")
async def upload_file(file: UploadFile = File(...), kind: str = "img", user: dict = Depends(get_current_user)):
    """Upload an image. Returns {"url": "/api/files/<path>", "path": "..."}."""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="نوع الملف يجب أن يكون صورة")
    ext = "jpg"
    if file.filename and "." in file.filename:
        ext = file.filename.rsplit(".", 1)[-1].lower()
    data = await file.read()
    if len(data) > 6 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="حجم الصورة كبير (الحد 6MB)")
    kind = "avatar" if kind == "avatar" else "portfolio" if kind == "portfolio" else "img"
    try:
        result = put_image(user["id"], data, ext, kind=kind)
    except Exception as e:
        logger.error(f"Upload failed: {e}")
        raise HTTPException(status_code=500, detail="فشل رفع الصورة، حاول مجدداً")
    # Record file in DB as soft-deletable reference
    await db.files.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "storage_path": result["path"],
        "content_type": result.get("content_type"),
        "size": result.get("size", len(data)),
        "kind": kind,
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"url": f"/api/files/{result['path']}", "path": result["path"], "size": result.get("size")}


@api_router.get("/files/{path:path}")
async def serve_file(path: str):
    """Public file proxy — images can be loaded via plain <img src>. Path includes app prefix."""
    rec = await db.files.find_one({"storage_path": path, "is_deleted": False}, {"_id": 0})
    try:
        data, ctype = get_image(path)
    except Exception as exc:
        logger.warning(f"File not found {path}: {exc}")
        raise HTTPException(status_code=404, detail="الصورة غير موجودة")
    media_type = rec.get("content_type") if rec else ctype
    return Response(content=data, media_type=media_type or "image/jpeg",
                    headers={"Cache-Control": "public, max-age=86400"})


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


@app.on_event("startup")
async def startup_init_storage():
    try:
        _init_storage()
        logger.info("Object storage ready")
    except Exception as e:
        logger.warning(f"Storage init deferred: {e}")
