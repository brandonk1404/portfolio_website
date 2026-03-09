(function () {
  // Current year in footer
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

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
      link.addEventListener('click', closeMenu);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
    });

    window.addEventListener('resize', function () {
      if (window.matchMedia('(min-width: 769px)').matches) closeMenu();
    });
  })();

  // Gallery dropdown (desktop & mobile)
  var galleryGroup = document.querySelector('.nav-group');
  var galleryToggle = document.querySelector('.nav-link-main');
  if (galleryGroup && galleryToggle) {
    galleryToggle.addEventListener('click', function () {
      var isOpen = galleryGroup.classList.toggle('open');
      galleryToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    document.addEventListener('click', function (e) {
      if (!galleryGroup.contains(e.target) && galleryGroup.classList.contains('open')) {
        galleryGroup.classList.remove('open');
        galleryToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Hero auto-slideshow (selected work)
  var heroImage = document.querySelector('.hero-showcase-image');
  var heroCategory = document.querySelector('.hero-showcase-category');
  var heroTitle = document.querySelector('.hero-showcase-title');
  var heroYear = document.querySelector('.hero-showcase-year');

  var heroSlides = [
    { src: 'images/image8.jpg', title: 'The Maker', category: 'Photography', year: '2024' },
    { src: 'images/image17.jpg', title: 'Garden', category: 'Photography', year: '2024' },
    { src: 'images/image16.png', title: 'Room Depth', category: 'Digital', year: '2024' },
    { src: 'images/image2.png', title: 'Sight By Sound Packaging', category: 'Digital', year: '2024' },
    { src: 'images/image19.png', title: 'Dan Friedman Poster', category: 'Digital', year: '2023' },
    { src: 'images/image15.jpg', title: 'Soap Bottles', category: 'Oil Painting', year: '2023' },
    { src: 'images/image9.jpg', title: 'Shadow Home', category: 'Photography', year: '2023' },
    { src: 'images/image18.jpg', title: 'Time Flies', category: 'Video', year: '2024' },
    { src: 'images/955_poster.png', title: '9:55', category: 'Video', year: '2024' },
    { src: 'images/strength_poster.png', title: 'Strength', category: 'Video', year: '2024' }
  ];

  if (heroImage && heroCategory && heroTitle && heroYear && heroSlides.length) {
    var heroIndex = 0;

    function setHeroSlide(next) {
      var slide = heroSlides[next];
      if (!slide) return;
      heroImage.style.opacity = '0';
      setTimeout(function () {
        heroImage.src = slide.src;
        heroImage.alt = slide.title;
        heroCategory.textContent = slide.category;
        heroTitle.textContent = slide.title;
        heroYear.textContent = slide.year || '';
        heroImage.style.opacity = '1';
      }, 260);
    }

    setInterval(function () {
      heroIndex = (heroIndex + 1) % heroSlides.length;
      setHeroSlide(heroIndex);
    }, 4500);
  }

  // Lightbox (images + video links)
  var lightbox = document.getElementById('lightbox');
  var lightboxBody = document.getElementById('lightbox-body');
  var captionCategory = document.getElementById('lightbox-category');
  var captionTitle = document.getElementById('lightbox-title');
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
  }

  function openLightbox(index) {
    if (!lightbox || !lightboxBody) return;
    if (index < 0 || index >= galleryLinks.length) return;

    activeIndex = index;
    var link = galleryLinks[activeIndex];
    var href = link.getAttribute('href') || '';
    var mediaType = inferMediaType(href);

    // Clear previous media
    lightboxBody.innerHTML = '';
    setCaptionFromLink(link);

    if (mediaType === 'image') {
      var img = document.createElement('img');
      img.src = href;
      img.alt = (captionTitle && captionTitle.textContent) ? captionTitle.textContent : 'Work preview';
      lightboxBody.appendChild(img);
    } else if (mediaType === 'youtube') {
      // Open directly on YouTube to avoid embedded playback issues
      window.open(href, '_blank', 'noopener');
      return;
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
      lightboxBody.appendChild(vwrap);
    } else {
      // Fallback: open link in new tab if we can't preview it
      window.open(href, '_blank', 'noopener');
      return;
    }

    lastFocused = document.activeElement;
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    var closeBtn = lightbox.querySelector('[data-lightbox-close]');
    if (closeBtn) closeBtn.focus();
  }

  function closeLightbox() {
    if (!lightbox || !lightboxBody) return;
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    lightboxBody.innerHTML = '';
    activeIndex = -1;
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
    lastFocused = null;
  }

  function go(delta) {
    if (activeIndex === -1) return;
    var next = activeIndex + delta;
    if (next < 0) next = galleryLinks.length - 1;
    if (next >= galleryLinks.length) next = 0;
    openLightbox(next);
  }

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
      gallery.scrollBy({ left: -gallery.clientWidth * 0.8, behavior: 'smooth' });
    });

    nextBtn.addEventListener('click', function () {
      gallery.scrollBy({ left: gallery.clientWidth * 0.8, behavior: 'smooth' });
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
      var display = canScroll ? 'flex' : 'none';
      prevBtn.style.display = display;
      nextBtn.style.display = display;
    });
  }

  if (carousels.length) {
    updateCarouselNavVisibility();
    window.addEventListener('resize', updateCarouselNavVisibility);
  }
})();
