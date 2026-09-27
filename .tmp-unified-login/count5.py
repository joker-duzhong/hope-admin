from pathlib import Path
import subprocess
root=Path(r'E:\code\hope\hope-service'); f='core/dependencies.py'; b=(root/f).read_bytes(); o=subprocess.check_output(['git','show','HEAD:'+f],cwd=root); print('cur',b.count(bytes([13,10])),b.count(bytes([10])),'orig',o.count(bytes([13,10])),o.count(bytes([10])))
