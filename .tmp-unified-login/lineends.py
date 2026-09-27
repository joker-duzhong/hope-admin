from pathlib import Path
import subprocess
root=Path(r'E:\code\hope\hope-service'); f='core/dependencies.py'
for src,label in [(subprocess.check_output(['git','show','HEAD:'+f],cwd=root),'head'),((root/f).read_bytes(),'cur')]:
 lines=src.decode().splitlines(keepends=True)
 print(label)
 for i in range(10,55):
  if i<len(lines): print(i+1,repr(lines[i][-5:]))
