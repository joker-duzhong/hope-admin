from pathlib import Path
import hashlib, json
root=Path(r'E:\code\hope\hope-service').resolve(); stage=Path(r'E:\code\hope\hope-admin\.tmp-unified-login\backend').resolve()
manifest=json.loads((stage/'manifest.json').read_text(encoding='utf-8'))
# update docs wording and preserve UTF-8
p=stage/'docs/identity-login-api.md'; s=p.read_text(encoding='utf-8'); s=s.replace('平台后台可通过手机验证码或扫码申请 `admin_web` 范围，仍仅允许超级管理员；AuraKey 管理后台使用 `hope_aurakey`，不能跨范围使用 Token。','统一管理后台可通过手机验证码或扫码申请 `admin_web` 范围，允许超级管理员或已登记业务管理角色；AuraKey 管理路由仍校验 `hope_aurakey` 下的 `aurakey_admin`，不能跨范围使用普通业务 Token。'); p.write_text(s,encoding='utf-8',newline='\n')
# update manifest docs hash
for x in manifest:
 if x['path']=='docs/identity-login-api.md': x['after_sha256']=hashlib.sha256((stage/x['path']).read_bytes()).hexdigest()
# add tracked test exception
p=stage/'.gitignore'; p.write_text((root/'.gitignore').read_text(encoding='utf-8')+'!tests/test_admin_login.py\n',encoding='utf-8',newline='\n');
manifest.append({'path':'.gitignore','before_sha256':hashlib.sha256((root/'.gitignore').read_bytes()).hexdigest(),'after_sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
(stage/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
# normalize staged source files to CRLF to match existing repo convention
for x in manifest:
 p=stage/x['path'];
 if p.suffix in {'.py','.md','.gitignore'}:
  t=p.read_text(encoding='utf-8').replace('\r\n','\n').replace('\n','\r\n'); p.write_text(t,encoding='utf-8',newline='')
# refresh hashes after newline conversion
for x in manifest: x['after_sha256']=hashlib.sha256((stage/x['path']).read_bytes()).hexdigest()
(stage/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
print('stage patched')
