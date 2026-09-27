"""在无 .env 的临时目录运行纯 Mock 回归，禁止写字节码与 pytest 缓存。"""
import os
import sys
from pathlib import Path

backend = Path(r"E:\code\hope\hope-service")
sys.dont_write_bytecode = True
os.chdir(Path(__file__).resolve().parent)
sys.path.insert(0, str(backend))
import pytest

files = sys.argv[1:] or ["tests/test_admin_login.py"]
raise SystemExit(pytest.main([str(backend / name) for name in files] + [
    "--rootdir=" + str(backend), "--noconftest", "-p", "no:cacheprovider", "-q", "--tb=short",
]))
