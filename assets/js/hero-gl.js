/* Hero WebGL — retrato em duotom musgo/osso com distorção líquida seguindo o ponteiro.
   Fallback: a <img> continua visível se WebGL não estiver disponível. */
(() => {
  const fig = document.querySelector('.hero__figure');
  const canvas = document.getElementById('heroGL');
  const img = fig && fig.querySelector('img');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.heroGL = { reveal: 1, scroll: 0 };
  if (!fig || !canvas || !img) return;
  const gl = canvas.getContext('webgl', { premultipliedAlpha: false, antialias: true, alpha: true });
  if (!gl) return;

  const vs = `attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;gl_Position=vec4(p,0.,1.);}`;
  const fs = `precision highp float;
  varying vec2 v;
  uniform sampler2D t;uniform vec2 res,isz,m;uniform float time,hov,rev,scr;
  float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
  void main(){
    vec2 uv=v; uv.y=1.-uv.y;
    float ca=res.x/res.y, ia=isz.x/isz.y;
    vec2 s=ca>ia?vec2(ca/ia,1.):vec2(1.,ia/ca);
    vec2 cuv=vec2((uv.x-.5)*s.x+.5,(uv.y-1.)*s.y+1.); cuv.y-= scr*.05;
    vec2 mm=vec2(m.x,1.-m.y);
    vec2 d=(uv-mm)*vec2(ca,1.); float dist=length(d);
    float rip=sin(dist*26.-time*3.2)*exp(-dist*5.5)*.010*hov;
    float liq=(n(uv*3.+time*.12)-.5)*.006;
    vec2 off=normalize(d+1e-4)*rip+vec2(liq,liq*.6);
    float sh=.0035*hov*exp(-dist*4.);
    float r=texture2D(t,cuv+off+vec2(sh,0)).r, g=texture2D(t,cuv+off).g, b=texture2D(t,cuv+off-vec2(sh,0)).b;
    float l0=dot(vec3(r,g,b),vec3(.299,.587,.114));
    vec2 kk=cuv+off;float key=texture2D(t,kk).a*step(0.,kk.x)*step(kk.x,1.)*step(0.,kk.y)*step(kk.y,1.);
    float l=smoothstep(.02,.96,l0);
    vec3 sh_=vec3(.055,.075,.06), md=vec3(.36,.40,.34), hi=vec3(.95,.92,.86);
    vec3 col=l<.5?mix(sh_,md,l*2.):mix(md,hi,(l-.5)*2.);
    col+= vec3(.71,.53,.29)*.10*smoothstep(.55,1.,l)*hov;
    float vig=smoothstep(1.15,.35,length((uv-.5)*vec2(1.1,1.)));
    col*=mix(.75,1.,vig);
    col+= (h(uv*res+time)-.5)*.035;
    float edge=rev*1.25-(1.-uv.y)-(n(vec2(uv.x*4.,time*.4))-.5)*.12;
    float a=smoothstep(0.,.08,edge)*key;
    gl_FragColor=vec4(col,a);
  }`;
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(s)); return null; } return s; };
  const v = sh(gl.VERTEX_SHADER, vs), f = sh(gl.FRAGMENT_SHADER, fs);
  if (!v || !f) return;
  const pr = gl.createProgram(); gl.attachShader(pr, v); gl.attachShader(pr, f); gl.linkProgram(pr); gl.useProgram(pr);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = n => gl.getUniformLocation(pr, n);
  const u = { res: U('res'), isz: U('isz'), m: U('m'), time: U('time'), hov: U('hov'), rev: U('rev'), scr: U('scr') };
  gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  const tex = gl.createTexture();
  const start = () => {
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    fig.classList.add('gl-on');
    resize(); requestAnimationFrame(loop);
  };
  const resize = () => {
    const dpr = Math.min(devicePixelRatio, innerWidth < 900 ? 1.5 : 1.75), r = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, r.width * dpr); canvas.height = Math.max(1, r.height * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
  };
  addEventListener('resize', resize);

  const mouse = { x: .6, y: .4, tx: .6, ty: .4 }; let hov = 0, hovT = 0;
  const hero = document.querySelector('.hero');
  hero.addEventListener('pointermove', e => { const r = canvas.getBoundingClientRect(); mouse.tx = (e.clientX - r.left) / r.width; mouse.ty = (e.clientY - r.top) / r.height; });
  

  let visible = true;
  new IntersectionObserver(([e]) => visible = e.isIntersecting).observe(fig);
  const t0 = performance.now();
  function loop(now) {
    requestAnimationFrame(loop);
    if (!visible) return;
    mouse.x += (mouse.tx - mouse.x) * .08; mouse.y += (mouse.ty - mouse.y) * .08; hov += (hovT - hov) * .05;
    gl.uniform2f(u.res, canvas.width, canvas.height);
    gl.uniform2f(u.isz, img.naturalWidth, img.naturalHeight);
    gl.uniform2f(u.m, mouse.x, mouse.y);
    gl.uniform1f(u.time, reduce ? 0 : (now - t0) / 1000);
    gl.uniform1f(u.hov, reduce ? 0 : hov);
    gl.uniform1f(u.rev, window.heroGL.reveal);
    gl.uniform1f(u.scr, window.heroGL.scroll);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
  img.complete && img.naturalWidth ? start() : img.addEventListener('load', start, { once: true });
})();
