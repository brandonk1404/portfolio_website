(function () {
  // Current year in footer
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Graduation flag — after May 17 2026, update education line
  (function () {
    var el = document.getElementById('education-line');
    if (!el) return;
    var now = new Date();
    var graduated = new Date(2026, 4, 17); // May 17 2026 (month is 0-indexed)
    if (now >= graduated) {
      el.innerHTML = '<strong>BFA Graphic Design</strong> &mdash; Caldwell University';
    }
  })();

  // Header border on scroll
  var header = document.querySelector('.site-header');
  if (header) {
    window.addEventListener('scroll', function () {
      header.classList.toggle('scrolled', window.scrollY > 20);
    });
  }

  // --- Mobile hamburger menu (fixed overlay + drawer) ---
  (function () {
    var menuToggle = document.querySelector('.menu-toggle');
    var nav = document.getElementById('site-nav');
    var overlay = document.getElementById('nav-overlay');

    if (!menuToggle || !nav) return;

    var menuOpen = false;

    var pointerMoveHandler = null;

    function setMenuOpen(open) {
      menuOpen = open;
      nav.classList.toggle('is-open', open);
      menuToggle.classList.toggle('is-active', open);
      menuToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (overlay) {
        overlay.classList.toggle('is-open', open);
        overlay.setAttribute('aria-hidden', open ? 'false' : 'true');
      }
      document.body.style.overflow = open ? 'hidden' : '';
      document.documentElement.style.overflow = open ? 'hidden' : '';

      if (open) {
        // When menu is open, watch pointer movement to close if cursor
        // moves far away from the hamburger (desktop / mouse only).
        if (!pointerMoveHandler) {
          pointerMoveHandler = function (e) {
            if (e.pointerType && e.pointerType !== 'mouse') return;
            if (!menuOpen) return;

            var rect = menuToggle.getBoundingClientRect();
            // Expanded hit area around the toggle; if the pointer leaves
            // this reasonably large boundary, close the menu.
            var margin = 160; // px boundary around the toggle
            var left = rect.left - margin;
            var right = rect.right + margin;
            var top = rect.top - margin;
            var bottom = rect.bottom + margin;

            var x = e.clientX;
            var y = e.clientY;
            if (x < left || x > right || y < top || y > bottom) {
              setMenuOpen(false);
            }
          };
        }
        window.addEventListener('pointermove', pointerMoveHandler);
      } else {
        if (pointerMoveHandler) {
          window.removeEventListener('pointermove', pointerMoveHandler);
        }
      }
    }

    function closeMenu() {
      if (menuOpen) setMenuOpen(false);
    }

    menuToggle.addEventListener('click', function (e) {
      e.preventDefault();
      setMenuOpen(!menuOpen);
    });

    if (overlay) {
      overlay.addEventListener('click', closeMenu);
    }

    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function (e) {
        // On mobile, always close the menu when any link is tapped
        // (including nav-link-main which is the Gallery toggle)
        if (window.matchMedia('(max-width: 768px)').matches) {
          closeMenu();
          // Also clear the open class on the nav-group dropdown
          var group = document.querySelector('.nav-group');
          if (group) group.classList.remove('open');
        } else {
          closeMenu();
        }
      });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
    });

    window.addEventListener('resize', function () {
      if (window.matchMedia('(min-width: 1024px)').matches) closeMenu();
    });

    window.addEventListener('orientationchange', function() {
      // Close nav on any orientation change and restore scroll
      closeMenu();
      setTimeout(function() {
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
      }, 350);
    });
  })();

  // Gallery dropdown (desktop & mobile)
  var galleryGroup = document.querySelector('.nav-group');
  var galleryToggle = document.querySelector('.nav-link-main');
  var gallerySub = document.querySelector('.nav-sub');
  if (galleryGroup && galleryToggle) {

    // Measure the sub-menu width and apply it as --sub-w on the toggle
    function syncArrowWidth() {
      if (!gallerySub) return;
      // Temporarily show to measure
      var wasHidden = gallerySub.style.display === 'none' || !galleryGroup.classList.contains('open');
      gallerySub.style.visibility = 'hidden';
      gallerySub.style.display = 'flex';
      var w = gallerySub.offsetWidth;
      if (wasHidden) gallerySub.style.display = '';
      gallerySub.style.visibility = '';
      galleryToggle.style.setProperty('--sub-w', w + 'px');
    }
    syncArrowWidth();
    window.addEventListener('resize', syncArrowWidth);
    galleryToggle.addEventListener('click', function (e) {
      // On mobile, sub-links are always visible — toggle does nothing
      if (window.matchMedia('(max-width: 768px)').matches) return;
      var isOpen = galleryGroup.classList.toggle('open');
      galleryToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    document.addEventListener('click', function (e) {
      if (!galleryGroup.contains(e.target) && galleryGroup.classList.contains('open')) {
        galleryGroup.classList.remove('open');
        galleryToggle.setAttribute('aria-expanded', 'false');
      }
    });

    // Wider hitbox: keep open while mouse is anywhere over group or sub-menu
    galleryGroup.addEventListener('mouseleave', function (e) {
      // Only close on desktop hover-close if not already toggled open by click
      if (window.matchMedia('(min-width: 769px)').matches) {
        // Let CSS :hover handle it; nothing extra needed
      }
    });
  }

  // Hero auto-slideshow — crossfade between two stacked images
  var heroFrame = document.querySelector('.hero-showcase-frame');
  var heroTitle = document.querySelector('.hero-showcase-title');
  var heroYear  = document.querySelector('.hero-showcase-year');

  // ── CAROUSEL RULE ────────────────────────────────────────────────────────
  // Every time a new project is added to the site, add an entry here too.
  // Images: { src: 'images/filename.jpg', title: 'Title', medium: 'Medium' }
  // Videos: { src: 'images/filename.mp4', title: 'Title', medium: 'Medium' }
  // Optional: add position: 'center top' to control crop on image slides.
  // ─────────────────────────────────────────────────────────────────────────
  var heroSlides = [
    { src: 'images/the_maker_thumb.png',              title: 'The Maker',                                      medium: 'Photographic Print',    position: 'center center' },
    { src: 'images/garden_thumb.png',             title: 'Garden',                                         medium: 'Photographic Print',    position: 'center top' },
    { src: 'images/room_depth_fullview.png',             title: 'Room Depth',                                     medium: 'Digital Illustration',  position: 'center center' },
    { src: 'images/sight_by_sound_thumb.png',              title: 'Sight By Sound Packaging',                       medium: 'Digital Illustration',  position: 'center top' },
    { src: 'images/dan_friedman_thumb.png',             title: 'Dan Friedman Information Poster',                medium: 'Digital Illustration',  position: 'center top' },
    { src: 'images/soap_bottles_thumb.png',             title: 'Soap Bottles',                                   medium: 'Oil Painting',          position: 'center center' },
    { src: 'images/vessels_thumb.png',                   title: 'Vessels',                                        medium: 'Oil Painting',          position: 'center center' },
    { src: 'images/shadow_home_thumb.png',         title: 'Shadow Home',                                    medium: 'Photographic Print',    position: 'center top' },
    { src: 'images/lunar_bookmark_thumb.png',             title: '2024 Lunar New Year Bookmark',                   medium: 'Digital Illustration',  position: 'center top' },
    { src: 'images/tutoring_thumb.png',             title: 'Academic Tutoring Poster',                       medium: 'Digital Illustration',  position: 'center top' },
    { src: 'images/arkade_thumb.png',    title: 'ArKade Mood Board & Website',                    medium: 'Web Design',            position: 'center center' },
    { src: 'images/citymd_thumb.png',              title: 'CityMD Logo',                                    medium: 'Digital Illustration',  position: 'center center' },
    { src: 'images/coffee_infographic_thumb.png',             title: 'Coffee Infographic',                             medium: 'Digital Illustration',  position: 'left top' },
    { src: 'images/earthly_thumb.jpg',      title: 'Creation of the Earthly — Exhibition Poster',   medium: 'Digital Illustration',  position: 'center top' },
    { src: 'images/chromatic_thumb.jpg',    title: 'Chromatic Fragments — Exhibition Poster',        medium: 'Digital Illustration',  position: 'center top' },
    { src: 'images/starwars_thumb.png',             title: 'Star Wars: The Empire Strikes Back Movie Poster', medium: 'Digital Illustration', position: 'center top' },
    { src: 'images/glow_of_the_road_thumb.png',             title: 'Glow of The Road',                               medium: 'Photographic Print',    position: 'center center' },
    { src: 'images/mural_thumb.png',        title: 'Mural',                                          medium: 'Mixed Media',           position: 'center center' },
    { src: 'images/laundry_thumb.png',       title: 'What Your Laundry Says About Your Life',         medium: 'Digital Illustration',  position: 'left top' },
    { src: 'images/savior_loop.mp4',         title: "The Illustrator's Savior",                       medium: 'Video' },
    { src: 'images/955_loop.mp4',            title: '9:55',                                           medium: 'Video' },
    { src: 'images/doors_loop.mp4',          title: 'Doors',                                          medium: 'Video' },
    { src: 'images/never_ending_loop.mp4',   title: 'Never Ending',                                   medium: 'Video' },
    { src: 'images/strength_loop.mp4',       title: 'Strength',                                       medium: 'Video' },
    { src: 'images/time_flies_loop.mp4',     title: 'Time Flies',                                     medium: 'Wearable Sculpture' },
    { src: 'images/lakeside_loop.mp4',       title: 'Lakeside Tree',                                  medium: '3D Animation' },
  ];

  if (heroFrame && heroSlides.length) {
    // Always start with The Maker; shuffle the rest
    var first = heroSlides[0];
    var rest = heroSlides.slice(1);
    for (var si = rest.length - 1; si > 0; si--) {
      var sj = Math.floor(Math.random() * (si + 1));
      var tmp = rest[si]; rest[si] = rest[sj]; rest[sj] = tmp;
    }
    var shuffled = [first].concat(rest);

    heroFrame.style.position = 'relative';
    heroFrame.style.cursor = 'pointer';
    heroFrame.innerHTML = '';

    // Spacer keeps aspect ratio
    var spacer = document.createElement('div');
    spacer.style.cssText = 'width:100%;aspect-ratio:4/3;display:block;';
    heroFrame.appendChild(spacer);

    // Two persistent layers — crossfade between them
    var layerStyle = 'position:absolute;inset:0;width:100%;height:100%;transition:opacity 0.9s ease;overflow:hidden;';
    var layerA = document.createElement('div');
    layerA.style.cssText = layerStyle + 'opacity:1;z-index:1;';
    var layerB = document.createElement('div');
    layerB.style.cssText = layerStyle + 'opacity:0;z-index:2;';
    heroFrame.appendChild(layerA);
    heroFrame.appendChild(layerB);

    var heroIndex   = 0;
    var activeLayer   = layerA;
    var inactiveLayer = layerB;

    function isVideo(src) {
      return src.endsWith('.mp4') || src.endsWith('.webm') || src.endsWith('.mov');
    }

    var mediaStyle = 'width:100%;height:100%;object-fit:cover;display:block;';

    function makeMedia(slide) {
      if (isVideo(slide.src)) {
        var v = document.createElement('video');
        v.src = slide.src;
        v.autoplay = true;
        v.loop = false;
        v.muted = true;
        v.playsInline = true;
        v.preload = 'auto';
        v.style.cssText = mediaStyle;
        if (slide.position) v.style.objectPosition = slide.position;
        return v;
      } else {
        var img = document.createElement('img');
        img.src = slide.src;
        img.alt = slide.title;
        img.style.cssText = mediaStyle;
        if (slide.position) img.style.objectPosition = slide.position;
        return img;
      }
    }

    function updateCaption(slide) {
      if (heroTitle) heroTitle.textContent = slide.title;
      var heroMedium = document.querySelector('.hero-showcase-medium');
      if (heroMedium) heroMedium.textContent = slide.medium || '';
    }

    // Load first slide
    var firstEl = makeMedia(shuffled[0]);
    activeLayer.appendChild(firstEl);
    updateCaption(shuffled[0]);
    if (isVideo(shuffled[0].src)) {
      firstEl.play().catch(function(){});
    }

    function setHeroSlide(next) {
      var slide = shuffled[next];
      if (!slide) return;

      inactiveLayer.innerHTML = '';
      var el = makeMedia(slide);

      function doFade() {
        // Bring inactive to front and fade it in
        inactiveLayer.style.zIndex = '2';
        activeLayer.style.zIndex  = '1';
        inactiveLayer.style.opacity = '1';
        activeLayer.style.opacity   = '0';

        if (isVideo(slide.src)) {
          el.play().catch(function(){});
        }

        // After fade completes, pause old video and swap roles
        setTimeout(function () {
          var oldVid = activeLayer.querySelector('video');
          if (oldVid) { try { oldVid.pause(); oldVid.src = ''; } catch(e) {} }
          activeLayer.innerHTML = '';
          var tmp = activeLayer;
          activeLayer   = inactiveLayer;
          inactiveLayer = tmp;
        }, 950);

        updateCaption(slide);
      }

      inactiveLayer.appendChild(el);

      if (isVideo(slide.src)) {
        el.preload = 'auto';
        // Transition to next slide 2 seconds before video ends
        el.addEventListener('timeupdate', function() {
          if (el.duration && el.currentTime >= el.duration - 2) {
            el.removeEventListener('timeupdate', arguments.callee);
            // Force transition to next slide
            clearInterval(heroInterval);
            heroIndex = (heroIndex + 1) % shuffled.length;
            setHeroSlide(heroIndex);
            startHeroRotation();
          }
        });
        var faded = false;
        function fadeOnce() {
          if (!faded) { faded = true; doFade(); }
        }
        el.addEventListener('canplay', fadeOnce, { once: true });
        el.addEventListener('playing', fadeOnce, { once: true });
        el.onerror = fadeOnce;
        // Fallback: fade in after 800ms regardless so it never stalls
        setTimeout(fadeOnce, 800);
        el.load();
        el.play().catch(function(){});
      } else {
        if (el.complete && el.naturalWidth > 0) {
          doFade();
        } else {
          el.onload = doFade;
          el.onerror = doFade;
        }
      }
    }

    // Click → open project in gallery lightbox
    var galleryProjectMap = {
      'The Maker':                                      'The Maker',
      'Garden':                                         'Garden',
      'Room Depth':                                     'Room Depth',
      'Sight By Sound Packaging':                       'Sight By Sound Packaging',
      'Dan Friedman Information Poster':                'Dan Friedman Information Poster',
      'Soap Bottles':                                   'Soap Bottles',
      'Shadow Home':                                    'Shadow Home',
      '2024 Lunar New Year Bookmark':                   '2024 Lunar New Year Bookmark',
      'Academic Tutoring Poster':                       'Academic Tutoring Poster',
      'What Your Laundry Says About Your Life':                'What Your Laundry Says About Your Life',
      'ArKade Mood Board & Website':                    'ArKade Mood Board & Website',
      'CityMD Logo':                                    'CityMD Logo',
      'Coffee Infographic':                             'Coffee Infographic',
      'Creation of the Earthly — Exhibition Poster': 'Creation of the Earthly — Exhibition Poster',
      'Chromatic Fragments — Exhibition Poster':      'Chromatic Fragments — Exhibition Poster',
      'Star Wars: The Empire Strikes Back Movie Poster':'Star Wars: The Empire Strikes Back Movie Poster',
      'Glow of The Road':                               'Glow of The Road',
      'Mural':                                          'Mural',
      'Doors':                                          'Doors',
      'Never Ending':                                   'Never Ending',
      'Time Flies':                                     'Time Flies',
      '9:55':                                           '9:55',
      'Strength':                                       'Strength',
      "The Illustrator's Savior":               "The Illustrator's Savior",
      'Lakeside Tree':                                  'Lakeside Tree',
    };

    heroFrame.addEventListener('click', function () {
      var currentTitle = heroTitle ? heroTitle.textContent : '';
      var projectName = galleryProjectMap[currentTitle] || currentTitle;
      document.body.classList.add('is-leaving');
      setTimeout(function () {
        window.location.href = 'gallery.html?open=' + encodeURIComponent(projectName);
      }, 240);
    });

    setInterval(function () {
      heroIndex = (heroIndex + 1) % shuffled.length;
      setHeroSlide(heroIndex);
      // Preload next image
      var preloadIdx = (heroIndex + 1) % shuffled.length;
      if (!isVideo(shuffled[preloadIdx].src)) {
        var pre = new Image();
        pre.src = shuffled[preloadIdx].src;
      }
    }, 4500);
  }

  // Lightbox (images + video links)
  var lightbox = document.getElementById('lightbox');
  var lightboxBody = document.getElementById('lightbox-body');
  var captionCategory = document.getElementById('lightbox-category');
  var captionTitle = document.getElementById('lightbox-title');
  var captionDesc = document.getElementById('lightbox-desc');
  var galleryLinks = Array.prototype.slice.call(document.querySelectorAll('.gallery-link'));
  var activeIndex = -1;
  var lastFocused = null;

  function isModifiedClick(e) {
    return e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0;
  }

  function inferMediaType(href) {
    if (!href) return 'unknown';
    if (href.indexOf('youtube.com/') !== -1 || href.indexOf('youtu.be/') !== -1) return 'youtube';
    var lower = href.toLowerCase();
    if (lower.endsWith('.mp4') || lower.endsWith('.mov') || lower.endsWith('.webm')) return 'video';
    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.png') || lower.endsWith('.gif') || lower.endsWith('.webp')) return 'image';
    return 'unknown';
  }

  function setCaptionFromLink(link) {
    if (!link) return;
    var item = link.closest('.gallery-item');
    if (!item) return;
    var categoryEl = item.querySelector('.gallery-category');
    var nameEl = item.querySelector('.gallery-name');
    if (captionCategory) captionCategory.textContent = categoryEl ? categoryEl.textContent : '';
    if (captionTitle) captionTitle.textContent = nameEl ? nameEl.textContent : '';
    var descEl = link.querySelector('.gallery-overlay-text');
    if (captionDesc) captionDesc.textContent = descEl ? descEl.textContent : '';
    // Show prototype link only for ArKade
    var protoLink = document.getElementById('lightbox-prototype-link');
    if (protoLink) {
      var title = nameEl ? nameEl.textContent : '';
      protoLink.style.display = title.indexOf('ArKade') !== -1 ? 'inline-flex' : 'none';
    }
  }

  function openLightbox(index) {
    if (!lightbox || !lightboxBody) return;
    if (index < 0 || index >= galleryLinks.length) return;

    activeIndex = index;
    var link = galleryLinks[activeIndex];
    var href = link.getAttribute('data-full') || link.getAttribute('href') || '';
    var mediaType = inferMediaType(href);
    var pdfPages = link.getAttribute('data-pdf-pages');
    var pdfBase = link.getAttribute('data-pdf-base');

    // ArKade prototype: open in lightbox as iframe with blurred backdrop
    var isExternalPrototype = href.indexOf('xd.adobe.com') !== -1 || href.indexOf('figma.com') !== -1;

    // Clear previous media and create a unified frame
    lightboxBody.innerHTML = '';
    setCaptionFromLink(link);

    var frame = document.createElement('div');
    frame.className = 'lightbox-media-frame';
    lightboxBody.appendChild(frame);

    if (pdfPages && pdfBase) {
      // PDF page flipper
      var totalPages = parseInt(pdfPages, 10);
      var currentPage = 1;
      frame.style.cssText = 'position:relative; background:#1a1a1a; display:flex; flex-direction:column; align-items:center; justify-content:center; aspect-ratio:unset; height:80vh;';

      var pdfImg = document.createElement('img');
      pdfImg.style.cssText = 'max-width:100%; max-height:calc(80vh - 56px); object-fit:contain; display:block;';

      var controls = document.createElement('div');
      controls.style.cssText = 'display:flex; align-items:center; gap:1.2rem; padding:0.75rem 0; flex-shrink:0;';

      var btnStyle = 'background:rgba(255,255,255,0.12); border:none; color:#fff; font-size:1.6rem; width:2.2rem; height:2.2rem; border-radius:50%; cursor:pointer; display:flex; align-items:center; justify-content:center; line-height:1; transition:background 0.15s;';

      var prevBtn = document.createElement('button');
      prevBtn.innerHTML = '&#8249;';
      prevBtn.style.cssText = btnStyle;

      var pageCounter = document.createElement('span');
      pageCounter.style.cssText = 'color:rgba(255,255,255,0.7); font-size:0.82rem; letter-spacing:0.06em; min-width:4rem; text-align:center;';

      var nextBtn = document.createElement('button');
      nextBtn.innerHTML = '&#8250;';
      nextBtn.style.cssText = btnStyle;

      function loadPdfPage(n) {
        var pad = n < 10 ? '0' + n : '' + n;
        pdfImg.src = pdfBase + '-' + pad + '.jpg';
        pageCounter.textContent = n + ' / ' + totalPages;
        prevBtn.disabled = n <= 1;
        nextBtn.disabled = n >= totalPages;
        prevBtn.style.opacity = n <= 1 ? '0.3' : '1';
        nextBtn.style.opacity = n >= totalPages ? '0.3' : '1';
      }

      prevBtn.addEventListener('click', function(e) { e.stopPropagation(); if (currentPage > 1) loadPdfPage(--currentPage); });
      nextBtn.addEventListener('click', function(e) { e.stopPropagation(); if (currentPage < totalPages) loadPdfPage(++currentPage); });

      controls.appendChild(prevBtn);
      controls.appendChild(pageCounter);
      controls.appendChild(nextBtn);
      frame.appendChild(pdfImg);
      frame.appendChild(controls);
      loadPdfPage(1);

    } else if (isExternalPrototype) {
      window.open(href, '_blank', 'noopener');
      return;
    } else if (mediaType === 'image') {
      var img = document.createElement('img');
      img.src = href;
      img.alt = (captionTitle && captionTitle.textContent) ? captionTitle.textContent : 'Work preview';
      frame.appendChild(img);
    } else if (mediaType === 'youtube') {
      var videoId = '';
      if (href.indexOf('watch?v=') !== -1) {
        videoId = href.split('watch?v=')[1].split('&')[0];
      } else if (href.indexOf('youtu.be/') !== -1) {
        videoId = href.split('youtu.be/')[1].split(/[?&]/)[0];
      }

      var ytWrap = document.createElement('div');
      ytWrap.style.cssText = 'position:relative;width:100%;aspect-ratio:16/9;background:#000;overflow:hidden;cursor:pointer;';

      var ytDiv = document.createElement('div');
      var ytDivId = 'yt-player-' + Date.now();
      ytDiv.id = ytDivId;
      ytDiv.style.cssText = 'width:100%;height:100%;';
      ytWrap.appendChild(ytDiv);

      var ytOverlay = document.createElement('div');
      ytOverlay.style.cssText = 'position:absolute;inset:0;z-index:10;cursor:pointer;background:transparent;-webkit-tap-highlight-color:transparent;';
      ytWrap.appendChild(ytOverlay);

      frame.appendChild(ytWrap);

      function showTapIndicator(playing) {
        var old = ytWrap.querySelector('.yt-tap-indicator');
        if (old) old.remove();
        var ind = document.createElement('div');
        ind.className = 'yt-tap-indicator';
        ind.innerHTML = playing
          ? '<svg viewBox="0 0 24 24" fill="#fff" width="28" height="28"><path d="M8 5v14l11-7z"/></svg>'
          : '<svg viewBox="0 0 24 24" fill="#fff" width="28" height="28"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/></svg>';
        ytWrap.appendChild(ind);
        setTimeout(function() { if (ind.parentNode) ind.remove(); }, 700);
      }

      function initYTPlayer() {
        var player = new YT.Player(ytDivId, {
          videoId: videoId,
          playerVars: {
            autoplay: 1, controls: 0, rel: 0, modestbranding: 1,
            showinfo: 0, iv_load_policy: 3, cc_load_policy: 0,
            playsinline: 1, disablekb: 1, fs: 0, color: 'white',
            origin: window.location.origin || 'https://brandonkreitsch.com',
          },
          events: {
            onReady: function(e) {
              e.target.playVideo();
              var iframeEl = ytWrap.querySelector('iframe');
              if (iframeEl) iframeEl.style.cssText = 'width:100%;height:100%;border:0;display:block;pointer-events:none;';
            }
          }
        });

        function handleToggle(e) {
          e.preventDefault(); e.stopPropagation();
          try {
            var state = player.getPlayerState();
            if (state === YT.PlayerState.PLAYING) { player.pauseVideo(); showTapIndicator(false); }
            else { player.playVideo(); showTapIndicator(true); }
          } catch(err) {}
        }
        ytOverlay.addEventListener('click', handleToggle);
        ytOverlay.addEventListener('touchend', handleToggle);
      }

      if (window.YT && window.YT.Player) {
        initYTPlayer();
      } else {
        if (!document.getElementById('yt-api-script')) {
          var tag = document.createElement('script');
          tag.id = 'yt-api-script';
          tag.src = 'https://www.youtube.com/iframe_api';
          document.head.appendChild(tag);
        }
        var prevOnReady = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = function() {
          if (typeof prevOnReady === 'function') prevOnReady();
          initYTPlayer();
        };
      }
    } else if (mediaType === 'video') {
      var vwrap = document.createElement('div');
      vwrap.className = 'video-embed-wrap';
      var video = document.createElement('video');
      video.src = href;
      video.controls = true;
      video.autoplay = true;
      video.muted = true;
      video.playsInline = true;
      vwrap.appendChild(video);
      frame.appendChild(vwrap);
    } else {
      window.open(href, '_blank', 'noopener');
      return;
    }

    // Genie effect — expand from the bottom-center of the clicked card
    var cardRect = link.getBoundingClientRect();
    var originX = ((cardRect.left + cardRect.width / 2) / window.innerWidth * 100).toFixed(1) + '%';
    var originY = ((cardRect.bottom) / window.innerHeight * 100).toFixed(1) + '%';
    var dialog = lightbox.querySelector('.lightbox-dialog');
    if (dialog) {
      dialog.style.transformOrigin = originX + ' ' + originY;
    }

    lastFocused = document.activeElement;
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    var closeBtn = lightbox.querySelector('[data-lightbox-close]');
    if (closeBtn) closeBtn.focus();
  }

  function closeLightbox() {
    if (!lightbox || !lightboxBody) return;
    lightbox.classList.add('closing');
    setTimeout(function () {
      lightbox.classList.remove('open', 'closing');
      lightbox.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      lightboxBody.innerHTML = '';
      activeIndex = -1;
      var protoLink = document.getElementById('lightbox-prototype-link');
      if (protoLink) protoLink.style.display = 'none';
      if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
      lastFocused = null;
    }, 320);
  }

  function go(delta) {
    if (activeIndex === -1) return;
    var next = activeIndex + delta;
    if (next < 0) next = galleryLinks.length - 1;
    if (next >= galleryLinks.length) next = 0;
    openLightbox(next);
  }

  // Pre-check whether YouTube embeds are allowed in this context
  var youtubeEmbedAllowed = (function () {
    // file:// protocol always blocks YouTube embeds
    if (window.location.protocol === 'file:') return false;
    // http:// without a real host also won't work
    if (window.location.protocol === 'http:' && window.location.hostname === '') return false;
    return true;
  })();

  if (galleryLinks.length && lightbox) {
    galleryLinks.forEach(function (link, idx) {
      link.addEventListener('click', function (e) {
        if (isModifiedClick(e)) return;
        e.preventDefault();
        openLightbox(idx);
      });
    });

    lightbox.addEventListener('click', function (e) {
      var target = e.target;
      if (!target) return;
      if (target.matches('[data-lightbox-close]')) closeLightbox();
      if (target.matches('[data-lightbox-prev]')) go(-1);
      if (target.matches('[data-lightbox-next]')) go(1);
      if (target === lightbox || target.matches('.lightbox-backdrop')) closeLightbox();
    });

    lightbox.addEventListener('touchend', function (e) {
      var target = e.target;
      if (!target) return;
      if (target === lightbox || target.matches('.lightbox-backdrop')) {
        e.preventDefault();
        closeLightbox();
      }
    });

    document.addEventListener('keydown', function (e) {
      if (!lightbox.classList.contains('open')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'ArrowRight') go(1);
    });
  }

  // Gallery carousels (horizontal scroll with prev/next)
  var carousels = [];
  var workGroups = Array.prototype.slice.call(document.querySelectorAll('.work-group'));
  workGroups.forEach(function (group) {
    var gallery = group.querySelector('.gallery');
    if (!gallery) return;

    group.classList.add('has-carousel');

    var prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.className = 'gallery-nav gallery-nav-prev';
    prevBtn.setAttribute('aria-label', 'Scroll gallery left');
    prevBtn.textContent = '‹';

    var nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'gallery-nav gallery-nav-next';
    nextBtn.setAttribute('aria-label', 'Scroll gallery right');
    nextBtn.textContent = '›';

    prevBtn.addEventListener('click', function () {
      var itemWidth = gallery.querySelector('.gallery-item') ? gallery.querySelector('.gallery-item').offsetWidth + 32 : gallery.clientWidth * 0.8;
      gallery.scrollBy({ left: -itemWidth, behavior: 'smooth' });
    });

    nextBtn.addEventListener('click', function () {
      var itemWidth = gallery.querySelector('.gallery-item') ? gallery.querySelector('.gallery-item').offsetWidth + 32 : gallery.clientWidth * 0.8;
      gallery.scrollBy({ left: itemWidth, behavior: 'smooth' });
    });

    group.appendChild(prevBtn);
    group.appendChild(nextBtn);

    carousels.push({ gallery: gallery, prevBtn: prevBtn, nextBtn: nextBtn });
  });

  function updateCarouselNavVisibility() {
    carousels.forEach(function (c) {
      var gallery = c.gallery;
      var prevBtn = c.prevBtn;
      var nextBtn = c.nextBtn;
      var canScroll = gallery.scrollWidth - gallery.clientWidth > 4;
      // Hide both arrows entirely if everything fits without scrolling
      if (!canScroll) {
        prevBtn.style.display = 'none';
        nextBtn.style.display = 'none';
        return;
      }
      prevBtn.style.display = gallery.scrollLeft > 4 ? 'flex' : 'none';
      nextBtn.style.display = gallery.scrollLeft < gallery.scrollWidth - gallery.clientWidth - 4 ? 'flex' : 'none';
    });
  }

  if (carousels.length) {
    updateCarouselNavVisibility();
    window.addEventListener('resize', updateCarouselNavVisibility);
    carousels.forEach(function (c) {
      c.gallery.addEventListener('scroll', updateCarouselNavVisibility);
    });
  }

  // Mobile resume preview: scale PDF so a full page fits on screen
  (function () {
    var iframe = document.querySelector('.resume-preview-wrap iframe');
    if (!iframe) return;

    function updateResumeScale() {
      var baseWidth = 560;
      var baseHeight = 720;
      var vw = window.innerWidth || baseWidth;
      var vh = window.innerHeight || baseHeight;

      if (vw > 1024) {
        document.documentElement.style.removeProperty('--resume-mobile-scale');
        document.documentElement.style.removeProperty('--resume-tablet-scale');
        return;
      }

      var availableWidth = vw - 24;
      var availableHeight = vh - 160;
      var scaleW = availableWidth / baseWidth;
      var scaleH = availableHeight / baseHeight;
      var scale = Math.min(scaleW, scaleH);
      if (scale < 0.4) scale = 0.4;

      if (vw > 768) {
        document.documentElement.style.removeProperty('--resume-mobile-scale');
        document.documentElement.style.setProperty('--resume-tablet-scale', String(scale));
      } else {
        document.documentElement.style.removeProperty('--resume-tablet-scale');
        document.documentElement.style.setProperty('--resume-mobile-scale', String(scale));
      }
    }

    updateResumeScale();
    window.addEventListener('resize', updateResumeScale);
    window.addEventListener('orientationchange', updateResumeScale);
  })();

  // Add a subtle pop animation to interactive elements
  (function () {
    function makePressable(selector) {
      var nodes = document.querySelectorAll(selector);
      nodes.forEach(function (el) {
        el.classList.add('pressable');

        function addPressed() {
          el.classList.add('is-pressed');
        }

        function removePressed() {
          el.classList.remove('is-pressed');
        }

        el.addEventListener('mousedown', addPressed);
        el.addEventListener('mouseup', removePressed);
        el.addEventListener('mouseleave', removePressed);
        el.addEventListener('touchstart', function () {
          addPressed();
          setTimeout(removePressed, 180);
        }, { passive: true });
        el.addEventListener('touchend', removePressed, { passive: true });
        el.addEventListener('touchcancel', removePressed, { passive: true });
        el.addEventListener('click', function () {
          addPressed();
          setTimeout(removePressed, 140);
        });
      });
    }

    makePressable('.btn');
    makePressable('.gallery-nav');
    makePressable('.lightbox-close');
    makePressable('.lightbox-nav');
    makePressable('.menu-toggle');
    makePressable('.gallery-link');
    makePressable('.nav a');

    // ── Touch: tap to reveal gallery overlay, second tap opens lightbox ──
    if (window.matchMedia('(hover: none), (pointer: coarse)').matches) {
      var lastTouched = null;
      document.querySelectorAll('.gallery-item').forEach(function(item) {
        item.addEventListener('touchstart', function(e) {
          if (lastTouched && lastTouched !== item) {
            lastTouched.classList.remove('touch-active');
          }
          if (!item.classList.contains('touch-active')) {
            e.preventDefault();
            item.classList.add('touch-active');
            lastTouched = item;
          }
        }, { passive: false });
      });
      document.addEventListener('touchstart', function(e) {
        if (lastTouched && !lastTouched.contains(e.target)) {
          lastTouched.classList.remove('touch-active');
          lastTouched = null;
        }
      }, { passive: true });
    }
  })();

  // ── Auto-open lightbox from ?open= URL param (carousel click) ──
  (function () {
    var params = new URLSearchParams(window.location.search);
    var openTitle = params.get('open');
    if (!openTitle) return;

    // Wait for gallery links to be available, then find and open the match
    function tryOpen() {
      var links = Array.prototype.slice.call(document.querySelectorAll('.gallery-link'));
      if (!links.length) return;

      for (var i = 0; i < links.length; i++) {
        var item = links[i].closest('.gallery-item');
        if (!item) continue;
        var nameEl = item.querySelector('.gallery-name');
        if (nameEl && nameEl.textContent.trim() === openTitle) {
          // Small delay so page has rendered and animations have settled
          setTimeout(function (idx) {
            return function () { openLightbox(idx); };
          }(i), 400);
          break;
        }
      }
      // Clean the URL (strip .html) so refreshing doesn't re-open
      var cleanPath = window.location.pathname.replace(/\.html$/, '') || '/';
      history.replaceState(null, '', cleanPath);
    }

    if (document.readyState === 'complete') {
      tryOpen();
    } else {
      window.addEventListener('load', tryOpen);
    }
  })();

  // ── Guard: close lightbox on browser back/forward so case study
  //    back-navigation never re-opens the lightbox behind the page ──
  window.addEventListener('popstate', function () {
    if (lightbox && lightbox.classList.contains('open')) {
      closeLightbox();
    }
  });

  // ── Extended animation system ─────────────────────────────────
  (function () {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // 1. Scroll reveal — add classes then observe
    var revealEls = [];
    function addReveal(selector, cls, stagger) {
      document.querySelectorAll(selector).forEach(function (el, i) {
        el.classList.add(cls || 'reveal');
        if (stagger) el.style.transitionDelay = (i * stagger) + 's';
        revealEls.push(el);
      });
    }

    addReveal('.section-title', 'reveal');
    addReveal('.about-content p', 'reveal', 0.08);
    addReveal('.work-group', 'reveal', 0.06);
    addReveal('.resume-card', 'reveal', 0.07);
    addReveal('.contact-card', 'reveal', 0.08);
    addReveal('.awards-item', 'reveal', 0.06);
    addReveal('.series-entry', 'reveal-scale', 0.07);
    addReveal('.featured-card', 'reveal-scale', 0.07);
    addReveal('.about-inner', 'reveal');
    addReveal('.series-hero-desc', 'reveal');
    addReveal('.series-synopsis', 'reveal');
    addReveal('.hero-copy', 'reveal');
    addReveal('.contact-availability', 'reveal');

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed', 'in', 'bar-in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach(function (el) { io.observe(el); });

    // 2. Section title underline draw-in
    var titleObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          titleObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });
    document.querySelectorAll('.section-title').forEach(function (el) {
      titleObs.observe(el);
    });

    // 3. Image shimmer while loading
    document.querySelectorAll('.gallery-image-wrap img').forEach(function (img) {
      if (!img.complete) {
        img.closest('.gallery-image-wrap').classList.add('is-loading');
        img.addEventListener('load', function () {
          img.closest('.gallery-image-wrap').classList.remove('is-loading');
        });
      }
    });

    // 4. Button ripple on click
    document.querySelectorAll('.btn').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        var rect = btn.getBoundingClientRect();
        var ripple = document.createElement('span');
        ripple.className = 'btn-ripple-el';
        ripple.style.left = (e.clientX - rect.left) + 'px';
        ripple.style.top  = (e.clientY - rect.top) + 'px';
        btn.appendChild(ripple);
        setTimeout(function () { ripple.remove(); }, 600);
      });
    });

    // 5. Series hero title word-split animation
    document.querySelectorAll('.series-hero-title').forEach(function (el) {
      var words = el.textContent.trim().split(/\s+/);
      el.innerHTML = words.map(function (w, i) {
        return '<span class="word" style="animation-delay:' + (0.1 + i * 0.1) + 's">' + w + '</span>';
      }).join(' ');
    });

    // 6. Magnetic button effect (desktop only)
    if (window.matchMedia('(pointer: fine)').matches) {
      document.querySelectorAll('.btn').forEach(function (btn) {
        btn.addEventListener('mousemove', function (e) {
          var rect = btn.getBoundingClientRect();
          var dx = (e.clientX - rect.left - rect.width / 2) * 0.25;
          var dy = (e.clientY - rect.top  - rect.height / 2) * 0.25;
          btn.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
        });
        btn.addEventListener('mouseleave', function () {
          btn.style.transform = '';
        });
      });
    }

    // 7. Gallery card stagger on load
    document.querySelectorAll('.gallery-item').forEach(function (item, i) {
      item.style.animationDelay = ((i % 8) * 0.06) + 's';
    });

    // 8. Work group title reveal
    document.querySelectorAll('.work-group-title').forEach(function (el) {
      el.style.opacity = '0';
      el.style.transform = 'translateX(-12px)';
      var obs = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) {
          el.style.opacity = '1';
          el.style.transform = '';
          obs.disconnect();
        }
      }, { threshold: 0.5 });
      obs.observe(el);
    });

    // 9. Smooth number count-up on visible stat elements
    document.querySelectorAll('[data-count]').forEach(function (el) {
      var target = parseInt(el.getAttribute('data-count'), 10);
      var obs = new IntersectionObserver(function (entries) {
        if (!entries[0].isIntersecting) return;
        obs.disconnect();
        var start = 0, duration = 1200, startTime = null;
        function step(ts) {
          if (!startTime) startTime = ts;
          var progress = Math.min((ts - startTime) / duration, 1);
          var ease = 1 - Math.pow(1 - progress, 3);
          el.textContent = Math.round(ease * target);
          if (progress < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      }, { threshold: 0.8 });
      obs.observe(el);
    });

  })();

  // ── Cursor glow (desktop only) ────────────────────────────────
  (function () {
    if (!window.matchMedia('(pointer: fine)').matches) return;
    var glow = document.createElement('div');
    glow.className = 'cursor-glow';
    document.body.appendChild(glow);
    document.addEventListener('mousemove', function (e) {
      glow.style.left = e.clientX + 'px';
      glow.style.top  = e.clientY + 'px';
    });
  })();

  // ── Button mouse-position radial highlight ────────────────────
  (function () {
    document.querySelectorAll('.btn').forEach(function (btn) {
      btn.addEventListener('mousemove', function (e) {
        var rect = btn.getBoundingClientRect();
        var x = ((e.clientX - rect.left) / rect.width  * 100).toFixed(1) + '%';
        var y = ((e.clientY - rect.top)  / rect.height * 100).toFixed(1) + '%';
        btn.style.setProperty('--mx', x);
        btn.style.setProperty('--my', y);
      });
    });
  })();

  // ── Page transition on nav clicks ────────────────────────────
  (function () {
    document.querySelectorAll('a[href]').forEach(function (link) {
      var href = link.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto') ||
          href.startsWith('tel') || href.startsWith('http') ||
          link.getAttribute('target') === '_blank') return;
      // Don't intercept external prototype links (handled separately) or cs-back links
      if (link.classList.contains('gallery-prototype-link')) return;
      if (link.classList.contains('cs-back')) return;
      link.addEventListener('click', function (e) {
        e.preventDefault();
        document.body.classList.add('is-leaving');
        setTimeout(function () {
          window.location.href = href;
        }, 240);
      });
    });
  })();

  // ── Parallax background squares on scroll ─────────────────────
  (function () {
    var LIGHT_SVG = "url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20viewBox%3D%270%200%201024%201024%27%3E%3Crect%20fill%3D%27rgba(49%2C86%2C64%2C0.014)%27%20width%3D%27121%27%20height%3D%2754%27%20x%3D%2725%27%20y%3D%27759%27%2F%3E%3Crect%20fill%3D%27rgba(49%2C86%2C64%2C0.026)%27%20width%3D%2768%27%20height%3D%2757%27%20x%3D%27754%27%20y%3D%27104%27%2F%3E%3Crect%20fill%3D%27rgba(49%2C86%2C64%2C0.024)%27%20width%3D%2751%27%20height%3D%2767%27%20x%3D%27238%27%20y%3D%27517%27%2F%3E%3Crect%20fill%3D%27rgba(49%2C86%2C64%2C0.027)%27%20width%3D%27111%27%20height%3D%2765%27%20x%3D%27733%27%20y%3D%27665%27%2F%3E%3Crect%20fill%3D%27rgba(49%2C86%2C64%2C0.035)%27%20width%3D%2783%27%20height%3D%2775%27%20x%3D%27159%27%20y%3D%27220%27%2F%3E%3Crect%20fill%3D%27rgba(49%2C86%2C64%2C0.035)%27%20width%3D%2760%27%20height%3D%2799%27%20x%3D%27388%27%20y%3D%27276%27%2F%3E%3Crect%20fill%3D%27rgba(49%2C86%2C64%2C0.031)%27%20width%3D%27138%27%20height%3D%27139%27%20x%3D%2757%27%20y%3D%27234%27%2F%3E%3Crect%20fill%3D%27rgba(49%2C86%2C64%2C0.025)%27%20width%3D%27112%27%20height%3D%27131%27%20x%3D%27322%27%20y%3D%27217%27%2F%3E%3Crect%20fill%3D%27rgba(49%2C86%2C64%2C0.029)%27%20width%3D%27132%27%20height%3D%27132%27%20x%3D%27269%27%20y%3D%27512%27%2F%3E%3Crect%20fill%3D%27rgba(49%2C86%2C64%2C0.033)%27%20width%3D%27125%27%20height%3D%27123%27%20x%3D%27382%27%20y%3D%27448%27%2F%3E%3Crect%20fill%3D%27rgba(49%2C86%2C64%2C0.028)%27%20width%3D%27117%27%20height%3D%27121%27%20x%3D%27175%27%20y%3D%27546%27%2F%3E%3Crect%20fill%3D%27rgba(49%2C86%2C64%2C0.027)%27%20width%3D%27121%27%20height%3D%27128%27%20x%3D%27570%27%20y%3D%27224%27%2F%3E%3C%2Fsvg%3E\")";

    var DARK_SVG = "url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20viewBox%3D%270%200%201024%201024%27%3E%3Crect%20fill%3D%27rgba(110%2C184%2C140%2C0.07)%27%20width%3D%27121%27%20height%3D%2754%27%20x%3D%2725%27%20y%3D%27759%27%2F%3E%3Crect%20fill%3D%27rgba(110%2C184%2C140%2C0.10)%27%20width%3D%2768%27%20height%3D%2757%27%20x%3D%27754%27%20y%3D%27104%27%2F%3E%3Crect%20fill%3D%27rgba(110%2C184%2C140%2C0.08)%27%20width%3D%2751%27%20height%3D%2767%27%20x%3D%27238%27%20y%3D%27517%27%2F%3E%3Crect%20fill%3D%27rgba(110%2C184%2C140%2C0.09)%27%20width%3D%27111%27%20height%3D%2765%27%20x%3D%27733%27%20y%3D%27665%27%2F%3E%3Crect%20fill%3D%27rgba(110%2C184%2C140%2C0.12)%27%20width%3D%2783%27%20height%3D%2775%27%20x%3D%27159%27%20y%3D%27220%27%2F%3E%3Crect%20fill%3D%27rgba(110%2C184%2C140%2C0.11)%27%20width%3D%2760%27%20height%3D%2799%27%20x%3D%27388%27%20y%3D%27276%27%2F%3E%3Crect%20fill%3D%27rgba(110%2C184%2C140%2C0.10)%27%20width%3D%27138%27%20height%3D%27139%27%20x%3D%2757%27%20y%3D%27234%27%2F%3E%3Crect%20fill%3D%27rgba(110%2C184%2C140%2C0.09)%27%20width%3D%27112%27%20height%3D%27131%27%20x%3D%27322%27%20y%3D%27217%27%2F%3E%3Crect%20fill%3D%27rgba(110%2C184%2C140%2C0.10)%27%20width%3D%27132%27%20height%3D%27132%27%20x%3D%27269%27%20y%3D%27512%27%2F%3E%3Crect%20fill%3D%27rgba(110%2C184%2C140%2C0.11)%27%20width%3D%27125%27%20height%3D%27123%27%20x%3D%27382%27%20y%3D%27448%27%2F%3E%3Crect%20fill%3D%27rgba(110%2C184%2C140%2C0.09)%27%20width%3D%27117%27%20height%3D%27121%27%20x%3D%27175%27%20y%3D%27546%27%2F%3E%3Crect%20fill%3D%27rgba(110%2C184%2C140%2C0.10)%27%20width%3D%27121%27%20height%3D%27128%27%20x%3D%27570%27%20y%3D%27224%27%2F%3E%3C%2Fsvg%3E\")";

    function getPattern() {
      return (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? DARK_SVG : LIGHT_SVG;
    }

    var bgLayer = document.createElement('div');
    bgLayer.id = 'bg-parallax';
    bgLayer.style.cssText = 'position:fixed;inset:0;z-index:-1;pointer-events:none;background-size:1024px 1024px;background-repeat:repeat;will-change:background-position;';
    bgLayer.style.backgroundImage = getPattern();
    document.body.insertBefore(bgLayer, document.body.firstChild);

    // Update instantly if user switches scheme at runtime
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function() {
        bgLayer.style.backgroundImage = getPattern();
      });
    }

    var scrollY = 0, ticking = false;
    function updateBg() {
      var offset = (scrollY * 0.3) % 1024;
      bgLayer.style.backgroundPositionY = (-offset) + 'px';
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      scrollY = window.scrollY;
      if (!ticking) { requestAnimationFrame(updateBg); ticking = true; }
    }, { passive: true });
    updateBg();
  })();

  // ── Prototype links: always open in a new tab ──
  (function () {
    document.querySelectorAll('.gallery-prototype-link').forEach(function (link) {
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener');
      // No click override — let the browser handle the new-tab navigation naturally
    });
  })();

  // ══════════════════════════════════════════════════════════════
  // FAILSAFES
  // ══════════════════════════════════════════════════════════════

  // ── Broken image fallback ─────────────────────────────────────
  (function () {
    function attachImgFallback(img) {
      img.addEventListener('error', function () {
        if (img.dataset.fallbackApplied) return;
        img.dataset.fallbackApplied = 'true';
        // Replace with a styled placeholder
        var wrap = img.closest('.gallery-image-wrap, .hero-showcase-frame, .lightbox-media-frame');
        img.style.display = 'none';
        var ph = document.createElement('div');
        ph.style.cssText = 'width:100%;height:100%;min-height:120px;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(82,175,121,0.07);color:#5a6b62;font-size:0.8rem;gap:0.4rem;';
        ph.innerHTML = '<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#52af79" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9l4-4 4 4 4-5 4 5"/><circle cx="8.5" cy="7.5" r="1.5"/></svg><span>Image unavailable</span>';
        if (wrap) {
          wrap.appendChild(ph);
        } else {
          img.parentNode.insertBefore(ph, img);
        }
      });
    }
    // Attach to all current images
    document.querySelectorAll('img').forEach(attachImgFallback);
    // Watch for dynamically added images (lightbox)
    var imgObserver = new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        m.addedNodes.forEach(function (node) {
          if (node.nodeType !== 1) return;
          if (node.tagName === 'IMG') attachImgFallback(node);
          node.querySelectorAll && node.querySelectorAll('img').forEach(attachImgFallback);
        });
      });
    });
    imgObserver.observe(document.body, { childList: true, subtree: true });
  })();

  // ── Instagram embed fallback ──────────────────────────────────
  (function () {
    var igFrame = document.querySelector('.instagram-embed-frame iframe');
    if (!igFrame) return;
    // Give it 8 seconds to load; if it fails show a fallback link
    var igLoaded = false;
    igFrame.addEventListener('load', function () { igLoaded = true; });
    setTimeout(function () {
      if (igLoaded) return;
      var wrap = document.querySelector('.instagram-embed-frame');
      if (!wrap) return;
      igFrame.style.display = 'none';
      var fb = document.createElement('a');
      fb.href = 'https://www.instagram.com/bkreitschdesign/';
      fb.target = '_blank';
      fb.rel = 'noopener';
      fb.style.cssText = 'display:flex;align-items:center;justify-content:center;gap:0.75rem;padding:2rem;text-decoration:none;color:#315640;font-weight:700;font-size:1rem;';
      fb.innerHTML = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#52af79" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="#52af79" stroke="none"/></svg> View @bkreitschdesign on Instagram';
      wrap.appendChild(fb);
    }, 8000);
  })();

  // ── Lightbox iframe/video load error ─────────────────────────
  (function () {
    var origOpen = typeof openLightbox === 'function' ? openLightbox : null;
    // Watch lightbox body for added iframes/videos and attach error handlers
    var lbBody = document.getElementById('lightbox-body');
    if (!lbBody) return;
    var lbObserver = new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        m.addedNodes.forEach(function (node) {
          if (node.nodeType !== 1) return;
          // Video error
          var videos = node.querySelectorAll ? node.querySelectorAll('video') : [];
          videos.forEach(function (v) {
            v.addEventListener('error', function () {
              v.outerHTML = '<p style="color:#5a6b62;padding:2rem;text-align:center;">Video could not be loaded.</p>';
            });
          });
          // iframe timeout fallback (e.g. YouTube blocked)
          var iframes = node.querySelectorAll ? node.querySelectorAll('iframe') : [];
          iframes.forEach(function (f) {
            var loaded = false;
            f.addEventListener('load', function () { loaded = true; });
            setTimeout(function () {
              if (loaded) return;
              var src = f.src || '';
              var isYt = src.indexOf('youtube') !== -1 || src.indexOf('youtu') !== -1;
              var videoId = src.indexOf('/embed/') !== -1 ? src.split('/embed/')[1].split('?')[0] : '';
              var fallbackUrl = isYt && videoId ? ('https://youtu.be/' + videoId) : src;
              var fallback = document.createElement('div');
              fallback.style.cssText = 'display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1.2rem;width:100%;height:100%;min-height:200px;padding:2rem;box-sizing:border-box;';
              fallback.innerHTML = '<p style="color:rgba(255,255,255,0.55);font-size:0.9rem;text-align:center;margin:0;">Video couldn\'t load inline.</p>' +
                '<a href="' + fallbackUrl + '" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:0.6rem;padding:0.7rem 1.4rem;border-radius:999px;background:#52af79;color:#fff;font-weight:700;font-size:0.9rem;text-decoration:none;letter-spacing:0.06em;">' +
                '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M10 16.5l6-4.5-6-4.5v9zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>' +
                'Watch on YouTube</a>';
              try { f.parentNode.replaceChild(fallback, f); } catch(e) {}
            }, 7000);
          });
        });
      });
    });
    lbObserver.observe(lbBody, { childList: true, subtree: true });
  })();

  // ── Font fallback — if Roboto fails, ensure system font is clean ─
  (function () {
    if (!document.fonts || !document.fonts.ready) return;
    document.fonts.ready.then(function () {
      var robotoLoaded = false;
      document.fonts.forEach(function (f) {
        if (f.family.indexOf('Roboto') !== -1 && f.status === 'loaded') robotoLoaded = true;
      });
      if (!robotoLoaded) {
        document.documentElement.style.setProperty('--font-display', 'system-ui, sans-serif');
        document.documentElement.style.setProperty('--font-body', 'system-ui, sans-serif');
      }
    });
  })();

  // ── Global JS error catcher — prevent blank page ──────────────
  window.addEventListener('error', function (e) {
    console.warn('Site error caught:', e.message, 'at', e.filename, ':', e.lineno);
    // Ensure scroll is never permanently locked
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
  });

  window.addEventListener('unhandledrejection', function (e) {
    console.warn('Unhandled promise rejection:', e.reason);
  });

  // ── Scroll lock safety net — if lightbox somehow gets stuck ───
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
  });

  // ── Widow control across pages + breakpoints ───────────────────
  (function () {
    var textSelectors = [
      'p',
      'li',
      'h1', 'h2', 'h3', 'h4',
      '.gallery-name',
      '.gallery-category',
      '.section-title',
      '.hero-title',
      '.hero-desc',
      '.series-hero-title',
      '.series-hero-desc',
      '.series-title',
      '.series-description',
      '.lightbox-title',
      '.lightbox-category',
      '.lightbox-desc'
    ].join(', ');

    function normalizeSpaces(text) {
      return text.replace(/\u00A0/g, ' ').replace(/\s+/g, ' ').trim();
    }

    function widontText(text) {
      var normalized = normalizeSpaces(text);
      var parts = normalized.split(' ');
      if (parts.length < 3) return text;
      var lastSpace = normalized.lastIndexOf(' ');
      if (lastSpace === -1) return text;
      return normalized.slice(0, lastSpace) + '\u00A0' + normalized.slice(lastSpace + 1);
    }

    function applyWidont() {
      var nodes = document.querySelectorAll(textSelectors);
      nodes.forEach(function (el) {
        // Skip areas where text splitting can break interactions/labels.
        if (el.closest('nav, .menu-toggle, .logo')) return;
        if (el.children.length > 0) return;

        if (!el.dataset.widontOriginal) {
          el.dataset.widontOriginal = el.textContent || '';
        }
        var original = el.dataset.widontOriginal || '';
        var updated = widontText(original);
        if (updated && updated !== el.textContent) {
          el.textContent = updated;
        }
      });
    }

    var resizeTimer = null;
    window.addEventListener('resize', function () {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(applyWidont, 140);
    });

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', applyWidont);
    } else {
      applyWidont();
    }
  })();

})();

/* ══════════════════════════════════════════════════════════════════
   SITE-WIDE ANIMATIONS
   ══════════════════════════════════════════════════════════════════ */
(function() {
  'use strict';

  // ── 1. Scroll reveal — sections, titles, cards ─────────────────
  function initReveal() {
    // Tag elements for reveal
    var revealEls = [
      { sel: '.section-title',     cls: 'reveal' },
      { sel: '.about-inner',       cls: 'reveal' },
      { sel: '.contact-card',      cls: 'reveal' },
      { sel: '.resume-card',       cls: 'reveal' },
      { sel: '.series-entry',      cls: 'reveal' },
      { sel: '.featured-card',     cls: 'reveal-scale' },
      { sel: '.hero-showcase',     cls: 'reveal-right' },
      { sel: '.work-group-title',  cls: 'reveal' },
      { sel: '.series-hero-title', cls: 'reveal' },
      { sel: '.series-hero-desc',  cls: 'reveal' },
    ];

    revealEls.forEach(function(item) {
      document.querySelectorAll(item.sel).forEach(function(el) {
        if (!el.classList.contains('reveal') &&
            !el.classList.contains('reveal-left') &&
            !el.classList.contains('reveal-right') &&
            !el.classList.contains('reveal-scale')) {
          el.classList.add(item.cls);
        }
      });
    });

    var revealObs = new IntersectionObserver(function(entries) {
      entries.forEach(function(e) {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          revealObs.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale')
      .forEach(function(el) { revealObs.observe(el); });
  }

  // ── 2. Gallery card stagger ────────────────────────────────────
  function initCardStagger() {
    var cardObs = new IntersectionObserver(function(entries) {
      entries.forEach(function(e) {
        if (e.isIntersecting) {
          e.target.classList.add('card-visible');
          cardObs.unobserve(e.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -20px 0px' });

    document.querySelectorAll('.gallery-item').forEach(function(card, i) {
      // Stagger within each row group (reset every 6)
      var delay = (i % 6) * 0.07;
      card.style.transitionDelay = delay + 's';
      cardObs.observe(card);
    });
  }

  // ── 3. Page transitions ────────────────────────────────────────
  function initPageTransitions() {
    // Fade out on internal link click
    document.querySelectorAll('a[href]').forEach(function(link) {
      var href = link.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('http') ||
          href.startsWith('mailto') || href.startsWith('tel') ||
          link.target === '_blank') return;

      link.addEventListener('click', function(e) {
        var dest = link.href;
        if (dest === window.location.href) return;
        e.preventDefault();
        document.body.style.opacity = '0';
        document.body.style.transform = 'translateY(-6px)';
        document.body.style.transition = 'opacity 0.22s ease, transform 0.22s ease';
        setTimeout(function() { window.location.href = dest; }, 220);
      });
    });

    // Fade in on load
    document.body.style.opacity = '0';
    document.body.style.transform = 'translateY(10px)';
    document.body.style.transition = 'opacity 0.45s cubic-bezier(0.22,1,0.36,1), transform 0.45s cubic-bezier(0.22,1,0.36,1)';
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        document.body.style.opacity = '1';
        document.body.style.transform = 'none';
      });
    });
  }

  // ── 4. Hero title character split animation ────────────────────
  function initHeroTitle() {
    var title = document.querySelector('.hero-title');
    if (!title || title.dataset.split) return;
    title.dataset.split = '1';

    var text = title.textContent;
    title.textContent = '';
    var words = text.split(' ');
    words.forEach(function(word, wi) {
      var span = document.createElement('span');
      span.style.cssText = 'display:inline-block;overflow:hidden;vertical-align:bottom;';
      var inner = document.createElement('span');
      inner.textContent = word;
      inner.style.cssText = 'display:inline-block;transform:translateY(110%);opacity:0;' +
        'transition:transform 0.7s cubic-bezier(0.22,1,0.36,1) ' + (0.08 + wi * 0.1) + 's,' +
        'opacity 0.5s ease ' + (0.08 + wi * 0.1) + 's;';
      span.appendChild(inner);
      title.appendChild(span);
      if (wi < words.length - 1) title.appendChild(document.createTextNode(' '));
    });

    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        title.querySelectorAll('span > span').forEach(function(s) {
          s.style.transform = 'none';
          s.style.opacity = '1';
        });
      });
    });
  }

  // ── 5. Cursor magnetic effect on buttons ──────────────────────
  function initMagneticButtons() {
    if (window.matchMedia('(hover: none)').matches) return;
    document.querySelectorAll('.btn').forEach(function(btn) {
      btn.addEventListener('mousemove', function(e) {
        var r = btn.getBoundingClientRect();
        var x = e.clientX - r.left - r.width / 2;
        var y = e.clientY - r.top - r.height / 2;
        btn.style.transform = 'translate(' + (x * 0.18) + 'px, ' + (y * 0.18) + 'px) scale(1.04)';
      });
      btn.addEventListener('mouseleave', function() {
        btn.style.transform = '';
      });
    });
  }

  // ── 6. Section title underline draw on scroll ─────────────────
  function initTitleUnderlines() {
    var ulObs = new IntersectionObserver(function(entries) {
      entries.forEach(function(e) {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          ulObs.unobserve(e.target);
        }
      });
    }, { threshold: 0.5 });
    document.querySelectorAll('.section-title').forEach(function(el) {
      ulObs.observe(el);
    });
  }

  // ── 7. Smooth counter for any [data-count] elements ───────────
  function initCounters() {
    document.querySelectorAll('[data-count]').forEach(function(el) {
      var target = parseInt(el.dataset.count, 10);
      var obs = new IntersectionObserver(function(entries) {
        if (!entries[0].isIntersecting) return;
        obs.disconnect();
        var start = 0, duration = 1200, startTime = null;
        function step(ts) {
          if (!startTime) startTime = ts;
          var p = Math.min((ts - startTime) / duration, 1);
          el.textContent = Math.floor(p * target);
          if (p < 1) requestAnimationFrame(step);
          else el.textContent = target;
        }
        requestAnimationFrame(step);
      }, { threshold: 0.5 });
      obs.observe(el);
    });
  }

  // ── Init all ──────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      initReveal();
      initCardStagger();
      initPageTransitions();
      initHeroTitle();
      initMagneticButtons();
      initTitleUnderlines();
      initCounters();
    });
  } else {
    initReveal();
    initCardStagger();
    initPageTransitions();
    initHeroTitle();
    initMagneticButtons();
    initTitleUnderlines();
    initCounters();
  }

})();
