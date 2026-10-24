import fs from 'node:fs';
import assert from 'node:assert/strict';
const data = JSON.parse(fs.readFileSync(new URL('../data/nets.json', import.meta.url)));
assert.equal(data.schemaVersion, 1);
assert.ok(Array.isArray(data.nets) && data.nets.length > 0);
assert.equal(new Set(data.nets.map(n => n.id)).size, data.nets.length);
for (const n of data.nets) {
  assert.ok(n.id && n.name && Array.isArray(n.days));
  if (n.distanceApplicable) {
    assert.ok(Number.isFinite(Number(n.lat)) && Number.isFinite(Number(n.lng)));
  }
}
function km(a,b,c,d){const R=6371,p=x=>x*Math.PI/180,x=p(c-a),y=p(d-b),h=Math.sin(x/2)**2+Math.cos(p(a))*Math.cos(p(c))*Math.sin(y/2)**2;return 2*R*Math.asin(Math.sqrt(h));}
const ed={lat:55.9533,lng:-3.1883};
const local=data.nets.filter(n=>n.distanceApplicable).sort((a,b)=>km(ed.lat,ed.lng,a.lat,a.lng)-km(ed.lat,ed.lng,b.lat,b.lng));
assert.match(local[0].region,/Edinburgh|Lothian/i);
console.log(`PASS: ${data.nets.length} nets validated; Edinburgh proximity test passed.`);
