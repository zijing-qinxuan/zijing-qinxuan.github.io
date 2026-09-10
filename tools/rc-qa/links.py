"""Read-only checks for published developer page and guest navigation links."""
from pathlib import Path
from html import unescape
import re,json,concurrent.futures,subprocess
from urllib.parse import quote
html=(Path(__file__).resolve().parents[2]/'index.html').read_text()
urls=sorted(set(unescape(u) for u in re.findall(r'href="(https://[^\"]+)"',html) if 'maps.' in u or '/maps/' in u or 'photos.' in u))
urls.append('https://zijing-qinxuan.github.io/dev.html')
def check(url):
 result=subprocess.run(['curl','-sSL','--max-time','20','-o','/dev/null','-w','%{http_code}',quote(url,safe=':/?=&%')],capture_output=True,text=True)
 return {'url':url,'status':int(result.stdout or 0),'error':result.stderr.strip() or None}
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:results=list(pool.map(check,urls))
Path('/private/tmp/wedding-rc-links.json').write_text(json.dumps(results,ensure_ascii=False,indent=2))
for r in results:print(r['url'],r.get('status',r.get('error')))
