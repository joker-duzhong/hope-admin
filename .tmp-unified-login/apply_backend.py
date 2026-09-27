"""将已准备且校验过的固定补丁应用到已获用户授权的后端仓库。"""
import hashlib
import json
from pathlib import Path

ROOT = Path(r"E:\code\hope\hope-service").resolve()
STAGE = Path(__file__).resolve().parent / "backend"
manifest = json.loads((STAGE / "manifest.json").read_text(encoding="utf-8"))
for item in manifest:
    target = (ROOT / item["path"]).resolve()
    source = (STAGE / item["path"]).resolve()
    if not target.is_relative_to(ROOT) or not source.is_relative_to(STAGE):
        raise RuntimeError("补丁路径越界")
    actual = hashlib.sha256(target.read_bytes()).hexdigest() if target.exists() else None
    if actual != item["before_sha256"]:
        raise RuntimeError(f"原文件已变化，拒绝覆盖: {item['path']}")
    if hashlib.sha256(source.read_bytes()).hexdigest() != item["after_sha256"]:
        raise RuntimeError(f"补丁内容已变化: {item['path']}")
for item in manifest:
    target = ROOT / item["path"]
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text((STAGE / item["path"]).read_text(encoding="utf-8"), encoding="utf-8", newline="\n")
print(f"已应用 {len(manifest)} 个后端文件。")
