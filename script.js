// Theme management
let currentTheme = localStorage.getItem('theme') || 'light';

// Function to apply theme
function applyTheme(theme, options = {}) {
  const { persist = true } = options;
  
  currentTheme = theme;
  if (persist && localStorage.getItem('theme') !== theme) {
    localStorage.setItem('theme', theme);
  }
  
  document.documentElement.setAttribute('data-theme', theme);
  
  // Update theme toggle button icon
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
  }
}

// Initialize theme on page load
function initTheme() {
  applyTheme(currentTheme);
  
  // Set up theme toggle button
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      applyTheme(newTheme);
    });
  }
}

// Keep pages in sync when theme is changed elsewhere
window.addEventListener('storage', event => {
  if (event.key === 'theme' && event.newValue && event.newValue !== currentTheme) {
    applyTheme(event.newValue, { persist: false });
  }
});

// Language management
let currentLang = localStorage.getItem('lang') || 'en';

// Function to apply translations
function applyTranslations(lang, options = {}) {
  if (typeof translations === 'undefined' || !lang) return;

  const { persist = true } = options;

  currentLang = lang;
  if (persist && localStorage.getItem('lang') !== lang) {
    localStorage.setItem('lang', lang);
  }
  
  // Update HTML lang attribute
  document.documentElement.lang = lang;
  
  // Update all elements with data-i18n attribute (excluding title)
  document.querySelectorAll('[data-i18n]').forEach(element => {
    // Skip title tags - they're handled separately
    if (element.tagName === 'TITLE') return;
    
    const key = element.getAttribute('data-i18n');
    if (translations[lang] && translations[lang][key]) {
      // Preserve child elements with menu-item-size class (for liter/sizes in menu)
      const sizeElement = element.querySelector('.menu-item-size');
      let sizeHTML = sizeElement ? sizeElement.outerHTML : '';
      
      element.innerHTML = translations[lang][key];
      
      // Re-append the size element if it existed
      if (sizeHTML) {
        element.innerHTML += ' ' + sizeHTML;
      }
    }
  });
  
  // Replace Georgian "ლ" with "L" in size elements when language is English
  if (lang === 'en') {
    document.querySelectorAll('.menu-item-size').forEach(sizeElement => {
      if (sizeElement.textContent.includes('ლ')) {
        sizeElement.textContent = sizeElement.textContent.replace(/ლ/g, 'L');
      }
    });
  }
  
  // Update title tag separately
  const titleElement = document.querySelector('title[data-i18n]');
  if (titleElement) {
    const titleKey = titleElement.getAttribute('data-i18n');
    if (translations[lang] && translations[lang][titleKey]) {
      document.title = translations[lang][titleKey];
    }
  }
  
  // Update active language button state
  document.querySelectorAll('.lang-btn').forEach(btn => {
    if (btn.getAttribute('data-lang') === lang) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

// Initialize language on page load
function initLanguage() {
  if (typeof translations !== 'undefined') {
    applyTranslations(currentLang);
    
    // Set up language switcher buttons
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const lang = btn.getAttribute('data-lang');
        applyTranslations(lang);
      });
    });
  }
}

// Keep pages in sync when language is changed elsewhere
window.addEventListener('storage', event => {
  if (event.key === 'lang' && event.newValue && event.newValue !== currentLang) {
    applyTranslations(event.newValue, { persist: false });
  }
});

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initLanguage();
  });
} else {
  initTheme();
  initLanguage();
}

// Force background video to play automatically
const bgVideo = document.querySelector('.site-bg-video');
if (bgVideo) {
  // Ensure video is muted (required for autoplay on mobile)
  bgVideo.muted = true;
  bgVideo.volume = 0;
  bgVideo.setAttribute('playsinline', '');
  bgVideo.setAttribute('webkit-playsinline', '');
  
  // Set playback rate to 0.7 (70% speed)
  bgVideo.playbackRate = 0.7;
  
  // Try to play immediately
  const tryPlay = () => {
    const playPromise = bgVideo.play();
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        // If autoplay fails, try on any user interaction
        const playOnInteraction = () => {
          bgVideo.play().catch(() => {});
        };
        
        // Try on multiple events to catch any user interaction
        document.addEventListener('click', playOnInteraction, { once: true });
        document.addEventListener('touchstart', playOnInteraction, { once: true });
        document.addEventListener('touchend', playOnInteraction, { once: true });
        document.addEventListener('mousemove', playOnInteraction, { once: true });
        document.addEventListener('keydown', playOnInteraction, { once: true });
        document.addEventListener('scroll', playOnInteraction, { once: true });
        
        // Also try when page becomes visible (user switches back to tab)
        document.addEventListener('visibilitychange', () => {
          if (!document.hidden) {
            bgVideo.play().catch(() => {});
          }
        });
      });
    }
  };
  
  // Try when page loads
  if (bgVideo.readyState >= 2) {
    tryPlay();
  } else {
    bgVideo.addEventListener('loadeddata', tryPlay, { once: true });
    bgVideo.addEventListener('loadedmetadata', tryPlay, { once: true });
  }
  
  // Also try when can play
  bgVideo.addEventListener('canplay', tryPlay, { once: true });
  bgVideo.addEventListener('canplaythrough', tryPlay, { once: true });
  
  // Force load the video
  bgVideo.load();
}

// Scroll Fade-In Animation
const sections = document.querySelectorAll('.fade');

const observer = new IntersectionObserver((entries, obs) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      // Stop observing once visible so it won't retrigger
      obs.unobserve(entry.target);
    }
  });
}, {
  root: null,
  rootMargin: '0px 0px -10% 0px',
  threshold: 0.1
});

sections.forEach(section => observer.observe(section));

// Logo tilt interaction (desktop pointers only)
const enableTilt = window.matchMedia && window.matchMedia('(pointer: fine)').matches;
const logo = document.querySelector('.logo');
if (enableTilt && logo) {
  const maxTiltDeg = 10;
  const scale = 1.02;
  function handleMove(e) {
    const rect = logo.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;  // 0..1
    const y = (e.clientY - rect.top) / rect.height; // 0..1
    const tiltX = (0.5 - y) * maxTiltDeg;
    const tiltY = (x - 0.5) * maxTiltDeg;
    logo.style.transform = `rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(${scale})`;
  }
  function resetTilt() {
    logo.style.transform = '';
  }
  logo.addEventListener('mousemove', handleMove);
  logo.addEventListener('mouseleave', resetTilt);
}

// Menu Category Switching
function initMenuCategories() {
  const menuCategoryButtons = document.querySelectorAll('.menu-category-btn');
  const menuSections = document.querySelectorAll('.menu-section[data-menu-category]');

  if (menuCategoryButtons.length > 0) {
    // Function to switch categories
    function switchCategory(category) {
      // Update active button
      menuCategoryButtons.forEach(b => {
        if (b.getAttribute('data-category') === category) {
          b.classList.add('active');
        } else {
          b.classList.remove('active');
        }
      });
      
      // Show/hide sections
      menuSections.forEach(section => {
        const sectionCategory = section.getAttribute('data-menu-category');
        if (sectionCategory === category) {
          section.classList.add('active');
          section.style.display = 'block';
        } else {
          section.classList.remove('active');
          section.style.display = 'none';
        }
      });
    }
    
    // Add click handlers
    menuCategoryButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const category = btn.getAttribute('data-category');
        switchCategory(category);
        
        // Scroll to first visible section
        const firstVisible = document.querySelector('.menu-section.active');
        if (firstVisible) {
          setTimeout(() => {
            firstVisible.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 100);
        }
      });
    });
    
    // Initialize: show georgian category by default
    switchCategory('georgian');
  }
}

// Initialize menu categories when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMenuCategories);
} else {
  initMenuCategories();
}