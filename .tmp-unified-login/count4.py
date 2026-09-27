from pathlib import Path
import subprocess
root=Path(r'E:\code\hope\hope-service')
for f in ['core/dependencies.py','apps/aurakey/admin_router.py','core/auth_scope.py']:
 b=(root/f).read_bytes(); o=subprocess.check_output(['git','show','HEAD:'+f],cwd=root); print(f,'cur',b.count(bytes([13,10])),b.count(bytes([10])),'orig',o.count(bytes([13,10])),o.count(bytes([10])))
