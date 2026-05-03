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

  function captureFrame(canvas, ctx, source, bg) {
    var dpr = window.devicePixelRatio || 1;
    var w = Math.round(canvas.width / dpr);
    var h = Math.round(canvas.height / dpr);
    var off = document.createElement('canvas');
    off.width = w;
    off.height = h;
    var oc = off.getContext('2d');
    drawContain(oc, source, w, h, bg);
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
      v.loop = false;
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
      drawContain(octx, vid, lw, lh, '#0a0a0a');
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
      ctx.clearRect(0, 0, lw, lh);
      drawContain(ctx, vid, lw, lh, '#0a0a0a');
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
        v.loop = false;
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
      var W = canvas.width;
      var H = canvas.height;
      var u = easeInOutQuad(t);
      var g = Math.sin(t * Math.PI);

      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(capA, 0, 0);
      ctx.globalAlpha = u;
      ctx.drawImage(capB, 0, 0);
      ctx.globalAlpha = 1;

      ctx.globalCompositeOperation = 'overlay';
      ctx.globalAlpha = 0.38 * g;
      var gx = W * (0.35 + Math.sin(t * Math.PI * 2) * 0.08);
      var gy = H * (0.45 + Math.cos(t * Math.PI * 1.5) * 0.06);
      var grd = ctx.createRadialGradient(gx, gy, 0, W * 0.5, H * 0.5, Math.max(W, H) * 0.65);
      grd.addColorStop(0, 'rgba(35, 85, 48, 0.95)');
      grd.addColorStop(0.45, 'rgba(82, 175, 121, 0.35)');
      grd.addColorStop(1, 'rgba(82, 175, 121, 0)');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'multiply';
      ctx.globalAlpha = 0.22 * g;
      var grd2 = ctx.createLinearGradient(0, H * t, W, H * (1 - t));
      grd2.addColorStop(0, 'rgba(20, 60, 35, 0.5)');
      grd2.addColorStop(1, 'rgba(52, 120, 72, 0.25)');
      ctx.fillStyle = grd2;
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;

      for (var i = 0; i < 16; i++) {
        var phase = t * Math.PI * 2 + i * 0.7;
        ctx.save();
        ctx.globalAlpha = 0.1 * g;
        ctx.fillStyle = 'rgba(45, 110, 62, 0.85)';
        ctx.translate(W * (0.08 + (i % 4) * 0.24) + Math.sin(phase) * 16, H * (0.1 + Math.floor(i / 4) * 0.22));
        ctx.rotate(phase * 0.25);
        ctx.beginPath();
        ctx.ellipse(0, 0, 28 + (i % 5) * 4, 12 + (i % 3) * 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    function drawChromaticTrans(t) {
      var W = canvas.width;
      var H = canvas.height;
      var u = easeInOutQuad(t);
      var chroma = Math.sin(t * Math.PI);
      var split = Math.round(chroma * 22);

      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(capA, 0, 0);
      ctx.globalAlpha = 1 - u;
      ctx.drawImage(capA, 0, 0);
      ctx.globalAlpha = u;
      ctx.drawImage(capB, 0, 0);
      ctx.globalAlpha = 1;

      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = 0.35 * chroma;
      ctx.filter = 'hue-rotate(' + (t * 140) + 'deg) saturate(2.2)';
      try {
        ctx.drawImage(capB, -split, 0);
        ctx.drawImage(capB, split, 0);
      } catch (e) {}
      ctx.filter = 'none';
      ctx.globalAlpha = 0.25 * chroma;
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = 'hsla(' + (t * 280) % 360 + ', 75%, 60%, 0.15)';
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;

      ctx.globalAlpha = 0.12 * chroma;
      for (var y = 0; y < H; y += 4) {
        var hue = (y * 0.35 + t * 200) % 360;
        ctx.fillStyle = 'hsla(' + hue + ', 60%, 55%, 0.15)';
        ctx.fillRect(0, y, W, 2);
      }
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
        }
      } else {
        var src = loaded[current];
        if (src) {
          var mediaReady =
            src.tagName === 'IMG' ? src.complete && src.naturalWidth : src.readyState >= 2;
          if (mediaReady) drawContain(ctx, src, cw, ch, bg);
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
