"""Standard-library HTML/assets and JavaScript translation checks; Pillow verifies images if available."""
from pathlib import Path
from html.parser import HTMLParser
from collections import Counter
import re, json, subprocess
ROOT=Path(__file__).resolve().parents[2]
class Page(HTMLParser):
 def __init__(self): super().__init__(convert_charrefs=True); self.ids=[];self.refs=[];self.images=[];self.stack=[];self.errors=[]
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if 'id' in a:self.ids.append(a['id'])
  if tag=='img':self.images.append(a)
  if tag=='button' and 'type' not in a:self.errors.append('button missing type')
  for k in ('src','href'):
   if k in a:self.refs.append(a[k])
  for k in ('aria-controls','aria-labelledby','aria-describedby'):
   for v in a.get(k,'').split():self.refs.append('#'+v)
  if tag not in {'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'}:self.stack.append(tag)
 def handle_endtag(self,tag):
  if not self.stack or self.stack[-1]!=tag:self.errors.append('misnested '+tag)
  else:self.stack.pop()
p=Page();p.feed((ROOT/'index.html').read_text())
assert not p.errors,p.errors
assert not p.stack,p.stack
assert not [x for x,n in Counter(p.ids).items() if n>1]
for ref in p.refs:
 if ref.startswith('#'):assert ref[1:] in p.ids or ref=='#gallery',ref
 elif not re.match(r'[a-z]+:',ref):assert (ROOT/ref.split('?')[0]).exists(),ref
for a in p.images:assert ('width' in a and 'height' in a),a
for n in ['script.js','i18n.js','assets/wedding-gallery/wedding-gallery-data.js','tools/wedding-gallery-builder/build-gallery.js']:
 subprocess.run(['node','--check',str(ROOT/n)],check=True)
js='''const fs=require('fs'),vm=require('vm');const c={window:{}};vm.createContext(c);vm.runInContext(fs.readFileSync('assets/wedding-gallery/wedding-gallery-data.js','utf8'),c);console.log(JSON.stringify(c.window.weddingGallery));'''
gallery=json.loads(subprocess.check_output(['node','-e',js],cwd=ROOT,text=True));assert len(gallery)==22
try:
 from PIL import Image
 for a in p.images:
  if a.get('src','').startswith('assets/'):
   with Image.open(ROOT/a['src']) as im: im.verify()
 for item in gallery:
  for kind,dims in [('thumb',('width','height')),('large',('largeWidth','largeHeight'))]:
   with Image.open(ROOT/item[kind]) as im:
    assert im.size==(item[dims[0]],item[dims[1]]),(item['id'],kind,im.size)
    im.verify()
except ImportError: print('Pillow unavailable: skipped binary decoding')
print(json.dumps({'html':'PASS','references':'PASS','duplicateIDs':0,'galleryCount':len(gallery),'thumbBytes':sum((ROOT/g['thumb']).stat().st_size for g in gallery),'largeBytes':sum((ROOT/g['large']).stat().st_size for g in gallery)},indent=2))
