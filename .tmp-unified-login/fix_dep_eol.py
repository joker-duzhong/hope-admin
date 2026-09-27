from pathlib import Path
p=Path(r'E:\code\hope\hope-service\core\dependencies.py'); s=p.read_text(encoding='utf-8'); start=s.index('def bind_admin_app'); end=s.index('async def get_app_key',start); segment=s[start:end].replace('\r\n','\n'); s=s[:start]+segment+s[end:]; p.write_text(s,encoding='utf-8',newline='')
