import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const size = 1024;
const output = process.argv[2] ?? 'ios/BideApp/Assets.xcassets/AppIcon.appiconset/AppIcon-1024.png';
const bg = [7, 15, 32];
const samples = [[0.25,0.25],[0.75,0.25],[0.25,0.75],[0.75,0.75]];

const clamp = (v, lo=0, hi=1) => Math.max(lo, Math.min(hi, v));
const mix = (a,b,t) => a + (b-a)*t;
function gradient(x) {
  const t = x / (size - 1);
  const c0=[33,215,255], c1=[55,145,255], c2=[135,92,246];
  const a = t < 0.48 ? c0 : c1;
  const b = t < 0.48 ? c1 : c2;
  const u = t < 0.48 ? t/0.48 : (t-0.48)/0.52;
  return a.map((v,i)=>Math.round(mix(v,b[i],u)));
}

const stem = { x1: 225, x2: 370, y1: 150, y2: 860, r: 72 };
const circle = { cx: 553, cy: 573, r: 307, inner: 184 };
function inRoundedRect(x,y,{x1,x2,y1,y2,r}) {
  const cx = clamp(x, x1+r, x2-r);
  const cy = clamp(y, y1+r, y2-r);
  const dx=x-cx, dy=y-cy;
  return dx*dx+dy*dy <= r*r;
}
function inMark(x,y) {
  const dx=x-circle.cx, dy=y-circle.cy;
  const outer=dx*dx+dy*dy <= circle.r*circle.r;
  const inner=dx*dx+dy*dy < circle.inner*circle.inner && x >= stem.x2-10;
  return inRoundedRect(x,y,stem) || (outer && !inner);
}
function segDist(x,y,x1,y1,x2,y2) {
  const vx=x2-x1, vy=y2-y1, wx=x-x1, wy=y-y1;
  const t=clamp((wx*vx+wy*vy)/(vx*vx+vy*vy));
  const px=x1+t*vx, py=y1+t*vy;
  return Math.hypot(x-px,y-py);
}
function inCode(x,y) {
  const th=17;
  // <  /  > as geometric strokes, centered in the bowl.
  return segDist(x,y,460,573,515,545)<=th ||
         segDist(x,y,460,573,515,601)<=th ||
         segDist(x,y,548,626,578,520)<=th ||
         segDist(x,y,675,573,620,545)<=th ||
         segDist(x,y,675,573,620,601)<=th;
}

const raw = Buffer.alloc((size*3+1)*size);
for (let y=0;y<size;y++) {
  const row = y*(size*3+1);
  raw[row]=0; // PNG filter: None
  for (let x=0;x<size;x++) {
    let markCount=0, codeCount=0;
    for (const [sx,sy] of samples) {
      if (inMark(x+sx,y+sy)) markCount++;
      if (inCode(x+sx,y+sy)) codeCount++;
    }
    const ma=markCount/samples.length;
    const ca=codeCount/samples.length;
    const g=gradient(x);
    let rgb=bg.map((v,i)=>Math.round(mix(v,g[i],ma)));
    const code=[190,246,255];
    rgb=rgb.map((v,i)=>Math.round(mix(v,code[i],ca)));
    const p=row+1+x*3;
    raw[p]=rgb[0]; raw[p+1]=rgb[1]; raw[p+2]=rgb[2];
  }
}

const crcTable = new Uint32Array(256);
for (let n=0;n<256;n++) {
  let c=n;
  for (let k=0;k<8;k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  crcTable[n]=c>>>0;
}
function crc32(buf) {
  let c=0xffffffff;
  for (const b of buf) c=crcTable[(c^b)&0xff]^(c>>>8);
  return (c^0xffffffff)>>>0;
}
function chunk(type,data) {
  const t=Buffer.from(type,'ascii');
  const out=Buffer.alloc(12+data.length);
  out.writeUInt32BE(data.length,0); t.copy(out,4); data.copy(out,8);
  out.writeUInt32BE(crc32(Buffer.concat([t,data])),8+data.length);
  return out;
}
const ihdr=Buffer.alloc(13);
ihdr.writeUInt32BE(size,0); ihdr.writeUInt32BE(size,4);
ihdr[8]=8; ihdr[9]=2; ihdr[10]=0; ihdr[11]=0; ihdr[12]=0;
const png=Buffer.concat([
  Buffer.from([137,80,78,71,13,10,26,10]),
  chunk('IHDR',ihdr),
  chunk('IDAT',zlib.deflateSync(raw,{level:9})),
  chunk('IEND',Buffer.alloc(0)),
]);
fs.mkdirSync(path.dirname(output),{recursive:true});
fs.writeFileSync(output,png);
console.log(`Generated ${output}: ${size}x${size}, RGB, ${png.length} bytes`);
