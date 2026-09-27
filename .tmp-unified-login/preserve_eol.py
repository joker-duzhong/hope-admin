from pathlib import Path
from difflib import SequenceMatcher
root=Path(r'E:\code\hope\hope-service')
files=['.gitignore','CHANGELOG.md','apps/aurakey/admin_router.py','aurakey_identity_test.py','core/auth_scope.py','core/dependencies.py','core/users/dependencies.py','core/users/scan_service.py','core/users/services.py','docs/identity-login-api.md','docs/scan-login-api.md','tests/test_scan_login.py']
for rel in files:
 p=root/rel; orig=p.read_bytes(); current=p.read_text(encoding='utf-8').splitlines(); original_text=orig.decode('utf-8'); original_keep=original_text.splitlines(keepends=True); original=[x.rstrip('\r\n') for x in original_keep]
 styles=[x[len(x.rstrip('\r\n')):] for x in original_keep]; default='\r\n' if styles.count('\r\n')>=styles.count('\n') else '\n'
 out=[]; matcher=SequenceMatcher(None, original, current, autojunk=False)
 for tag,i1,i2,j1,j2 in matcher.get_opcodes():
  if tag=='equal': out.extend(original_keep[i1:i2]); continue
  if tag=='delete': continue
  style=styles[i1] if i1 < len(styles) and styles[i1] else (styles[i1-1] if i1 else default)
  if not style: style=default
  for line in current[j1:j2]: out.append(line+style)
 new=''.join(out).encode('utf-8')
 if not new.endswith((b'\n', b'\r')) and current: new += (b'\r\n' if default=='\r\n' else b'\n')
 p.write_bytes(new)
 print(rel, len(orig), '=>', len(new))
