from pathlib import Path
p=Path(r'E:\code\hope\hope-service\core\dependencies.py'); b=p.read_bytes(); start=b.index(b'def bind_admin_app'); end=b.index(b'async def get_app_key',start); seg=b[start:end].replace(b'\r\n',b'\n'); p.write_bytes(b[:start]+seg+b[end:])
