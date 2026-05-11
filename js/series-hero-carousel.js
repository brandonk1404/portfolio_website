/**
 * Series hero carousels: glitch (Last Known Recording video ping-pong), greenery (Earthly), chromatic (Chromatic Fragments).
 */
(function (window) {
  'use strict';

  function mulberry32(a) {
    return function () {
      var t = (a += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  function drawContain(octx, source, W, H, bg) {
    var sw = source.naturalWidth || source.videoWidth || W;
    var sh = source.naturalHeight || source.videoHeight || H;
    if (!sw || !sh) return;
    var scale = Math.min(W / sw, H / sh);
    var dw = sw * scale;
    var dh = sh * scale;
    var dx = (W - dw) / 2;
    var dy = (H - dh) / 2;
    octx.fillStyle = bg || '#0a0a0a';
    octx.fillRect(0, 0, W, H);
    try {
      octx.drawImage(source, dx, dy, dw, dh);
    } catch (e) {}
  }

  function drawCover(octx, source, W, H) {
    var sw = source.naturalWidth || source.videoWidth || W;
    var sh = source.naturalHeight || source.videoHeight || H;
    if (!sw || !sh) return;
    var scale = Math.max(W / sw, H / sh);
    var dw = sw * scale;
    var dh = sh * scale;
    var dx = (W - dw) / 2;
    var dy = (H - dh) / 2;
    try {
      octx.drawImage(source, dx, dy, dw, dh);
    } catch (e) {}
  }

  function captureFrame(canvas, ctx, source, bg) {
    var dpr = window.devicePixelRatio || 1;
    var w = Math.round(canvas.width / dpr);
    var h = Math.round(canvas.height / dpr);
    var off = document.createElement('canvas');
    off.width = w;
    off.height = h;
    var oc = off.getContext('2d');
    oc.fillStyle = bg || '#0a0a0a';
    oc.fillRect(0, 0, w, h);
    drawCover(oc, source, w, h);
    return off;
  }

  // ── Glitch (dual hidden videos, deterministic per transition) ───────────
  function runLKRGlitch(options) {
    var clips = options.clips;
    var canvas = document.getElementById(options.canvasId);
    var wrap = document.getElementById(options.wrapId);
    if (!canvas || !wrap || !clips.length) return;

    var ctx = canvas.getContext('2d');
    var GLITCH_MS = options.glitchMs || 1200;
    var HOLD_MS = options.holdMs || 4200;

    function resize() {
      var dpr = window.devicePixelRatio || 1;
      var w = wrap.offsetWidth || 640;
      var h = wrap.offsetHeight || 480;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    function makeVid(src) {
      var v = document.createElement('video');
      v.src = src;
      v.loop = true;
      v.muted = true;
      v.playsInline = true;
      v.preload = 'auto';
      v.setAttribute('playsinline', '');
      v.style.cssText = 'position:absolute;left:-9999px;top:-9999px;width:1px;height:1px;opacity:0;';
      document.body.appendChild(v);
      return v;
    }

    var vidA = makeVid(clips[0]);
    var vidB = makeVid(clips.length > 1 ? clips[1] : clips[0]);
    vidA.setAttribute('data-clip', '0');
    vidB.setAttribute('data-clip', clips.length > 1 ? '1' : '0');
    var current = 0;
    var activeVid = vidA;
    var inactiveVid = vidB;
    var isGlitching = false;
    var glitchStart = null;
    var frameA = null;
    var frameB = null;
    var glitchPlan = null;
    var lastSwitch = performance.now();

    function grabFrame(vid) {
      var dpr = window.devicePixelRatio || 1;
      var lw = Math.round(canvas.width / dpr);
      var lh = Math.round(canvas.height / dpr);
      var off = document.createElement('canvas');
      off.width = lw;
      off.height = lh;
      var octx = off.getContext('2d');
      octx.fillStyle = '#0a0a0a'; octx.fillRect(0, 0, lw, lh); drawCover(octx, vid, lw, lh);
      return octx.getImageData(0, 0, lw, lh);
    }

    function buildGlitchPlan(W, H, seed) {
      var rnd = mulberry32(seed);
      var sliceCount = 22 + Math.floor(rnd() * 10);
      var sliceH = Math.ceil(H / sliceCount);
      var rows = [];
      for (var i = 0; i < sliceCount; i++) {
        rows.push({
          y: i * sliceH,
          h: Math.min(sliceH, H - i * sliceH),
          switchAt: 0.08 + rnd() * 0.84,
          shift: (rnd() - 0.5) * 56,
        });
      }
      return { rows: rows, W: W, H: H, splitMag: 4 + Math.floor(rnd() * 10) };
    }

    function drawGlitch(imgA, imgB, t, plan) {
      var W = plan.W;
      var H = plan.H;
      ctx.clearRect(0, 0, W, H);

      var off = document.createElement('canvas');
      off.width = W;
      off.height = H;
      var oc = off.getContext('2d');
      oc.putImageData(imgA, 0, 0);

      var offB = document.createElement('canvas');
      offB.width = W;
      offB.height = H;
      var ocB = offB.getContext('2d');
      ocB.putImageData(imgB, 0, 0);

      var te = easeInOutQuad(t);
      plan.rows.forEach(function (row) {
        var y = row.y;
        var h = row.h;
        if (te >= row.switchAt) {
          var shift = Math.round(row.shift * Math.sin(te * Math.PI));
          oc.drawImage(offB, 0, y, W, h, shift, y, W, h);
        }
      });

      ctx.drawImage(off, 0, 0);
      var split = Math.round(plan.splitMag * Math.sin(te * Math.PI));
      if (split > 0) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.globalAlpha = 0.32 * te;
        ctx.filter = 'saturate(2.5)';
        ctx.drawImage(off, -split, 0);
        ctx.filter = 'hue-rotate(180deg) saturate(2)';
        ctx.drawImage(off, split, 0);
        ctx.filter = 'none';
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
        ctx.restore();
      }

      ctx.globalAlpha = 0.07 + te * 0.12;
      ctx.fillStyle = '#000';
      for (var s = 0; s < H; s += 3) {
        ctx.fillRect(0, s, W, 1);
      }
      ctx.globalAlpha = 1;

      if (te > 0.25 && te < 0.75) {
        ctx.globalAlpha = (0.5 - Math.abs(te - 0.5)) * 0.35;
        ctx.fillStyle = '#fff';
        var gx = (Math.sin(te * 50) * 0.5 + 0.5) * W;
        ctx.fillRect(gx, 0, 3, H);
        ctx.globalAlpha = 1;
      }

      ctx.globalAlpha = 0.035 * te;
      for (var n = 0; n < 40; n++) {
        var rx = (n * 97 + Math.floor(te * 200)) % W;
        var ry = (n * 53 + Math.floor(te * 150)) % H;
        ctx.fillStyle = n % 2 ? '#fff' : '#000';
        ctx.fillRect(rx, ry, 2, 2);
      }
      ctx.globalAlpha = 1;
    }

    function drawNormal(vid) {
      var dpr = window.devicePixelRatio || 1;
      var lw = Math.round(canvas.width / dpr);
      var lh = Math.round(canvas.height / dpr);
      if (vid.paused) vid.play().catch(function () {});
      ctx.clearRect(0, 0, lw, lh);
      ctx.fillStyle = '#0a0a0a'; ctx.fillRect(0, 0, lw, lh); drawCover(ctx, vid, lw, lh);
      ctx.globalAlpha = 0.055;
      ctx.fillStyle = '#000';
      for (var s = 0; s < lh; s += 3) {
        ctx.fillRect(0, s, lw, 1);
      }
      ctx.globalAlpha = 1;
    }

    function preloadNext() {
      var nextIdx = (current + 1) % clips.length;
      if (inactiveVid.getAttribute('data-clip') !== String(nextIdx)) {
        inactiveVid.src = clips[nextIdx];
        inactiveVid.setAttribute('data-clip', String(nextIdx));
        inactiveVid.load();
        inactiveVid.play().catch(function () {});
      }
    }

    vidA.addEventListener('loadeddata', preloadNext);
    vidB.addEventListener('loadeddata', preloadNext);

    vidA.play().catch(function () {});
    vidB.play().catch(function () {});

    function tick(now) {
      requestAnimationFrame(tick);
      if (isGlitching) {
        if (!glitchStart) glitchStart = now;
        var elapsed = now - glitchStart;
        var t = Math.min(elapsed / GLITCH_MS, 1);
        if (frameA && frameB && glitchPlan) {
          drawGlitch(frameA, frameB, t, glitchPlan);
        }
        if (t >= 1) {
          isGlitching = false;
          glitchStart = null;
          frameA = frameB = glitchPlan = null;
          var tmp = activeVid;
          activeVid = inactiveVid;
          inactiveVid = tmp;
          current = (current + 1) % clips.length;
          lastSwitch = now;
          var following = (current + 1) % clips.length;
          inactiveVid.src = clips[following];
          inactiveVid.setAttribute('data-clip', String(following));
          inactiveVid.load();
          inactiveVid.play().catch(function () {});
        }
      } else {
        drawNormal(activeVid);
        if (clips.length > 1 && now - lastSwitch > HOLD_MS) {
          preloadNext();
          var ready =
            inactiveVid.readyState >= 2 &&
            inactiveVid.videoWidth > 0;
          if (ready || now - lastSwitch > HOLD_MS + 2500) {
            isGlitching = true;
            glitchStart = null;
            frameA = grabFrame(activeVid);
            frameB = grabFrame(inactiveVid);
            var _dpr = window.devicePixelRatio || 1;
            glitchPlan = buildGlitchPlan(Math.round(canvas.width / _dpr), Math.round(canvas.height / _dpr), (now + current * 777) | 0);
          }
        }
      }
    }

    vidA.addEventListener(
      'canplay',
      function () {
        requestAnimationFrame(tick);
      },
      { once: true }
    );
    setTimeout(function () {
      requestAnimationFrame(tick);
    }, 600);
  }

  // ── Mixed image + video: greenery or chromatic transitions ────────────────
  function runMixedCarousel(options) {
    var canvas = document.getElementById(options.canvasId);
    var wrap = document.getElementById(options.wrapId);
    var items = options.items;
    var transition = options.transition;
    if (!canvas || !wrap || !items || items.length < 1) return;

    var ctx = canvas.getContext('2d');
    var HOLD = options.holdMs || 4000;
    var TRANS = options.transMs || 1150;
    var bg = options.bg || '#1a2e1a';

    function resize() {
      var dpr = window.devicePixelRatio || 1;
      var w = wrap.offsetWidth || 640;
      var h = wrap.offsetHeight || 480;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    var loaded = [];
    var readyCount = 0;

    items.forEach(function (item, i) {
      if (item.type === 'video') {
        var v = document.createElement('video');
        v.src = item.src;
        v.loop = true;
        v.muted = true;
        v.playsInline = true;
        v.preload = 'auto';
        v.setAttribute('playsinline', '');
        v.style.cssText = 'position:absolute;left:-9999px;width:1px;height:1px;opacity:0;';
        document.body.appendChild(v);
        v.addEventListener(
          'canplay',
          function () {
            readyCount++;
            v.play().catch(function () {});
          },
          { once: true }
        );
        v.play().catch(function () {});
        loaded[i] = v;
      } else {
        var img = new Image();
        img.onload = function () {
          readyCount++;
        };
        img.onerror = function () {
          readyCount++;
        };
        img.src = item.src;
        loaded[i] = img;
      }
    });

    var current = 0;
    var transitioning = false;
    var transStart = 0;
    var capA = null;
    var capB = null;
    var lastHold = performance.now();

    function drawGreenery(t) {
      var dpr = window.devicePixelRatio || 1;
      var W = Math.round(canvas.width / dpr);
      var H = Math.round(canvas.height / dpr);
      var u = easeInOutQuad(t);
      var g = Math.sin(t * Math.PI);            // peaks at 0 → 1 → 0
      var bloom = Math.sin(t * Math.PI * 0.9);  // softer bloom arc

      ctx.clearRect(0, 0, W, H);

      // Base crossfade A → B via organic diagonal wipe
      // Wipe edge: diagonal wave sweeping from top-left to bottom-right
      ctx.save();
      ctx.drawImage(capA, 0, 0);

      // Clip region for B: diagonal soft wipe
      var wipeX = u * (W + H * 0.6) - H * 0.3;
      var grad = ctx.createLinearGradient(wipeX - 80, 0, wipeX + 80, H * 0.5);
      grad.addColorStop(0, 'rgba(0,0,0,1)');
      grad.addColorStop(0.4, 'rgba(0,0,0,0.85)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      // Draw B with soft leading edge
      var offB = document.createElement('canvas');
      offB.width = W; offB.height = H;
      var bctx = offB.getContext('2d');
      bctx.drawImage(capB, 0, 0);
      // Mask B with linear gradient
      bctx.globalCompositeOperation = 'destination-in';
      var maskGrad = bctx.createLinearGradient(wipeX - 120, 0, wipeX + 60, H * 0.4);
      maskGrad.addColorStop(0, 'rgba(0,0,0,1)');
      maskGrad.addColorStop(1, 'rgba(0,0,0,0)');
      bctx.fillStyle = maskGrad;
      bctx.fillRect(0, 0, W, H);
      ctx.drawImage(offB, 0, 0);
      ctx.restore();

      // Deep forest colour wash — rich layered greens
      var natureColors = [
        { r: 15,  g: 45,  b: 20  },   // near-black forest
        { r: 34,  g: 80,  b: 45  },   // deep moss
        { r: 52,  g: 130, b: 70  },   // mid fern
        { r: 90,  g: 160, b: 80  },   // leaf highlight
        { r: 160, g: 195, b: 100 },   // sunlit canopy
        { r: 110, g: 75,  b: 30  },   // bark / earth
        { r: 80,  g: 50,  b: 15  },   // dark earth
      ];

      // Sweeping radial nature washes
      ctx.save();
      ctx.globalCompositeOperation = 'overlay';

      // Primary forest bloom — deep green
      ctx.globalAlpha = 0.55 * bloom;
      var px = W * (0.3 + Math.sin(t * Math.PI * 1.3) * 0.15);
      var py = H * (0.5 + Math.cos(t * Math.PI * 0.9) * 0.12);
      var r1 = ctx.createRadialGradient(px, py, 0, W * 0.5, H * 0.5, Math.max(W, H) * 0.75);
      r1.addColorStop(0,    'rgba(20, 70, 30, 1)');
      r1.addColorStop(0.35, 'rgba(50, 120, 60, 0.7)');
      r1.addColorStop(0.7,  'rgba(80, 150, 70, 0.3)');
      r1.addColorStop(1,    'rgba(90, 160, 80, 0)');
      ctx.fillStyle = r1;
      ctx.fillRect(0, 0, W, H);

      // Secondary earth tone — warm brown bottom sweep
      ctx.globalAlpha = 0.3 * bloom;
      var r2 = ctx.createLinearGradient(0, H * 0.6, W, H);
      r2.addColorStop(0,   'rgba(100, 60, 20, 0.9)');
      r2.addColorStop(0.5, 'rgba(70, 45, 15, 0.5)');
      r2.addColorStop(1,   'rgba(40, 25, 8, 0)');
      ctx.fillStyle = r2;
      ctx.fillRect(0, 0, W, H);

      // Sunlight dapple — golden highlights from upper right
      ctx.globalAlpha = 0.2 * bloom;
      var r3 = ctx.createRadialGradient(W * 0.78, H * 0.12, 0, W * 0.6, H * 0.3, Math.max(W, H) * 0.55);
      r3.addColorStop(0,    'rgba(210, 185, 80, 0.9)');
      r3.addColorStop(0.4,  'rgba(160, 140, 50, 0.4)');
      r3.addColorStop(1,    'rgba(130, 110, 30, 0)');
      ctx.fillStyle = r3;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();

      // Multiply layer — darken with rich forest depth
      ctx.save();
      ctx.globalCompositeOperation = 'multiply';
      ctx.globalAlpha = 0.28 * bloom;
      var r4 = ctx.createLinearGradient(W * t, 0, W * (1 - t), H);
      r4.addColorStop(0, 'rgba(10, 35, 18, 0.9)');
      r4.addColorStop(0.5, 'rgba(25, 65, 35, 0.5)');
      r4.addColorStop(1, 'rgba(40, 90, 50, 0.2)');
      ctx.fillStyle = r4;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();

      // Organic leaf/petal shapes drifting across
      ctx.save();
      var leafColors = ['rgba(35,90,45,0.7)', 'rgba(55,120,60,0.6)', 'rgba(80,155,75,0.5)', 'rgba(100,70,25,0.4)', 'rgba(60,100,35,0.6)'];
      for (var i = 0; i < 22; i++) {
        var phase = t * Math.PI * 2 + i * 0.55;
        var leafT = ((t + i * 0.045) % 1);
        var lx = W * (i % 5) * 0.22 + Math.sin(phase + i) * 30 + leafT * W * 0.4;
        var ly = H * (0.05 + (Math.floor(i / 5) * 0.22) + Math.cos(phase * 0.7) * 0.06);
        var lw = 18 + (i % 6) * 5;
        var lh = 8 + (i % 4) * 3;
        ctx.globalAlpha = 0.12 * g * (0.5 + Math.sin(phase) * 0.5);
        ctx.fillStyle = leafColors[i % leafColors.length];
        ctx.save();
        ctx.translate(lx, ly);
        ctx.rotate(phase * 0.3 + i * 0.2);
        ctx.beginPath();
        // Leaf shape: narrow ellipse with a taper
        ctx.ellipse(0, 0, lw, lh, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();

      // Dappled light spots — soft circles like light through canopy
      ctx.save();
      ctx.globalCompositeOperation = 'soft-light';
      for (var j = 0; j < 8; j++) {
        var sp = t * Math.PI * 1.5 + j * 0.8;
        var sx = W * (0.1 + (j % 4) * 0.27) + Math.sin(sp) * 20;
        var sy = H * (0.15 + Math.floor(j / 4) * 0.55) + Math.cos(sp * 0.7) * 15;
        var sr = 30 + (j % 3) * 20;
        var spot = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr);
        spot.addColorStop(0, 'rgba(230, 210, 130, ' + (0.4 * bloom) + ')');
        spot.addColorStop(1, 'rgba(180, 160, 80, 0)');
        ctx.fillStyle = spot;
        ctx.beginPath();
        ctx.arc(sx, sy, sr, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    }

    var fragmentPlan = null;
    function buildFragmentPlan(W, H) {
      var cols = 7, rows = 5;
      var fw = W / cols, fh = H / rows;
      var frags = [];
      for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
          var cx = (c + 0.5) * fw, cy = (r + 0.5) * fh;
          var angle = Math.atan2(cy - H * 0.5, cx - W * 0.5);
          var dist = Math.sqrt(Math.pow(cx - W * 0.5, 2) + Math.pow(cy - H * 0.5, 2));
          frags.push({
            sx: c * fw, sy: r * fh, sw: fw, sh: fh,
            cx: cx, cy: cy,
            dx: Math.cos(angle) * (dist * 0.6 + 40),
            dy: Math.sin(angle) * (dist * 0.6 + 40),
            rot: (Math.random() - 0.5) * 0.8,
            delay: (dist / Math.sqrt(W * W + H * H)) * 0.4,
          });
        }
      }
      return { frags: frags, fw: fw, fh: fh };
    }

    function drawChromaticTrans(t) {
      var dpr = window.devicePixelRatio || 1;
      var W = Math.round(canvas.width / dpr);
      var H = Math.round(canvas.height / dpr);
      var chroma = Math.sin(t * Math.PI);

      if (!fragmentPlan || fragmentPlan.W !== W || fragmentPlan.H !== H) {
        fragmentPlan = buildFragmentPlan(W, H);
        fragmentPlan.W = W; fragmentPlan.H = H;
      }
      var plan = fragmentPlan;

      ctx.clearRect(0, 0, W, H);

      // Phase 1 (t 0→0.5): shatter capA outward
      // Phase 2 (t 0.5→1): reassemble capB from fragments
      var explode = t < 0.5 ? easeInOutQuad(t * 2) : 1;
      var reassemble = t >= 0.5 ? easeInOutQuad((t - 0.5) * 2) : 0;

      // Draw base: fade from A to B
      ctx.globalAlpha = 1 - chroma * 0.85;
      ctx.drawImage(capA, 0, 0);
      if (t > 0.5) {
        ctx.globalAlpha = reassemble;
        ctx.drawImage(capB, 0, 0);
      }
      ctx.globalAlpha = 1;

      // Draw fragments
      plan.frags.forEach(function (f) {
        var localT;
        if (t < 0.5) {
          localT = Math.max(0, Math.min(1, (t * 2 - f.delay) / (1 - f.delay)));
          localT = easeInOutQuad(localT);
          var ox = f.dx * localT;
          var oy = f.dy * localT;
          var rot = f.rot * localT;
          var alpha = 1 - localT * 0.4;
          ctx.save();
          ctx.globalAlpha = alpha * chroma;
          ctx.translate(f.cx + ox, f.cy + oy);
          ctx.rotate(rot);
          ctx.drawImage(capA, f.sx, f.sy, f.sw, f.sh, -f.sw / 2, -f.sh / 2, f.sw, f.sh);
          // Chromatic aberration on each fragment
          ctx.globalCompositeOperation = 'screen';
          ctx.globalAlpha = 0.18 * chroma;
          ctx.filter = 'hue-rotate(' + (t * 180) + 'deg) saturate(3)';
          ctx.drawImage(capA, f.sx, f.sy, f.sw, f.sh, -f.sw / 2 - 3, -f.sh / 2, f.sw, f.sh);
          ctx.filter = 'none';
          ctx.restore();
        } else {
          localT = Math.max(0, Math.min(1, ((t - 0.5) * 2 - f.delay) / (1 - f.delay)));
          localT = easeInOutQuad(localT);
          var ox2 = f.dx * (1 - localT);
          var oy2 = f.dy * (1 - localT);
          var rot2 = f.rot * (1 - localT);
          var alpha2 = 0.6 + localT * 0.4;
          ctx.save();
          ctx.globalAlpha = alpha2 * (1 - reassemble * 0.7);
          ctx.translate(f.cx + ox2, f.cy + oy2);
          ctx.rotate(rot2);
          ctx.drawImage(capB, f.sx, f.sy, f.sw, f.sh, -f.sw / 2, -f.sh / 2, f.sw, f.sh);
          ctx.restore();
        }
      });

      // Colour flash at peak
      ctx.globalAlpha = 0.18 * chroma;
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = 'hsla(' + ((t * 320) % 360) + ', 80%, 65%, 1)';
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    }

    function tick(now) {
      requestAnimationFrame(tick);
      var cw = Math.round(canvas.width / (window.devicePixelRatio || 1));
      var ch = Math.round(canvas.height / (window.devicePixelRatio || 1));
      if (transitioning) {
        var elapsed = now - transStart;
        var t = Math.min(elapsed / TRANS, 1);
        if (capA && capB) {
          if (transition === 'greenery') drawGreenery(t);
          else drawChromaticTrans(t);
        }
        if (t >= 1) {
          transitioning = false;
          current = (current + 1) % items.length;
          lastHold = now;
          capA = capB = null;
          // Ensure the new current item plays if it's a video
          var newSrc = loaded[current];
          if (newSrc && newSrc.tagName === 'VIDEO') {
            newSrc.currentTime = 0;
            newSrc.play().catch(function () {});
          }
        }
      } else {
        var src = loaded[current];
        if (src) {
          var mediaReady =
            src.tagName === 'IMG' ? src.complete && src.naturalWidth : src.readyState >= 2;
          if (mediaReady) {
            // Keep video playing
            if (src.tagName === 'VIDEO' && src.paused) {
              src.play().catch(function () {});
            }
            ctx.fillStyle = bg || '#0a0a0a';
            ctx.fillRect(0, 0, cw, ch);
            drawCover(ctx, src, cw, ch);
          }
        }
        if (items.length > 1 && now - lastHold > HOLD) {
          var next = (current + 1) % items.length;
          var sA = loaded[current];
          var sB = loaded[next];
          if (sA && sB) {
            capA = captureFrame(canvas, ctx, sA, bg);
            capB = captureFrame(canvas, ctx, sB, bg);
            transitioning = true;
            transStart = now;
          }
        }
      }
    }

    setTimeout(function () {
      requestAnimationFrame(tick);
    }, 350);
  }

  window.SeriesHeroCarousel = {
    runLKRGlitch: runLKRGlitch,
    runMixed: runMixedCarousel,
  };
})(typeof window !== 'undefined' ? window : this);
