"""准备可审阅的后端补丁；此脚本只写前端工作区内的临时目录。"""
import hashlib
import json
from pathlib import Path

ROOT = Path(r"E:\code\hope\hope-service")
STAGE = Path(__file__).resolve().parent / "backend"
changes = {}


def edit(path, old, new):
    content = changes.get(path, (ROOT / path).read_text(encoding="utf-8"))
    if content.count(old) != 1:
        raise RuntimeError(f"补丁定位不唯一: {path}")
    changes[path] = content.replace(old, new)


changes["core/auth_scope.py"] = '''from contextvars import ContextVar
from typing import TYPE_CHECKING

from fastapi import HTTPException

from core.apps_config import REGISTERED_APPS

if TYPE_CHECKING:
    from core.roles.models import Role
    from core.users.models import User

PASSPORT_SCOPE = "passport"
ADMIN_SCOPE = "admin_web"
# 只登记已有管理接口的业务角色，不根据名称或后缀推断后台权限。
ADMIN_ROLE_CODES: dict[str, frozenset[str]] = {
    "hope_aurakey": frozenset({"aurakey_admin"}),
}
current_app_key: ContextVar[str | None] = ContextVar("current_app_key", default=None)
current_admin_app: ContextVar[str | None] = ContextVar("current_admin_app", default=None)


def is_admin_role(role: "Role") -> bool:
    app = REGISTERED_APPS.get(role.scope)
    return bool(
        role.is_active and not role.is_deleted
        and app is not None and app.is_active
        and role.code in ADMIN_ROLE_CODES.get(role.scope, frozenset())
    )


def validate_scope(scope: str, user: "User | None" = None) -> None:
    if scope != PASSPORT_SCOPE:
        app = REGISTERED_APPS.get(scope)
        if app is None or not app.is_active:
            raise HTTPException(403, "应用不存在或已停用")
    if user is not None and scope == ADMIN_SCOPE:
        if not user.is_superuser and not any(is_admin_role(role) for role in user.roles):
            raise HTTPException(403, "当前账号没有管理后台访问权限")


def validate_access_scope(payload: dict) -> str:
    scope = payload.get("app_scope")
    if not isinstance(scope, str) or not scope:
        raise HTTPException(401, "登录版本已更新，请重新登录")
    validate_scope(scope)
    expected = current_app_key.get()
    if expected is not None and expected != scope:
        # 仅服务器显式标记的业务管理路由接受统一后台凭据。
        if scope != ADMIN_SCOPE or current_admin_app.get() != expected:
            raise HTTPException(403, "当前登录凭据不适用于此应用，请在对应应用重新登录")
        validate_scope(expected)
    return scope
'''

edit("core/dependencies.py", "from core.auth_scope import current_app_key as _current_app_key", "from core.auth_scope import current_admin_app, current_app_key as _current_app_key")
edit("core/dependencies.py", "async def get_app_key() -> str:", '''def bind_admin_app(app_key: str) -> Callable[[], AsyncGenerator[None, None]]:
    """仅在业务管理路由内允许统一后台凭据，保留原业务上下文。"""
    if app_key not in REGISTERED_APPS:
        raise ValueError(f"未知应用配置: {app_key}")

    async def _bind() -> AsyncGenerator[None, None]:
        if _current_app_key.get() != app_key:
            raise HTTPException(500, "管理接口未绑定正确的应用上下文")
        token = current_admin_app.set(app_key)
        try:
            yield
        finally:
            current_admin_app.reset(token)

    return _bind


async def get_app_key() -> str:''')
edit("core/users/dependencies.py", "from core.auth_scope import validate_access_scope, validate_scope", "from core.auth_scope import ADMIN_SCOPE, current_admin_app, validate_access_scope, validate_scope")
edit("core/users/dependencies.py", "    同时匹配当前凭据的应用 scope 和角色 code。", "    同时匹配目标应用 scope 和角色 code，统一后台仅采用显式管理路由的 scope。")
edit("core/users/dependencies.py", '''        user_role_codes = {role.code for role in current_user.roles
                           if role.is_active and not role.is_deleted and role.scope == request.state.auth_scope}''', '''        role_scope = request.state.auth_scope
        if role_scope == ADMIN_SCOPE and current_admin_app.get() is not None:
            role_scope = current_admin_app.get()
        user_role_codes = {role.code for role in current_user.roles
                           if role.is_active and not role.is_deleted and role.scope == role_scope}''')
edit("core/users/services.py", "from core.auth_scope import PASSPORT_SCOPE, validate_scope", "from core.auth_scope import ADMIN_SCOPE, PASSPORT_SCOPE, is_admin_role, validate_scope")
edit("core/users/services.py", '''        active_role_ids = {role.id for role in user.roles if role.is_active and not role.is_deleted}
        data.roles = [role for role in data.roles if role.scope == app_scope and role.id in active_role_ids]''', '''        if app_scope == ADMIN_SCOPE:
            active_role_ids = {role.id for role in user.roles if is_admin_role(role)}
        else:
            active_role_ids = {role.id for role in user.roles
                               if role.is_active and not role.is_deleted and role.scope == app_scope}
        data.roles = [role for role in data.roles if role.id in active_role_ids]''')
edit("core/users/scan_service.py", "from core.apps_config import AppConfig, REGISTERED_APPS", "from core.apps_config import AppConfig, REGISTERED_APPS\nfrom core.auth_scope import validate_scope")
edit("core/users/scan_service.py", '''    if app_key == "admin_web" and not user.is_superuser:
        raise HTTPException(403, "该应用仅允许超级管理员登录")''', '''    validate_scope(app_key, user)''')
edit("apps/aurakey/admin_router.py", "from core.database import get_db", "from core.database import get_db\nfrom core.dependencies import bind_admin_app")
edit("apps/aurakey/admin_router.py", 'router = APIRouter(prefix="/admin", tags=["AuraKey B端管理"])', '''router = APIRouter(
    prefix="/admin", tags=["AuraKey B端管理"],
    dependencies=[Depends(bind_admin_app("hope_aurakey"))],
)''')
edit("aurakey_identity_test.py", '("admin_web", True, None, False, 403),', '("admin_web", True, None, False, 200),\n        ("admin_web", False, "hope_aurakey", True, 200),')
edit("aurakey_identity_test.py", "test_admin_session_requires_business_scope_and_live_permission", "test_admin_session_requires_supported_scope_and_live_permission")
edit("tests/test_scan_login.py", "test_admin_app_requires_superuser_at_confirmation_and_exchange", "test_admin_app_revalidates_management_permission_at_confirmation_and_exchange")
edit("docs/scan-login-api.md", "- 应用列表包含已启用的 admin_web；后台应用确认和兑换时都要求超级管理员。所有应用确认和兑换均要求账号正常且已绑定手机号。", "- 统一管理后台固定使用 admin_web，无需在登录前选择业务。确认和兑换时均要求超级管理员，或持有已启用业务的有效管理角色；当前支持 (hope_aurakey, aurakey_admin)。角色停用、删除或业务停用后不再允许凭该角色登录。所有应用确认和兑换均要求账号正常且已绑定手机号。")
edit("docs/scan-login-api.md", 'PC 选取一个 app_key 后发起 POST /api/v1/auth/scan/sessions，例如：\n\n    {"app_key": "hope_aurakey"}', '统一管理后台直接发起 POST /api/v1/auth/scan/sessions，无需展示应用选择器：\n\n    {"app_key": "admin_web"}\n\n独立业务客户端仍使用自己的 app_key，不改变现有业务登录范围。')
edit("docs/scan-login-api.md", "成功 data 包含 access_token、refresh_token、token_type、app_scope、user；app_scope 来自该会话 app_key，user 含 phone、needs_phone_binding 和当前应用有效角色。PC 使用这些新凭据建立自己的登录状态，并自行跳转。", "成功 data 包含 access_token、refresh_token、token_type、app_scope、user；app_scope 来自该会话 app_key。业务登录的 user.roles 仅含当前应用有效角色；admin_web 返回所有已启用业务的有效管理角色，并保留各自真实 scope/code。PC 使用这些新凭据建立登录状态，根据 is_superuser 和 (scope, code) 展示有权访问的目录。")
edit("docs/scan-login-api.md", "- 新 Token 仅适用于会话指定业务；A Token 访问 B 路由被拒绝。app_key 不自动授予角色；业务接口继续执行角色和资源归属校验。", "- 普通业务 Token 仅适用于会话指定业务，A Token 访问 B 路由仍被拒绝。admin_web 仅能进入服务器显式标记的管理路由，并继续检查目标业务管理角色；不能进入普通用户端业务接口。系统管理接口仍仅允许超级管理员。app_key 不自动授予角色或升级普通业务 Token。")
edit("docs/identity-login-api.md", "登录响应 `user.roles` 仅含当前应用有效且未删除的角色，`openid` 不暴露其他应用的身份。", "业务登录响应 `user.roles` 仅含当前应用有效且未删除的角色；统一后台 `admin_web` 则返回所有已启用业务的有效管理角色，保留真实 `scope/code`。`openid` 不暴露其他应用的身份。")
changes["docs/identity-login-api.md"] += '''
## 统一管理后台登录

- 管理后台登录固定传 `app_key=admin_web`，扫码与手机验证码入口共用后台准入校验；前端无需选择 AuraKey 等业务。普通业务客户端仍使用各自的应用范围。
- 准入条件为超级管理员，或持有显式登记的有效业务管理角色；当前登记 `(hope_aurakey, aurakey_admin)`。不依据角色后缀推断权限，普通会员、同名但不同 scope 的角色、停用或删除角色均不授予后台权限，已停用的时空图书馆保持停用。
- `admin_web` 登录及 `/auth/me` 返回全部已启用业务的有效管理角色；前端以 `is_superuser` 和 `(scope, code)` 决定目录。新增管理业务时须同步登记明确的管理角色并标记该业务的管理路由。
- 统一后台 Token 仅在服务器通过 `bind_admin_app` 显式标记的管理路由跨应用使用。AuraKey `/aurakey/admin/*` 仍检查 `hope_aurakey` 下的 `aurakey_admin`，系统 `/admin/*` 仍仅允许超级管理员。`/aurakey/admin/session` 继续返回当前 AuraKey 范围资料，统一后台应以 `/auth/me` 刷新完整后台目录角色。
- 普通业务 Token 和 Passport Token 不能借此跨应用；统一后台 Token 不能进入用户端业务接口。客户端 Header、URL 或 app_key 不会改变路由权限。扫码确认、兑换、短信登录、Token 访问和刷新均重新检查当前后台准入资格；权限撤销后已有后台 Token 也会失效。
'''
edit("CHANGELOG.md", "# Changelog\n", '''# Changelog

## 2026-09-27 统一管理后台登录与角色目录

- 管理后台统一使用 `admin_web` 扫码或手机验证码登录，允许超级管理员及持有有效 AuraKey 管理角色的用户进入；登录与用户资料返回已启用业务的有效管理角色，供前端按真实 `(scope, code)` 展示目录。
- 仅显式标记的 AuraKey 管理路由接受统一后台 Token，并继续校验目标业务的管理角色；系统管理仍仅限超管，普通业务 Token 保持跨应用隔离，后台 Token 无法进入用户端业务接口。
- 复用登录、扫码确认/兑换、访问和刷新时的准入校验；新增隔离回归覆盖角色伪装、禁用/删除/撤销、跨应用拒绝、请求上下文清理及多业务管理角色资料。未改变停用应用配置，未连接真实短信、Redis 或数据库。
- 同步扫码及统一身份接入文档；新增 `tests/test_admin_login.py`，更新 AuraKey 管理会话与扫码权限回归。
''')

new_test = Path(__file__).resolve().parent / "test_admin_login.py"
if new_test.exists():
    changes["tests/test_admin_login.py"] = new_test.read_text(encoding="utf-8")

manifest = []
for relative, content in changes.items():
    original = ROOT / relative
    dest = STAGE / relative
    dest.parent.mkdir(parents=True, exist_ok=True)
    before = original.read_bytes() if original.exists() else None
    dest.write_text(content, encoding="utf-8", newline="\n")
    manifest.append({"path": relative, "before_sha256": hashlib.sha256(before).hexdigest() if before is not None else None,
                     "after_sha256": hashlib.sha256(dest.read_bytes()).hexdigest()})
(STAGE / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"已准备 {len(manifest)} 个后端文件，未写入后端仓库。")
