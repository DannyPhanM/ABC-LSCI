function getFocusableElements(container) {
  return Array.from(
    container.querySelectorAll(
      "summary, a[href], button:enabled, [tabindex]:not([tabindex^='-']), [draggable], area, input:not([type=hidden]):enabled, select:enabled, textarea:enabled, object, iframe"
    )
  );
}

document.querySelectorAll('[id^="Details-"] summary').forEach((summary) => {
  summary.setAttribute('role', 'button');
  summary.setAttribute('aria-expanded', summary.parentNode.hasAttribute('open'));

  if (summary.nextElementSibling.getAttribute('id')) {
    summary.setAttribute('aria-controls', summary.nextElementSibling.id);
  }

  summary.addEventListener('click', (event) => {
    event.currentTarget.setAttribute('aria-expanded', !event.currentTarget.closest('details').hasAttribute('open'));
  });

  if (summary.closest('header-drawer, menu-drawer')) return;
  summary.parentElement.addEventListener('keyup', onKeyUpEscape);
});

const trapFocusHandlers = {};

function trapFocus(container, elementToFocus = container) {
  var elements = getFocusableElements(container);
  var first = elements[0];
  var last = elements[elements.length - 1];

  removeTrapFocus();

  trapFocusHandlers.focusin = (event) => {
    if (event.target !== container && event.target !== last && event.target !== first) return;

    document.addEventListener('keydown', trapFocusHandlers.keydown);
  };

  trapFocusHandlers.focusout = function () {
    document.removeEventListener('keydown', trapFocusHandlers.keydown);
  };

  trapFocusHandlers.keydown = function (event) {
    if (event.code.toUpperCase() !== 'TAB') return; // If not TAB key
    // On the last focusable element and tab forward, focus the first element.
    if (event.target === last && !event.shiftKey) {
      event.preventDefault();
      first.focus();
    }

    //  On the first focusable element and tab backward, focus the last element.
    if ((event.target === container || event.target === first) && event.shiftKey) {
      event.preventDefault();
      last.focus();
    }
  };

  document.addEventListener('focusout', trapFocusHandlers.focusout);
  document.addEventListener('focusin', trapFocusHandlers.focusin);

  elementToFocus.focus();

  if (
    elementToFocus.tagName === 'INPUT' &&
    ['search', 'text', 'email', 'url'].includes(elementToFocus.type) &&
    elementToFocus.value
  ) {
    elementToFocus.setSelectionRange(0, elementToFocus.value.length);
  }
}

// Here run the querySelector to figure out if the browser supports :focus-visible or not and run code based on it.
try {
  document.querySelector(':focus-visible');
} catch (e) {
  focusVisiblePolyfill();
}

function focusVisiblePolyfill() {
  const navKeys = [
    'ARROWUP',
    'ARROWDOWN',
    'ARROWLEFT',
    'ARROWRIGHT',
    'TAB',
    'ENTER',
    'SPACE',
    'ESCAPE',
    'HOME',
    'END',
    'PAGEUP',
    'PAGEDOWN',
  ];
  let currentFocusedElement = null;
  let mouseClick = null;

  window.addEventListener('keydown', (event) => {
    if (navKeys.includes(event.code.toUpperCase())) {
      mouseClick = false;
    }
  });

  window.addEventListener('mousedown', (event) => {
    mouseClick = true;
  });

  window.addEventListener(
    'focus',
    () => {
      if (currentFocusedElement) currentFocusedElement.classList.remove('focused');

      if (mouseClick) return;

      currentFocusedElement = document.activeElement;
      currentFocusedElement.classList.add('focused');
    },
    true
  );
}

function pauseAllMedia() {
  document.querySelectorAll('.js-youtube').forEach((video) => {
    video.contentWindow.postMessage('{"event":"command","func":"' + 'pauseVideo' + '","args":""}', '*');
  });
  document.querySelectorAll('.js-vimeo').forEach((video) => {
    video.contentWindow.postMessage('{"method":"pause"}', '*');
  });
  document.querySelectorAll('video').forEach((video) => video.pause());
  document.querySelectorAll('video.card_video').forEach((card_video) => card_video.play());
  document.querySelectorAll('product-model').forEach((model) => {
    if (model.modelViewerUI) model.modelViewerUI.pause();
  });
}

function removeTrapFocus(elementToFocus = null) {
  document.removeEventListener('focusin', trapFocusHandlers.focusin);
  document.removeEventListener('focusout', trapFocusHandlers.focusout);
  document.removeEventListener('keydown', trapFocusHandlers.keydown);

  if (elementToFocus) elementToFocus.focus();
}

function onKeyUpEscape(event) {
  if (event.code.toUpperCase() !== 'ESCAPE') return;

  const openDetailsElement = event.target.closest('details[open]');
  if (!openDetailsElement) return;

  const summaryElement = openDetailsElement.querySelector('summary');
  openDetailsElement.removeAttribute('open');
  summaryElement.setAttribute('aria-expanded', false);
  summaryElement.focus();
}

class QuantityInput extends HTMLElement {
  constructor() {
    super();
    this.input = this.querySelector('input');
    this.changeEvent = new Event('change', { bubbles: true });
    this.input.addEventListener('change', this.onInputChange.bind(this));
    this.querySelectorAll('button').forEach((button) =>
      button.addEventListener('click', this.onButtonClick.bind(this))
    );
  }

  quantityUpdateUnsubscriber = undefined;

  connectedCallback() {
    this.validateQtyRules();
    this.quantityUpdateUnsubscriber = subscribe(PUB_SUB_EVENTS.quantityUpdate, this.validateQtyRules.bind(this));
  }

  disconnectedCallback() {
    if (this.quantityUpdateUnsubscriber) {
      this.quantityUpdateUnsubscriber();
    }
  }

  onInputChange(event) {
    this.validateQtyRules();
  }

  onButtonClick(event) {
    event.preventDefault();
    const previousValue = this.input.value;

    if (event.target.name === 'plus') {
      if (parseInt(this.input.dataset.min) > parseInt(this.input.step) && this.input.value == 0) {
        this.input.value = this.input.dataset.min;
      } else {
        this.input.stepUp();
      } 
    } else {
      this.input.stepDown();
    }

    if (previousValue !== this.input.value) this.input.dispatchEvent(this.changeEvent);

    if (this.input.dataset.min === previousValue && event.target.name === 'minus') {
      this.input.value = parseInt(this.input.min);
    }
  }

  validateQtyRules() {
    const value = parseInt(this.input.value);
    if (this.input.min) {
      const buttonMinus = this.querySelector(".quantity__button[name='minus']");
      buttonMinus.classList.toggle('disabled', parseInt(value) <= parseInt(this.input.min));
    }
    if (this.input.max) {
      const max = parseInt(this.input.max);
      const buttonPlus = this.querySelector(".quantity__button[name='plus']");
      buttonPlus.classList.toggle('disabled', value >= max);
    }
  }
}

customElements.define('quantity-input', QuantityInput);

function debounce(fn, wait) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}

function throttle(fn, delay) {
  let lastCall = 0;
  return function (...args) {
    const now = new Date().getTime();
    if (now - lastCall < delay) {
      return;
    }
    lastCall = now;
    return fn(...args);
  };
}

function fetchConfig(type = 'json') {
  return {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: `application/${type}` },
  };
}

/*
 * Shopify Common JS
 *
 */
if (typeof window.Shopify == 'undefined') {
  window.Shopify = {};
}

Shopify.bind = function (fn, scope) {
  return function () {
    return fn.apply(scope, arguments);
  };
};

Shopify.setSelectorByValue = function (selector, value) {
  for (var i = 0, count = selector.options.length; i < count; i++) {
    var option = selector.options[i];
    if (value == option.value || value == option.innerHTML) {
      selector.selectedIndex = i;
      return i;
    }
  }
};

Shopify.addListener = function (target, eventName, callback) {
  target.addEventListener
    ? target.addEventListener(eventName, callback, false)
    : target.attachEvent('on' + eventName, callback);
};

Shopify.postLink = function (path, options) {
  options = options || {};
  var method = options['method'] || 'post';
  var params = options['parameters'] || {};

  var form = document.createElement('form');
  form.setAttribute('method', method);
  form.setAttribute('action', path);

  for (var key in params) {
    var hiddenField = document.createElement('input');
    hiddenField.setAttribute('type', 'hidden');
    hiddenField.setAttribute('name', key);
    hiddenField.setAttribute('value', params[key]);
    form.appendChild(hiddenField);
  }
  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
};

Shopify.CountryProvinceSelector = function (country_domid, province_domid, options) {
  this.countryEl = document.getElementById(country_domid);
  this.provinceEl = document.getElementById(province_domid);
  this.provinceContainer = document.getElementById(options['hideElement'] || province_domid);

  Shopify.addListener(this.countryEl, 'change', Shopify.bind(this.countryHandler, this));

  this.initCountry();
  this.initProvince();
};

Shopify.CountryProvinceSelector.prototype = {
  initCountry: function () {
    var value = this.countryEl.getAttribute('data-default');
    Shopify.setSelectorByValue(this.countryEl, value);
    this.countryHandler();
  },

  initProvince: function () {
    var value = this.provinceEl.getAttribute('data-default');
    if (value && this.provinceEl.options.length > 0) {
      Shopify.setSelectorByValue(this.provinceEl, value);
    }
  },

  countryHandler: function (e) {
    var opt = this.countryEl.options[this.countryEl.selectedIndex];
    var raw = opt.getAttribute('data-provinces');
    var provinces = JSON.parse(raw);

    this.clearOptions(this.provinceEl);
    if (provinces && provinces.length == 0) {
      this.provinceContainer.style.display = 'none';
    } else {
      for (var i = 0; i < provinces.length; i++) {
        var opt = document.createElement('option');
        opt.value = provinces[i][0];
        opt.innerHTML = provinces[i][1];
        this.provinceEl.appendChild(opt);
      }

      this.provinceContainer.style.display = '';
    }
  },

  clearOptions: function (selector) {
    while (selector.firstChild) {
      selector.removeChild(selector.firstChild);
    }
  },

  setOptions: function (selector, values) {
    for (var i = 0, count = values.length; i < values.length; i++) {
      var opt = document.createElement('option');
      opt.value = values[i];
      opt.innerHTML = values[i];
      selector.appendChild(opt);
    }
  },
};

class MenuDrawer extends HTMLElement {
  constructor() {
    super();

    this.mainDetailsToggle = this.querySelector('details');

    this.addEventListener('keyup', this.onKeyUp.bind(this));
    this.addEventListener('focusout', this.onFocusOut.bind(this));
    this.bindEvents();
  }

  bindEvents() {
    this.querySelectorAll('summary').forEach((summary) =>
      summary.addEventListener('click', this.onSummaryClick.bind(this))
    );
    this.querySelectorAll(
      'button:not(.localization-selector):not(.country-selector__close-button):not(.country-filter__reset-button)'
    ).forEach((button) => button.addEventListener('click', this.onCloseButtonClick.bind(this)));
  }

  onKeyUp(event) {
    if (event.code.toUpperCase() !== 'ESCAPE') return;

    const openDetailsElement = event.target.closest('details[open]');
    if (!openDetailsElement) return;

    openDetailsElement === this.mainDetailsToggle
      ? this.closeMenuDrawer(event, this.mainDetailsToggle.querySelector('summary'))
      : this.closeSubmenu(openDetailsElement);
  }

  onSummaryClick(event) {
    const summaryElement = event.currentTarget;
    const detailsElement = summaryElement.parentNode;
    const parentMenuElement = detailsElement.closest('.has-submenu');
    const isOpen = detailsElement.hasAttribute('open');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    function addTrapFocus() {
      trapFocus(summaryElement.nextElementSibling, detailsElement.querySelector('button'));
      summaryElement.nextElementSibling.removeEventListener('transitionend', addTrapFocus);
    }

    if (detailsElement === this.mainDetailsToggle) {
      if (isOpen) event.preventDefault();
      isOpen ? this.closeMenuDrawer(event, summaryElement) : this.openMenuDrawer(summaryElement);

      if (window.matchMedia('(max-width: 992px)')) {
        document.documentElement.style.setProperty('--viewport-height', `${window.innerHeight}px`);
      }
    } else {
      setTimeout(() => {
        detailsElement.classList.add('menu-opening');
        summaryElement.setAttribute('aria-expanded', true);
        
        !reducedMotion || reducedMotion.matches
          ? addTrapFocus()
          : summaryElement.nextElementSibling.addEventListener('transitionend', addTrapFocus);
      }, 100);
    }
  }

  openMenuDrawer(summaryElement) {
    setTimeout(() => {
      this.mainDetailsToggle.classList.add('menu-opening');
    });
    summaryElement.setAttribute('aria-expanded', true);
    trapFocus(this.mainDetailsToggle, summaryElement);
    document.body.classList.add(`overflow-hidden-${this.dataset.breakpoint}`);
  }

  closeMenuDrawer(event, elementToFocus = false) {
    if (event === undefined) return;

    this.mainDetailsToggle.classList.remove('menu-opening');
    this.mainDetailsToggle.querySelectorAll('details').forEach((details) => {
      details.removeAttribute('open');
      details.classList.remove('menu-opening');
    });
    document.body.classList.remove(`overflow-hidden-${this.dataset.breakpoint}`);
    removeTrapFocus(elementToFocus);
    this.closeAnimation(this.mainDetailsToggle);

    if (event instanceof KeyboardEvent) elementToFocus?.setAttribute('aria-expanded', false);
  }

  onFocusOut() {
    setTimeout(() => {
      if (this.mainDetailsToggle.hasAttribute('open') && !this.mainDetailsToggle.contains(document.activeElement))
        this.closeMenuDrawer();
    });
  }

  onCloseButtonClick(event) {
    const detailsElement = event.currentTarget.closest('details');
    this.closeSubmenu(detailsElement);
  }

  closeSubmenu(detailsElement) {
    detailsElement.classList.remove('menu-opening');
    detailsElement.querySelector('summary').setAttribute('aria-expanded', false);
    removeTrapFocus(detailsElement.querySelector('summary'));
    this.closeAnimation(detailsElement);
  }

  closeAnimation(detailsElement) {
    let animationStart;

    const handleAnimation = (time) => {
      if (animationStart === undefined) {
        animationStart = time;
      }

      const elapsedTime = time - animationStart;

      if (elapsedTime < 400) {
        window.requestAnimationFrame(handleAnimation);
      } else {
        detailsElement.removeAttribute('open');
        if (detailsElement.closest('details[open]')) {
          trapFocus(detailsElement.closest('details[open]'), detailsElement.querySelector('summary'));
        }
      }
    };

    window.requestAnimationFrame(handleAnimation);
  }
}

customElements.define('menu-drawer', MenuDrawer);

class HeaderDrawer extends MenuDrawer {
  constructor() {
    super();
  }

  openMenuDrawer(summaryElement) {
    this.header = this.header || document.querySelector('.section-header');
    this.borderOffset =
      this.borderOffset || this.closest('.header-wrapper').classList.contains('header-wrapper--border-bottom') ? 1 : 0;
    document.documentElement.style.setProperty(
      '--header-bottom-position',
      `${parseInt(this.header.getBoundingClientRect().bottom - this.borderOffset)}px`
    );
    this.header.classList.add('menu-open');

    setTimeout(() => {
      this.mainDetailsToggle.classList.add('menu-opening');
    });

    summaryElement.setAttribute('aria-expanded', true);
    window.addEventListener('resize', this.onResize);
    trapFocus(this.mainDetailsToggle, summaryElement);
    document.body.classList.add(`overflow-hidden-${this.dataset.breakpoint}`);
  }

  closeMenuDrawer(event, elementToFocus) {
    if (!elementToFocus) return;
    super.closeMenuDrawer(event, elementToFocus);
    this.header.classList.remove('menu-open');
    window.removeEventListener('resize', this.onResize);
  }

  onResize = () => {
    this.header &&
      document.documentElement.style.setProperty(
        '--header-bottom-position',
        `${parseInt(this.header.getBoundingClientRect().bottom - this.borderOffset)}px`
      );
    document.documentElement.style.setProperty('--viewport-height', `${window.innerHeight}px`);
  };
}

customElements.define('header-drawer', HeaderDrawer);

class ModalDialog extends HTMLElement {
  constructor() {
    super();
    this.querySelector('[id^="ModalClose-"]').addEventListener('click', this.hide.bind(this, false));
    this.addEventListener('keyup', (event) => {
      if (event.code.toUpperCase() === 'ESCAPE') this.hide();
    });
    if (this.classList.contains('media-modal')) {
      this.addEventListener('pointerup', (event) => {
        if (event.pointerType === 'mouse' && !event.target.closest('deferred-media, product-model')) this.hide();
      });
    } else {
      this.addEventListener('click', (event) => {
        if (event.target === this) this.hide();
      });
    }
  }

  connectedCallback() {
    if (this.moved) return;
    this.moved = true;
    document.body.appendChild(this);
  }

  show(opener) {
    this.openedBy = opener;
    const popup = this.querySelector('.template-popup');
    document.body.classList.add('overflow-hidden');
    this.setAttribute('open', '');
    if (popup) popup.loadContent();
    trapFocus(this, this.querySelector('[role="dialog"]'));
    window.pauseAllMedia();
  }

  hide() {
    document.body.classList.remove('overflow-hidden');
    document.body.dispatchEvent(new CustomEvent('modalClosed'));
    this.removeAttribute('open');
    removeTrapFocus(this.openedBy);
    window.pauseAllMedia();
  }
}
customElements.define('modal-dialog', ModalDialog);

class ModalOpener extends HTMLElement {
  constructor() {
    super();

    const button = this.querySelector('button');

    if (!button) return;
    button.addEventListener('click', () => {
      const modal = document.querySelector(this.getAttribute('data-modal'));
      if (modal) modal.show(button);
    });
  }
}
customElements.define('modal-opener', ModalOpener);

class DeferredMedia extends HTMLElement {
  constructor() {
    super();
    const poster = this.querySelector('[id^="Deferred-Poster-"]');
    if (!poster) return;
    poster.addEventListener('click', this.loadContent.bind(this));
  }

  loadContent(focus = true) {
    window.pauseAllMedia();
    if (!this.getAttribute('loaded')) {
      const content = document.createElement('div');
      content.appendChild(this.querySelector('template').content.firstElementChild.cloneNode(true));

      this.setAttribute('loaded', true);
      const deferredElement = this.appendChild(content.querySelector('video, model-viewer, iframe'));
      if (focus) deferredElement.focus();
      if (deferredElement.nodeName == 'VIDEO' && deferredElement.getAttribute('autoplay')) {
        // force autoplay for safari
        deferredElement.play();
      }
    }
  }
}

customElements.define('deferred-media', DeferredMedia);

class SliderComponent extends HTMLElement {
  constructor() {
    super();
    this.slider = this.querySelector('[id^="Slider-"]');
    this.sliderItems = this.querySelectorAll('[id^="Slide-"]');
    this.enableSliderLooping = false;
    this.currentPageElement = this.querySelector('.slider-counter--current');
    this.pageTotalElement = this.querySelector('.slider-counter--total');
    this.prevButton = this.querySelector('button[name="previous"]');
    this.nextButton = this.querySelector('button[name="next"]');

    this.oriantation = window.matchMedia('(min-width: 768px)').matches ? this.dataset.oriantation ? this.dataset.oriantation : 'horizontal' :  'horizontal';
    if(this.oriantation == 'vertical'){
      this.offsetPosition = 'offsetTop';
      this.scrollPosition = 'scrollTop';
      this.clientPosition = 'clientHeight';
    }else{
      this.offsetPosition = 'offsetLeft';
      this.scrollPosition = 'scrollLeft';
      this.clientPosition = 'clientWidth';
    }

    if (!this.slider || !this.nextButton) return;

    this.initPages();
    const resizeObserver = new ResizeObserver((entries) => this.initPages());
    resizeObserver.observe(this.slider);

    this.slider.addEventListener('scroll', this.update.bind(this));
    this.prevButton.addEventListener('click', this.onButtonClick.bind(this));
    this.nextButton.addEventListener('click', this.onButtonClick.bind(this));
    

  }

  initPages() {
    this.sliderItemsToShow = Array.from(this.sliderItems).filter((element) => element[this.clientPosition] > 0);
    if (this.sliderItemsToShow.length < 2) return;
    this.sliderItemOffset = this.sliderItemsToShow[1][this.offsetPosition] - this.sliderItemsToShow[0][this.offsetPosition];
    this.slidesPerPage = Math.floor(
      (this.slider.clientHeight - this.sliderItemsToShow[0][this.offsetPosition]) / this.sliderItemOffset
    );
    this.totalPages = this.sliderItemsToShow.length - this.slidesPerPage + 1;
    this.update();
  }

  resetPages() {
    this.sliderItems = this.querySelectorAll('[id^="Slide-"]');
    this.initPages();
  }

  update() {
    // Temporarily prevents unneeded updates resulting from variant changes
    // This should be refactored as part of https://github.com/Shopify/dawn/issues/2057
    if (!this.slider || !this.nextButton) return;

    const previousPage = this.currentPage;
    const sliderPosition =  this.slider[this.scrollPosition];
    this.currentPage = Math.round(sliderPosition / this.sliderItemOffset) + 1;

    if (this.currentPageElement && this.pageTotalElement) {
      this.currentPageElement.textContent = this.currentPage;
      this.pageTotalElement.textContent = this.totalPages;
    }
    if (this.currentPage != previousPage) {
      this.dispatchEvent(
        new CustomEvent('slideChanged', {
          detail: {
            currentPage: this.currentPage,
            currentElement: this.sliderItemsToShow[this.currentPage - 1],
          },
        })
      );
    }

    if (this.enableSliderLooping) return;

    if (this.isSlideVisible(this.sliderItemsToShow[0]) && sliderPosition === 0) {
      this.prevButton.setAttribute('disabled', 'disabled');
    } else {
      this.prevButton.removeAttribute('disabled');
    }

    if (this.isSlideVisible(this.sliderItemsToShow[this.sliderItemsToShow.length - 1])) {
      this.nextButton.setAttribute('disabled', 'disabled');
    } else {
      this.nextButton.removeAttribute('disabled');
    }
  }

  isSlideVisible(element, offset = 0) {
    const lastVisibleSlide = this.slider[this.clientPosition] + this.slider[this.scrollPosition] - offset;
    return element[this.offsetPosition] + element[this.clientPosition] <= lastVisibleSlide && element[this.offsetPosition] >= this.slider[this.scrollPosition];
  }

  onButtonClick(event) {
    event.preventDefault();
    const step = event.currentTarget.dataset.step || 1;
    const sliderPosition =  this.slider[this.scrollPosition];
    this.slideScrollPosition =
      event.currentTarget.name === 'next'
        ? sliderPosition + step * this.sliderItemOffset
        : sliderPosition - step * this.sliderItemOffset;
    this.setSlidePosition(this.slideScrollPosition);
  }

  setSlidePosition(position) {
    const param = this.oriantation == 'vertical' ? {top:position} : {left:position};
    this.slider.scrollTo(param);
  }
}

customElements.define('slider-component', SliderComponent);

class SlideshowComponent extends SliderComponent {
  constructor() {
    super();
    this.sliderControlWrapper = this.querySelector('.slider-buttons');
    this.enableSliderLooping = true;

    if (!this.sliderControlWrapper) return;

    this.sliderFirstItemNode = this.slider.querySelector('.slideshow__slide');
    if (this.sliderItemsToShow.length > 0) this.currentPage = 1;

    this.announcementBarSlider = this.querySelector('.announcement-bar-slider');
    // Value below should match --duration-announcement-bar CSS value
    this.announcerBarAnimationDelay = this.announcementBarSlider ? 250 : 0;

    this.sliderControlLinksArray = Array.from(this.sliderControlWrapper.querySelectorAll('.slider-counter__link'));
    this.sliderControlLinksArray.forEach((link) => link.addEventListener('click', this.linkToSlide.bind(this)));
    this.slider.addEventListener('scroll', this.setSlideVisibility.bind(this));
    this.setSlideVisibility();

    if (this.announcementBarSlider) {
      this.announcementBarArrowButtonWasClicked = false;

      this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.reducedMotion.addEventListener('change', () => {
        if (this.slider.getAttribute('data-autoplay') === 'true') this.setAutoPlay();
      });

      [this.prevButton, this.nextButton].forEach((button) => {
        button.addEventListener(
          'click',
          () => {
            this.announcementBarArrowButtonWasClicked = true;
          },
          { once: true }
        );
      });
    }

    if (this.slider.getAttribute('data-autoplay') === 'true') this.setAutoPlay();
  }

  setAutoPlay() {
    this.autoplaySpeed = this.slider.dataset.speed * 1000;
    this.addEventListener('mouseover', this.focusInHandling.bind(this));
    this.addEventListener('mouseleave', this.focusOutHandling.bind(this));
    this.addEventListener('focusin', this.focusInHandling.bind(this));
    this.addEventListener('focusout', this.focusOutHandling.bind(this));

    if (this.querySelector('.slideshow__autoplay')) {
      this.sliderAutoplayButton = this.querySelector('.slideshow__autoplay');
      this.sliderAutoplayButton.addEventListener('click', this.autoPlayToggle.bind(this));
      this.autoplayButtonIsSetToPlay = true;
      this.play();
    } else {
      this.reducedMotion.matches || this.announcementBarArrowButtonWasClicked ? this.pause() : this.play();
    }
  }

  onButtonClick(event) {
    super.onButtonClick(event);
    this.wasClicked = true;

    const isFirstSlide = this.currentPage === 1;
    const isLastSlide = this.currentPage === this.sliderItemsToShow.length;

    if (!isFirstSlide && !isLastSlide) {
      this.applyAnimationToAnnouncementBar(event.currentTarget.name);
      return;
    }

    if (isFirstSlide && event.currentTarget.name === 'previous') {
      this.slideScrollPosition =
        this.slider.scrollLeft + this.sliderFirstItemNode.clientWidth * this.sliderItemsToShow.length;
    } else if (isLastSlide && event.currentTarget.name === 'next') {
      this.slideScrollPosition = 0;
    }

    this.setSlidePosition(this.slideScrollPosition);

    this.applyAnimationToAnnouncementBar(event.currentTarget.name);
  }

  setSlidePosition(position) {
    if (this.setPositionTimeout) clearTimeout(this.setPositionTimeout);
    this.setPositionTimeout = setTimeout(() => {
      this.slider.scrollTo({
        left: position,
      });
    }, this.announcerBarAnimationDelay);
  }

  update() {
    super.update();
    this.sliderControlButtons = this.querySelectorAll('.slider-counter__link');
    this.prevButton.removeAttribute('disabled');

    if (!this.sliderControlButtons.length) return;

    this.sliderControlButtons.forEach((link) => {
      link.classList.remove('slider-counter__link--active');
      link.removeAttribute('aria-current');
    });
    this.sliderControlButtons[this.currentPage - 1].classList.add('slider-counter__link--active');
    this.sliderControlButtons[this.currentPage - 1].setAttribute('aria-current', true);
  }

  autoPlayToggle() {
    this.togglePlayButtonState(this.autoplayButtonIsSetToPlay);
    this.autoplayButtonIsSetToPlay ? this.pause() : this.play();
    this.autoplayButtonIsSetToPlay = !this.autoplayButtonIsSetToPlay;
  }

  focusOutHandling(event) {
    if (this.sliderAutoplayButton) {
      const focusedOnAutoplayButton =
        event.target === this.sliderAutoplayButton || this.sliderAutoplayButton.contains(event.target);
      if (!this.autoplayButtonIsSetToPlay || focusedOnAutoplayButton) return;
      this.play();
    } else if (!this.reducedMotion.matches && !this.announcementBarArrowButtonWasClicked) {
      this.play();
    }
  }

  focusInHandling(event) {
    if (this.sliderAutoplayButton) {
      const focusedOnAutoplayButton =
        event.target === this.sliderAutoplayButton || this.sliderAutoplayButton.contains(event.target);
      if (focusedOnAutoplayButton && this.autoplayButtonIsSetToPlay) {
        this.play();
      } else if (this.autoplayButtonIsSetToPlay) {
        this.pause();
      }
    } else if (this.announcementBarSlider.contains(event.target)) {
      this.pause();
    }
  }

  play() {
    this.slider.setAttribute('aria-live', 'off');
    clearInterval(this.autoplay);
    this.autoplay = setInterval(this.autoRotateSlides.bind(this), this.autoplaySpeed);
  }

  pause() {
    this.slider.setAttribute('aria-live', 'polite');
    clearInterval(this.autoplay);
  }

  togglePlayButtonState(pauseAutoplay) {
    if (pauseAutoplay) {
      this.sliderAutoplayButton.classList.add('slideshow__autoplay--paused');
      this.sliderAutoplayButton.setAttribute('aria-label', window.accessibilityStrings.playSlideshow);
    } else {
      this.sliderAutoplayButton.classList.remove('slideshow__autoplay--paused');
      this.sliderAutoplayButton.setAttribute('aria-label', window.accessibilityStrings.pauseSlideshow);
    }
  }

  autoRotateSlides() {
    const slideScrollPosition =
      this.currentPage === this.sliderItems.length ? 0 : this.slider.scrollLeft + this.sliderItemOffset;

    this.setSlidePosition(slideScrollPosition);
    this.applyAnimationToAnnouncementBar();
  }

  setSlideVisibility(event) {
    this.sliderItemsToShow.forEach((item, index) => {
      const linkElements = item.querySelectorAll('a');
      if (index === this.currentPage - 1) {
        if (linkElements.length)
          linkElements.forEach((button) => {
            button.removeAttribute('tabindex');
          });
        item.setAttribute('aria-hidden', 'false');
        item.removeAttribute('tabindex');
      } else {
        if (linkElements.length)
          linkElements.forEach((button) => {
            button.setAttribute('tabindex', '-1');
          });
        item.setAttribute('aria-hidden', 'true');
        item.setAttribute('tabindex', '-1');
      }
    });
    this.wasClicked = false;
  }

  applyAnimationToAnnouncementBar(button = 'next') {
    if (!this.announcementBarSlider) return;

    const itemsCount = this.sliderItems.length;
    const increment = button === 'next' ? 1 : -1;

    const currentIndex = this.currentPage - 1;
    let nextIndex = (currentIndex + increment) % itemsCount;
    nextIndex = nextIndex === -1 ? itemsCount - 1 : nextIndex;

    const nextSlide = this.sliderItems[nextIndex];
    const currentSlide = this.sliderItems[currentIndex];

    const animationClassIn = 'announcement-bar-slider--fade-in';
    const animationClassOut = 'announcement-bar-slider--fade-out';

    const isFirstSlide = currentIndex === 0;
    const isLastSlide = currentIndex === itemsCount - 1;

    const shouldMoveNext = (button === 'next' && !isLastSlide) || (button === 'previous' && isFirstSlide);
    const direction = shouldMoveNext ? 'next' : 'previous';

    currentSlide.classList.add(`${animationClassOut}-${direction}`);
    nextSlide.classList.add(`${animationClassIn}-${direction}`);

    setTimeout(() => {
      currentSlide.classList.remove(`${animationClassOut}-${direction}`);
      nextSlide.classList.remove(`${animationClassIn}-${direction}`);
    }, this.announcerBarAnimationDelay * 2);
  }

  linkToSlide(event) {
    event.preventDefault();
    const slideScrollPosition =
      this.slider.scrollLeft +
      this.sliderFirstItemNode.clientWidth *
        (this.sliderControlLinksArray.indexOf(event.currentTarget) + 1 - this.currentPage);
    this.slider.scrollTo({
      left: slideScrollPosition,
    });
  }
}

customElements.define('slideshow-component', SlideshowComponent);

class VariantSelects extends HTMLElement {
  constructor() {
    super();
    this.addEventListener('change', this.onVariantChange);
  }

  onVariantChange(event) {
    this.updateOptions();
    this.updateMasterId();
    this.updateSelectedSwatchValue(event);
    this.toggleAddButton(true, '', false);
    this.updatePickupAvailability();
    this.removeErrorMessage();
    this.updateVariantStatuses();
    this.updateVariantValue();

    if (!this.currentVariant) {
      this.toggleAddButton(true, '', true);
      this.setUnavailable();
    } else {
      if (this.dataset.layout == 'card') {
        this.updateMedia();
      }
      this.updateURL();
      this.updateVariantInput();
      this.renderProductInfo();
      this.updateShareUrl();
      this.updateCardURL();
    }
  }

  updateVariantValue() {
    if (this.dataset.layout == 'button') {
      event.target.closest('fieldset').querySelector('div span').innerHTML = event.target.value
    }
  }

  updateOptions() {
    this.options = Array.from(this.querySelectorAll('select, fieldset'), (element) => {
      if (element.tagName === 'SELECT') {
        return element.value;
      }
      if (element.tagName === 'FIELDSET') {
        return Array.from(element.querySelectorAll('input')).find((radio) => radio.checked)?.value;
      }
    });
  }

  updateMasterId() {
    this.currentVariant = this.getVariantData().find((variant) => {
      return !variant.options
        .map((option, index) => {
          return this.options[index] === option;
        })
        .includes(false);
    });
  }

  updateSelectedSwatchValue({ target }) {
    const { name, value, tagName } = target;

    if (tagName === 'SELECT' && target.selectedOptions.length) {
      const swatchValue = target.selectedOptions[0].dataset.optionSwatchValue;
      const selectedDropdownSwatchValue = this.querySelector(`[data-selected-dropdown-swatch="${name}"] > .swatch`);
      if (!selectedDropdownSwatchValue) return;
      if (swatchValue) {
        selectedDropdownSwatchValue.style.setProperty('--swatch--background', swatchValue);
        selectedDropdownSwatchValue.classList.remove('swatch--unavailable');
      } else {
        selectedDropdownSwatchValue.style.setProperty('--swatch--background', 'unset');
        selectedDropdownSwatchValue.classList.add('swatch--unavailable');
      }

      selectedDropdownSwatchValue.style.setProperty(
        '--swatch-focal-point',
        target.selectedOptions[0].dataset.optionSwatchFocalPoint || 'unset'
      );
    } else if (tagName === 'INPUT' && target.type === 'radio') {
      const selectedSwatchValue = this.querySelector(`[data-selected-swatch-value="${name}"]`);
      if (selectedSwatchValue) selectedSwatchValue.innerHTML = value;
    }
  }

  updateMedia(html) {
    if (!this.currentVariant) return;
    if (!this.currentVariant.featured_media) return;

    if (this.dataset.layout == 'card') {
      const card = this.closest('.card');
      const newMedia = card.querySelector(
          `[data-media-id="${this.dataset.section}-${this.dataset.product}-${this.currentVariant.featured_media.id}"]`
      );
      if (!newMedia) return;
      const modalContent = card.querySelector('.card__media');
      const newMediaModal = modalContent.querySelector( `[data-media-id="${this.currentVariant.featured_media.id}"]`);
      const parent = newMedia.parentElement;
      if (parent.firstChild == newMedia) return;
      parent.prepend(newMedia);


    } else {


      const mediaGallerySource = document.querySelector(`[id^="MediaGallery-${this.dataset.section}"] ul`);
      const mediaGalleryDestination = html.querySelector(`[id^="MediaGallery-${this.dataset.section}"] ul`);

      const refreshSourceData = () => {
        const mediaGallerySourceItems = Array.from(mediaGallerySource.querySelectorAll('li[data-media-id]'));
        const sourceSet = new Set(mediaGallerySourceItems.map((item) => item.dataset.mediaId));
        const sourceMap = new Map(mediaGallerySourceItems.map((item, index) => [item.dataset.mediaId, { item, index }]));
        return [mediaGallerySourceItems, sourceSet, sourceMap];
      };

      if (mediaGallerySource && mediaGalleryDestination) {
        let [mediaGallerySourceItems, sourceSet, sourceMap] = refreshSourceData();
        const mediaGalleryDestinationItems = Array.from(mediaGalleryDestination.querySelectorAll('li[data-media-id]'));
        const destinationSet = new Set(mediaGalleryDestinationItems.map(({ dataset }) => dataset.mediaId));
        let shouldRefresh = false;

        // add items from new data not present in DOM
        for (let i = mediaGalleryDestinationItems.length - 1; i >= 0; i--) {
          if (!sourceSet.has(mediaGalleryDestinationItems[i].dataset.mediaId)) {
            mediaGallerySource.prepend(mediaGalleryDestinationItems[i]);
            shouldRefresh = true;
          }
        }

        // remove items from DOM not present in new data
        for (let i = 0; i < mediaGallerySourceItems.length; i++) {
          if (!destinationSet.has(mediaGallerySourceItems[i].dataset.mediaId)) {
            mediaGallerySourceItems[i].remove();
            shouldRefresh = true;
          }
        }

        // refresh
        if (shouldRefresh) [mediaGallerySourceItems, sourceSet, sourceMap] = refreshSourceData();

        // if media galleries don't match, sort to match new data order
        mediaGalleryDestinationItems.forEach((destinationItem, destinationIndex) => {
          const sourceData = sourceMap.get(destinationItem.dataset.mediaId);

          if (sourceData && sourceData.index !== destinationIndex) {
            mediaGallerySource.insertBefore(
              sourceData.item,
              mediaGallerySource.querySelector(`li:nth-of-type(${destinationIndex + 1})`)
            );

            // refresh source now that it has been modified
            [mediaGallerySourceItems, sourceSet, sourceMap] = refreshSourceData();
          }
        });
      }

      if (this.currentVariant.featured_media) {
      document
        .querySelector(`[id^="MediaGallery-${this.dataset.section}"]`)
        ?.setActiveMedia?.(`${this.dataset.section}-${this.currentVariant.featured_media.id}`);
      }

      // update media modal
      const modalContent = document.querySelector(`#ProductModal-${this.dataset.section} .product-media-modal__content`);
      const newModalContent = html.querySelector(`product-modal`);
      if (modalContent && newModalContent) modalContent.innerHTML = newModalContent.innerHTML;
    }
  }

  updateCardURL() {
    if (this.dataset.layout == 'card') {
      const card = this.closest('.card');
      const modalContent = card.querySelector('.card__media');
      if (!modalContent) return;
      const productAnchor = modalContent.querySelector('a');
      if (!productAnchor) return;
      const productTitle = card.querySelector('.card__heading');
      const productTitleAnchor = productTitle.querySelector('a');
      const productQuickview = card.querySelector('.js-wbquickview-link');
      let productURL = this.updateURLParameter(this.dataset.url, 'variant', this.currentVariant.id);
      productAnchor.setAttribute('href', productURL);
      productTitleAnchor.setAttribute('href', productURL);
      if (productQuickview) {
        productQuickview.setAttribute('variant-id', this.currentVariant.id);
      }
      
      
    }
  }

  updateURLParameter(url, param, paramVal){
    var newAdditionalURL = "";
    var tempArray = url.split("?");
    var baseURL = tempArray[0];
    var additionalURL = tempArray[1];
    var temp = "";
    if (additionalURL) {
      tempArray = additionalURL.split("&");
      for (var i=0; i<tempArray.length; i++){
        if(tempArray[i].split('=')[0] != param){
          newAdditionalURL += temp + tempArray[i];
          temp = "&";
        }
      }
    }
    var rows_txt = temp + "" + param + "=" + paramVal;
    return baseURL + "?" + newAdditionalURL + rows_txt;
  }


  updateURL() {
    if (!this.currentVariant || this.dataset.updateUrl === 'false') return;
    window.history.replaceState({}, '', `${this.dataset.url}?variant=${this.currentVariant.id}`);
  }

  updateShareUrl() {
    const shareButton = document.getElementById(`Share-${this.dataset.section}`);
    if (!shareButton || !shareButton.updateUrl) return;
    shareButton.updateUrl(`${window.shopUrl}${this.dataset.url}?variant=${this.currentVariant.id}`);
  }

  updateVariantInput() {

    // Variant in Product Card
    if (this.dataset.layout == 'card') {
      const card = this.closest('.card');
      const productForms = card.querySelectorAll(`#ProductInfo-${this.dataset.section}-${this.dataset.product}`);
      productForms.forEach((productForm) => {
        const input = productForm.querySelectorAll('input[name="id"]');
        Array.from(input).forEach((element,index) =>
        {
          element.value = this.currentVariant.id;
        });
        const select = productForm.querySelectorAll('select[name="id"]');
        Array.from(select).forEach((element,index) =>
        {
          element.value = this.currentVariant.id;
        });

        const fieldsets = Array.from(this.querySelectorAll('fieldset'));
        fieldsets.forEach(function(option) {
          Array.from(option.querySelectorAll('label')).find((element) => element.classList.remove('active'));
        });
        const optionData = this.closest('.grid__item').querySelectorAll('select option');
        const regularPrice = this.closest('.grid__item').querySelector('.price .price__container .price__regular .price-item--regular');
        const saleRegularPrice = this.closest('.grid__item').querySelector('.price .price__container .price__sale .price-item--sale');
        const salePrice = this.closest('.grid__item').querySelector('.price .price__container .price__sale .price-item--regular');
        const wbunitPrice = this.closest('.grid__item').querySelector('.price .price__container .unit-price .cardunitp');
        const wbunitValue = this.closest('.grid__item').querySelector('.price .price__container .unit-price .cardunitv');
          
        const wbPercentBadge = this.closest('.grid__item').querySelector('.card__badge .percent__badge-sale');
        const wbAmountBadge = this.closest('.grid__item').querySelector('.card__badge .amount__badge-sale');
        
        optionData.forEach((data) => {
          if(data.value == this.currentVariant.id) {
            if(data.dataset.cprice != '' &&  data.dataset.price != data.dataset.cprice) {
              saleRegularPrice.innerHTML = data.dataset.price;
              salePrice.innerHTML = data.dataset.cprice;
              if(data.dataset.damount != '') {
                wbAmountBadge.innerHTML = data.dataset.damount;
                wbAmountBadge.classList.remove('hidden');
              }
              if(data.dataset.percent != '') {
                wbPercentBadge.innerHTML = data.dataset.percent;
                wbPercentBadge.classList.remove('hidden');
              }
              this.closest('.grid__item').querySelector('.price').classList.add("price--on-sale");
            }
            else {
              regularPrice.innerHTML = data.dataset.price;
              if(wbPercentBadge){
                wbPercentBadge.classList.add('hidden');
              }
              if(wbAmountBadge){
                wbAmountBadge.classList.add('hidden');
              }
              this.closest('.grid__item').querySelector('.price').classList.remove("price--on-sale");
            }
            if(data.dataset.unitprice) {
              wbunitPrice.innerHTML = data.dataset.unitprice;
              this.closest('.grid__item').querySelector('.price').classList.add("price--on-sale");
            }
            if(data.dataset.unitvalue) {
              wbunitValue.innerHTML = data.dataset.unitvalue;
              this.closest('.grid__item').querySelector('.price').classList.add("price--on-sale");
            }
          }
        });
      });
      return;
    }


    const productForms = document.querySelectorAll(
      `#product-form-${this.dataset.section}, #product-form-installment-${this.dataset.section}`
    );
    productForms.forEach((productForm) => {
      const input = productForm.querySelector('input[name="id"]');
      input.value = this.currentVariant.id;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }

  updateVariantStatuses() {
    const selectedOptionOneVariants = this.variantData.filter(
      (variant) => this.querySelector(':checked').value === variant.option1
    );
    const inputWrappers = [...this.querySelectorAll('.product-form__input')];
    inputWrappers.forEach((option, index) => {
      if (index === 0) return;
      const optionInputs = [...option.querySelectorAll('input[type="radio"], option')];
      const previousOptionSelected = inputWrappers[index - 1].querySelector(':checked').value;
      const availableOptionInputsValue = selectedOptionOneVariants
        .filter((variant) => variant.available && variant[`option${index}`] === previousOptionSelected)
        .map((variantOption) => variantOption[`option${index + 1}`]);
      this.setInputAvailability(optionInputs, availableOptionInputsValue);
    });
  }

  setInputAvailability(listOfOptions, listOfAvailableOptions) {
    
    listOfOptions.forEach((input) => {
      if (listOfAvailableOptions.includes(input.getAttribute('value'))) {
        input.innerText = input.getAttribute('value');
        input.classList.remove('disabled');
      } else {
        input.classList.add('disabled');
        input.innerText = window.variantStrings.unavailable_with_option.replace('[value]', input.getAttribute('value'));
      }
    });
  }

  updatePickupAvailability() {
    const pickUpAvailability = document.querySelector('pickup-availability');
    if (!pickUpAvailability) return;

    if (this.currentVariant && this.currentVariant.available) {
      pickUpAvailability.fetchAvailability(this.currentVariant.id);
    } else {
      pickUpAvailability.removeAttribute('available');
      pickUpAvailability.innerHTML = '';
    }
  }

  removeErrorMessage() {
    const section = this.closest('section');
    if (!section) return;

    const productForm = section.querySelector('product-form');
    if (productForm) productForm.handleErrorMessage();
  }

  renderProductInfo() {
    const requestedVariantId = this.currentVariant.id;
    let sectionId = this.dataset.originalSection ? this.dataset.originalSection : this.dataset.section;

    if (this.dataset.layout == 'card') {
      fetch(`${this.dataset.url}?variant=${requestedVariantId}&section_id=${this.dataset.originalSection ? this.dataset.originalSection : this.dataset.section}`)
        .then((response) => response.text())
        .then((responseText) => {
          if (this.currentVariant.id !== requestedVariantId) return;
          this.toggleAddButton(!this.currentVariant.available, window.variantStrings.soldOut);
          const html = new DOMParser().parseFromString(responseText, 'text/html');
          sectionId = `${sectionId}-${this.dataset.product}`;
          publish(PUB_SUB_EVENTS.variantChange, {data: {
              sectionId,
              html,
              variant: this.currentVariant
            }});

        })
      // this.toggleAddButton(!this.currentVariant.available, window.variantStrings.soldOut);
      return;
    }

    fetch(`${this.dataset.url}?variant=${requestedVariantId}&section_id=${this.dataset.originalSection ? this.dataset.originalSection : this.dataset.section}`)
        .then((response) => response.text())
        .then((responseText) => {
          // prevent unnecessary ui changes from abandoned selections
          if (this.currentVariant.id !== requestedVariantId) return;

          const html = new DOMParser().parseFromString(responseText, 'text/html')
          const destinations = document.querySelectorAll(`#price-${this.dataset.section}`);
          const sources = html.querySelectorAll(`#price-${this.dataset.originalSection ? this.dataset.originalSection : this.dataset.section}`);
          const skuSource = html.getElementById(`Sku-${this.dataset.originalSection ? this.dataset.originalSection : this.dataset.section}`);
          const skuDestination = document.getElementById(`Sku-${this.dataset.section}`);
          const inventorySource = html.getElementById(`Inventory-${this.dataset.originalSection ? this.dataset.originalSection : this.dataset.section}`);
          const inventoryDestination = document.getElementById(`Inventory-${this.dataset.section}`);
          const volumePricingSource = html.getElementById(
            `Volume-${this.dataset.originalSection ? this.dataset.originalSection : this.dataset.section}`
          );

          
          if (this.dataset.layout != 'card') {
            this.updateMedia(html);
          }
          const pricePerItemDestination = document.getElementById(`Price-Per-Item-${this.dataset.section}`);
          const pricePerItemSource = html.getElementById(`Price-Per-Item-${this.dataset.originalSection ? this.dataset.originalSection : this.dataset.section}`);

          const volumePricingDestination = document.getElementById(`Volume-${this.dataset.section}`);
          const qtyRules = document.getElementById(`Quantity-Rules-${this.dataset.section}`);
          const volumeNote = document.getElementById(`Volume-Note-${this.dataset.section}`);

          if (volumeNote) volumeNote.classList.remove('hidden');
          if (volumePricingDestination) volumePricingDestination.classList.remove('hidden');
          if (qtyRules) qtyRules.classList.remove('hidden');

          if (sources.length == destinations.length && sources.length != 0){
            let idx = 0;
            for(let source of sources){
              destinations[idx].innerHTML = source.innerHTML;
              idx++;
            }
          }
          if (inventorySource && inventoryDestination) inventoryDestination.innerHTML = inventorySource.innerHTML;
          if (skuSource && skuDestination) {
            skuDestination.innerHTML = skuSource.innerHTML;
            skuDestination.classList.toggle('visibility-hidden', skuSource.classList.contains('visibility-hidden'));
          }

          if (volumePricingSource && volumePricingDestination) {
            volumePricingDestination.innerHTML = volumePricingSource.innerHTML;
          }

          if (pricePerItemSource && pricePerItemDestination) {
            pricePerItemDestination.innerHTML = pricePerItemSource.innerHTML;
            pricePerItemDestination.classList.toggle('visibility-hidden', pricePerItemSource.classList.contains('visibility-hidden'));
          }

          const price = document.getElementById(`price-${this.dataset.section}`);

          if (price) price.classList.remove('hidden');

          if (inventoryDestination) inventoryDestination.classList.toggle('visibility-hidden', inventorySource.innerText === '');

          const addButtonUpdated = html.getElementById(`ProductSubmitButton-${sectionId}`);
          this.toggleAddButton(addButtonUpdated ? addButtonUpdated.hasAttribute('disabled') : true, window.variantStrings.soldOut);

          publish(PUB_SUB_EVENTS.variantChange, {data: {
              sectionId,
              html,
              variant: this.currentVariant
            }});
        });
  }

  toggleAddButton(disable = true, text, modifyClass = true) {
    // Variant in Product Card
    var selector = `product-form-${this.dataset.section}`;
    if (this.dataset.layout == 'card') {
      selector = `product-form-${this.dataset.section}-${this.dataset.product}`;
    }
    const productForm = document.getElementById(selector);

    if (!productForm) return;
    const addButton = productForm.querySelector('[name="add"]');
    const addButtonText = productForm.querySelector('[name="add"] > span');
    if (!addButton) return;

    if (disable) {
      addButton.setAttribute('disabled', 'disabled');
      if (text) addButtonText.textContent = text;
    } else {
      addButton.removeAttribute('disabled');
      addButtonText.textContent = window.variantStrings.addToCart;
    }

    if (!modifyClass) return;
  }

  setUnavailable() {

    // Variant in Product Card
    var selector = `product-form-${this.dataset.section}`;
    var priceSelector = `price-${this.dataset.section}`;
    var button = document.getElementById(`product-form-${this.dataset.section}`);
    if (this.dataset.layout == 'card') {
      selector = `product-form-${this.dataset.section}-${this.dataset.product}`;
      priceSelector = `price-${this.dataset.section}-${this.dataset.product}`;
      button = document.getElementById(`product-form-${this.dataset.section}-${this.dataset.product}`);
    }

    const addButton = button.querySelector('[name="add"]');
    const addButtonText = button.querySelector('[name="add"] > span');
    const price = document.getElementById(`price-${this.dataset.section}`);
    const inventory = document.getElementById(`Inventory-${this.dataset.section}`);
    const sku = document.getElementById(`Sku-${this.dataset.section}`);
    const pricePerItem = document.getElementById(`Price-Per-Item-${this.dataset.section}`);
    const volumeNote = document.getElementById(`Volume-Note-${this.dataset.section}`);
    const volumeTable = document.getElementById(`Volume-${this.dataset.section}`);
    const qtyRules = document.getElementById(`Quantity-Rules-${this.dataset.section}`);

    if (!addButton) return;
    addButtonText.textContent = window.variantStrings.unavailable;
    // if (price) price.classList.add('hidden');
    if (inventory) inventory.classList.add('hidden');
    if (sku) sku.classList.add('hidden');
    if (pricePerItem) pricePerItem.classList.add('hidden');
    if (volumeNote) volumeNote.classList.add('hidden');
    if (volumeTable) volumeTable.classList.add('hidden');
    if (qtyRules) qtyRules.classList.add('hidden');
  }

  getVariantData() {
    this.variantData = this.variantData || JSON.parse(this.querySelector('[type="application/json"]').textContent);
    return this.variantData;
  }
}

customElements.define('variant-selects', VariantSelects);

class VariantRadios extends VariantSelects {
  constructor() {
    super();
  }

  setInputAvailability(listOfOptions, listOfAvailableOptions) {
    listOfOptions.forEach((input) => {
      if (listOfAvailableOptions.includes(input.getAttribute('value'))) {
        input.classList.remove('disabled');
      } else {
        input.classList.add('disabled');
      }
    });
  }

  updateOptions() {
    const fieldsets = Array.from(this.querySelectorAll('fieldset'));
    this.options = fieldsets.map((fieldset) => {
      return Array.from(fieldset.querySelectorAll('input')).find((radio) => radio.checked).value;
    });
  }
}

customElements.define('variant-radios', VariantRadios);

class ProductRecommendations extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    const handleIntersection = (entries, observer) => {
      if (!entries[0].isIntersecting) return;
      observer.unobserve(this);

      fetch(this.dataset.url)
        .then((response) => response.text())
        .then((text) => {
          const html = document.createElement('div');
          html.innerHTML = text;
          const recommendations = html.querySelector('product-recommendations');

          if (recommendations && recommendations.innerHTML.trim().length) {
            this.innerHTML = recommendations.innerHTML;
          }
 
          if (!this.querySelector('slider-component') && this.classList.contains('complementary-products')) {
            this.remove();
          }

          if (html.querySelector('.grid__item')) {
            this.classList.add('product-recommendations--loaded');
          }
        })
        .catch((e) => {
          console.error(e);
        });
    };

    new IntersectionObserver(handleIntersection.bind(this), { rootMargin: '0px 0px 400px 0px' }).observe(this);
  }
}

customElements.define('product-recommendations', ProductRecommendations);

class AccountIcon extends HTMLElement {
  constructor() {
    super();

    this.icon = this.querySelector('.icon');
  }

  connectedCallback() {
    document.addEventListener('storefront:signincompleted', this.handleStorefrontSignInCompleted.bind(this));
  }

  handleStorefrontSignInCompleted(event) {
    if (event?.detail?.avatar) {
      this.icon?.replaceWith(event.detail.avatar.cloneNode());
    }
  }
}

customElements.define('account-icon', AccountIcon);

// Variant hover
class ColorSwatch extends VariantSelects {
  constructor() { 
    super();
    const fieldsets = Array.from(this.querySelectorAll('fieldset label'));
    this.querySelectorAll('fieldset label').forEach((ele)=>{
      ele.addEventListener('mouseenter', this.onVariantChangeHover.bind(this));
      ele.addEventListener('click', this.onLabelClick.bind(this));
    }) 
  }
  onLabelClick(event){
    if(event.target.dataset.href){
      window.location.href = event.target.dataset.href;
    }
  }
  setInputAvailability(listOfOptions, listOfAvailableOptions) {
    listOfOptions.forEach(input => {
      if (listOfAvailableOptions.includes(input.getAttribute('value'))) {
        input.classList.remove('disabled');
      } else {
        input.classList.add('disabled');
      }
    });
  }
  updateOptions(ele) {
    if(ele.attributes.for && this.querySelector('#'+ele.attributes.for.value)){
      this.querySelector('#'+ele.attributes.for.value).checked = true;
    }
    const fieldsets = Array.from(this.querySelectorAll('fieldset'));
    this.options = fieldsets.map((fieldset) => {
      return Array.from(fieldset.querySelectorAll('input')).find((radio) => radio.checked).value;
    });
  }
  updatelabelDataset(ele){
    let href = ele.dataset.href
    if(href.indexOf('?variant=') > -1){
      href = (href.substring(0, href.indexOf('?variant=')+9) + this.currentVariant.id)
    }else{
      href += ("?variant="+ this.currentVariant.id)
    }
    ele.dataset.href = href; 
  }
  onVariantChangeHover(event){
    this.updateOptions(event.target);
    this.updateMasterId();
    this.updatelabelDataset(event.target);
    this.updateMedia();
  }
  onVariantChange(){
  }
}
customElements.define('color-swatch', ColorSwatch);


// login popup
class ContentDropdown extends HTMLElement {
  constructor() {
    super();
    this.addEventListener('click', this.popUpClick.bind(this));
    document.addEventListener('click', this.closePopup.bind(this));
  }
  popUpClick(event) {
    event.stopPropagation();
    this.querySelector("#content_dropdown").classList.toggle("hidden");
    const overlayBox = document.querySelector(".overlay__search-box");
    const searchModal = document.querySelector(".modal__search-box");
    const suggestBoxes = document.querySelectorAll(".suggest__search-box");
    const customDetails = document.querySelector(".custom-details");
    overlayBox.classList.add("hidden");
    searchModal.classList.remove("show-modal__search-box");
    suggestBoxes.forEach((box) => {
      if (box.classList.contains("suggest__search-box__mobile") == false)
      box.classList.add("hidden")});
    customDetails.removeAttribute('open');
  
  }
  closePopup(event) {
    const userPopup = this.querySelector("#content_dropdown");
    if (!userPopup.contains(event.target)) {
      userPopup.classList.add("hidden");
    }
  }
}
customElements.define('content-dropdown', ContentDropdown);

// Collapsible content
class CollapseContent extends HTMLElement {
  constructor() {
    super();
    var collapse = this.getElementsByClassName("toggle");
    Array.from(collapse).forEach((ele) => {
      ele.setAttribute('tabindex', '0');
      var content_data = ele.nextElementSibling;
      var defaultOpen = ele.classList.contains("active");
      if (content_data && !defaultOpen) {
        content_data.style.height = '0px';
        content_data.setAttribute('data-collapsed', 'true');
      }
      ele.addEventListener("click", this.onCollapseClick.bind(this));
      ele.addEventListener('keydown', this.handleKeyDown.bind(this));
    });
  }
  handleKeyDown(event){
    if (event.keyCode === 13) {
      this.onCollapseClick(event);
    }
  }
  onCollapseClick(event) {
    event.currentTarget.classList.toggle("active");
    var content_data = event.currentTarget.nextElementSibling;
    var isCollapsed = content_data.getAttribute('data-collapsed') === 'true';
    if (isCollapsed) {
      this.expandCollapse(content_data);
      content_data.setAttribute('data-collapsed', 'false');
    } else {
      this.allCollapse(content_data);
    }
  }
  expandCollapse(element) {
    var collapseHeight = element.scrollHeight;
    element.style.height = collapseHeight + 'px';
    element.style.visibility = 'visible';
    element.addEventListener('transitionend', () => {
      element.removeEventListener('transitionend', this.expandCollapse);
      element.style.height = null;
      element.style.visibility = 'visible';
    });
    element.setAttribute('data-collapsed', 'false');
  }
  allCollapse(element) {
    var collapseHeight = element.scrollHeight;
    element.style.height = collapseHeight + 'px';
    element.offsetHeight;
  
    element.style.transition = 'height 0.3s ease';
    element.style.height = '0px';
    
    element.addEventListener('transitionend', () => {
      element.removeEventListener('transitionend', this.allCollapse);
      element.style.transition = '';
      element.style.height = '0px';
      element.style.visibility = 'hidden';
    });
    element.setAttribute('data-collapsed', 'true');
  }
}
customElements.define('collapse-content', CollapseContent);



// Carousel
class SliderCarousel extends HTMLElement {
  constructor() {
    super();
    let optionsData = {};
    let defaults = {};
    let autoplay = false;
    if(this.dataset.sectionSetting){
      const sectionSetting = JSON.parse(this.dataset.sectionSetting);
      const space = +this.dataset.spacingGridHorizontal;
      const spacemobile =  +this.dataset.spacingGridHorizontal/2;
      optionsData = {
        slidesPerView: sectionSetting.columns_desktop ? sectionSetting.columns_desktop : 1,
        spaceBetween: space,
        loop: false,
        dragClickables: false,
        updateOnWindowResize: true,
        pagination: {
          clickable: 'true',
        },
        breakpoints: {
          0: {
            slidesPerView: sectionSetting.columns_mobile,
            spaceBetween: spacemobile,
          },
          768: {
            slidesPerView: sectionSetting.columns_desktop,
            spaceBetween: space,
          }
        }
      };
      if(sectionSetting.content_type == true){
        optionsData['breakpoints'] = {
          0: {
            spaceBetween: spacemobile,
            centeredSlides: true,
            slidesPerView: 1.1,
          },
          768: { 
            slidesPerView: 1.2,
            centeredSlides: true,
            spaceBetween: space,
          },
          992: {
            slidesPerView: 1.9,
            centeredSlides: true,
            spaceBetween: space,
          }
        };
      }
      if(sectionSetting.content_type == false){
        optionsData['breakpoints'] = {
          0: {
            spaceBetween: spacemobile,
            centeredSlides: false,
            slidesPerView: 1,
          },
          768: { 
            slidesPerView: 1,
            centeredSlides: false,
            spaceBetween: space,
          }
        };
      }
      if(sectionSetting.enable_loop == true){
        optionsData['loop'] = {
          loop: true,
          rewind: true,
        };
      }
      if(sectionSetting.transition == 'tran_slide'){
        optionsData['effect'] = 'slide';
      }
      if(sectionSetting.transition == 'tran_card'){
        optionsData['effect'] = 'cards';
      }
      if(sectionSetting.transition == 'tran_coverflow'){
        optionsData['effect'] = 'coverflow';
      }

      if(this.dataset.breakpoints){
        const breakpoints = JSON.parse(this.dataset.breakpoints)
        for (const key in breakpoints) {
          if(key ==0){
            let obj = {
              slidesPerView: breakpoints[key],
              spaceBetween: spacemobile,
            }
            optionsData['breakpoints'][key] = obj
          }else{
            let customspaceBetween = space
            let breakpointsKey = key
            if(key.indexOf('m') > -1){ 
              breakpointsKey = key.split('-')[1]
              customspaceBetween = spacemobile
            }
            let obj = {
              slidesPerView: breakpoints[key],
              spaceBetween: customspaceBetween,
            }
            optionsData['breakpoints'][breakpointsKey] = obj
          }
        }
      }
      if(sectionSetting.auto_rotate == true){
        autoplay = true;
        optionsData['autoplay'] = {
          delay: sectionSetting.change_slides_speed * 1000,
          disableOnInteraction: false,
        };
      }
      if(sectionSetting.pagination_style == 'arrows' || sectionSetting.enable_slide_arrow == true){
        optionsData['navigation'] = {
          nextEl: '.swiper-button-next',
          prevEl: '.swiper-button-prev',
        };
      }

      if(sectionSetting.pagination_style == 'dots' || sectionSetting.pagination_style == 'line' || sectionSetting.pagination_style == 'counter' || sectionSetting.pagination_style == 'numbers' || sectionSetting.pagination_style == 'progressbar'){
        optionsData['pagination']['el'] = '.swiper-pagination';
      }
      if(sectionSetting.pagination_style == 'line') {
        optionsData['pagination']['type'] = 'bullets';
        optionsData['pagination']['renderBullet'] = function (index, className) {
          return '<span class="' + className + '">' + '<i></i>' + '<b></b>'  + '</span>';
        };
      }
      if(sectionSetting.pagination_style == 'counter') {
        optionsData['pagination']['type'] = 'fraction';
        optionsData['pagination']['renderBullet'] = function (index, className) {
          return '<span class="' + className + '">' + '<i></i>' + '<b></b>'  + '</span>';
        };
      }
       if(sectionSetting.pagination_style == 'numbers'){
        optionsData['pagination']['renderBullet'] = function (index, className) {
          return `<span class="${className}">${index + 1}</span>`
        };
      }
      if(sectionSetting.pagination_style == 'progressbar'){
        optionsData['pagination']['type'] = 'progressbar';
      }
    }
    this.options = {
      ...defaults,
      ...optionsData
    };
    new Swiper(this.querySelector('.swiper'), this.options);
  }
  connectedCallback() {
    // new Swiper(this.querySelector('.swiper'), this.options);
  }
}
customElements.define('slider-carousel', SliderCarousel);


// Image comparison
class ImgCompare extends HTMLElement {
  constructor() {
    super();
    this.topImage = this.querySelectorAll('.compare_image')[1];
    this.inputCompare = this.querySelector('.compare_line');
    const compare_cursor = this.querySelector('#compare_cursor');
    compare_cursor.addEventListener('mousemove', this.resizeImg.bind(this));
    compare_cursor.addEventListener('touchmove', this.resizeImg.bind(this));
  }
  resizeImg(event){
    this.topImage.style.width = `${event.target.value}%`;
    this.inputCompare.style.left = `${event.target.value}%`;
  }
  connectedCallback() {
    this.querySelectorAll('.comparewidth').forEach(ele =>{
      ele.style.width = this.clientWidth + 'px';
    });
  }
}
customElements.define('img-compare', ImgCompare);


// Video
document.querySelectorAll('.video-content-remove').forEach((close) => {
  close.addEventListener('click', (event) => {
    const parentElement = event.currentTarget.closest('.video_box');
    if (parentElement) {
      parentElement.remove();
    }
  });
});


// page scroll
function updateProgressBar() {
  const progressBar = document.querySelector('.indicatorebar_inner');
  const totalHeight = document.body.scrollHeight - window.innerHeight;
  const progress = (window.pageYOffset / totalHeight) * 100;
  progressBar.style.width = progress + '%';
}

updateProgressBar(); 
window.addEventListener('scroll', updateProgressBar);
window.addEventListener('resize', updateProgressBar);


// Menu hover
class DesktopWebiMenu extends HTMLElement {
  constructor() {  
    super();
    if(window.outerWidth > 991){
      const drop = this.dataset.drop ? this.dataset.drop : 'click';
      this.addEventListener('click', this.onFocusOut.bind(this));
      this.addEventListener('keydown', this.handleKeyDown.bind(this));
      this.querySelectorAll('li.menu_space').forEach(ele =>{
        ele.addEventListener('keydown', this.handleLiKeyDown.bind(this));
        ele.addEventListener(drop, ()=>{
          this.onLiClick(ele);
        });
        if(drop == 'mouseover'){
          ele.addEventListener('mouseout', ()=>{
             this.closeLi();
          });
        }
      });
    }
  }
  removeSubMenuClass(ele){
    ele.querySelectorAll('.submenu_child').forEach((e)=>{
      e.classList.remove('submenu_keyboard')
    });
  }
  addSubMenuClass(ele){
    ele.querySelectorAll('.submenu_child').forEach((e)=>{
      e.classList.add('submenu_keyboard')
    });
  }
  handleLiKeyDown(event){
    if (event.keyCode === 13) {
      if(event.target.classList.contains('menuclick')){
        event.target.classList.remove('menuclick');
        this.removeSubMenuClass(event.target);
      }
      else 
        this.onLiClick(event.target);
        if(event.target.classList.contains('onlychild_focus')){
          event.preventDefault();
        }
    }
  }
  handleKeyDown(event){
    if (event.keyCode === 13) {
      this.onFocusOut(event);
      if(event.target.classList.contains('onlychild_focus')){
      event.preventDefault();
      }
    }
  }
  onLiClick(ele){
    if(ele.nodeName != 'LI') return;
    this.closeLi();
    ele.classList.add('menuclick');
    this.addSubMenuClass(ele);
  }
  closeLi(){
    this.querySelectorAll('li.menuclick').forEach((ele) =>{
      ele.classList.remove('menuclick');
      this.removeSubMenuClass(ele);
    })
  }
  onFocusOut(event){
    event.stopPropagation();
    if(this.contains(event.target) && (!this.querySelector('.wbmenu_js').contains(event.target))){ 
      if(this.classList.contains('open')) {
        this.classList.remove('open');
        this.closeLi();
      }
      else this.classList.add('open');
    }else if(!this.querySelector('.wbmenu_js').contains(event.target)){
      this.classList.remove('open');
      this.closeLi();
    }
    if ("ontouchstart" in document.documentElement && event.target.closest('.header__menu-item').classList.contains('summary'))
      event.preventDefault();
  }
}
customElements.define('desktop-webi-menu', DesktopWebiMenu); 

class DrawerIcon extends HTMLElement {
  constructor() {  
    super();
    this.querySelectorAll('.drawericon_inner').forEach(ele=>{
      ele.addEventListener('click', this.onIconClick.bind(this))
    });
    this.contentElements = this.querySelectorAll('.drawer_tab');
    this.prevTag = '';
  }

  onIconClick(event){
    let mainDiv = event.target.closest('button');
    this.contentElements.forEach(ele =>{
      if(ele.dataset.contant == mainDiv.dataset.label){
        if(this.prevTag == ele.dataset.contant) {
          this.querySelector('.drawericon').classList.remove('active');
          this.prevTag = '';
        }
        else{
          this.querySelector('.drawericon').classList.add('active');
          this.prevTag = ele.dataset.contant;
        }
        ele.classList.toggle('active');
        mainDiv.classList.toggle('active');
      }else{
        ele.classList.remove('active');
        this.querySelector('button[data-label="'+ele.dataset.contant+'"]').classList.remove('active');
      }
    });
  }

}
customElements.define('drawer-icon', DrawerIcon); 


// Bulk modal
class BulkModal extends HTMLElement {
  constructor() {
    super();
  }
  connectedCallback() {
    const handleIntersection = (entries, observer) => {
      if (!entries[0].isIntersecting) return;
      observer.unobserve(this);
      if (this.innerHTML.trim() === '') {
        const productUrl = this.dataset.url.split('?')[0];
        fetch(`${productUrl}?section_id=bulk-quick-order-list`)
          .then((response) => response.text())
          .then((responseText) => {
            const html = new DOMParser().parseFromString(responseText, 'text/html');
            const sourceQty = html.querySelector('.quick-order-list-container').parentNode;
            this.innerHTML = sourceQty.innerHTML;
          })
          .catch((e) => {
            console.error(e);
          });
      }
    };
    new IntersectionObserver(handleIntersection.bind(this)).observe(
      document.querySelector(`#QuickBulk-${this.dataset.productId}-${this.dataset.sectionId}`)
    );
  }
}

customElements.define('bulk-modal', BulkModal);



// Bulk add
class BulkAdd extends HTMLElement {
  constructor() {
    super();
    this.queue = [];
    this.requestStarted = false;
    this.ids = [];
  }

  startQueue(id, quantity) {
    this.queue.push({ id, quantity });
    const interval = setInterval(() => {
      if (this.queue.length > 0) {
        if (!this.requestStarted) {
          this.sendRequest(this.queue);
        }
      } else {
        clearInterval(interval);
      }
    }, 250);
  }

  sendRequest(queue) {
    this.requestStarted = true;
    const items = {};
    queue.forEach((queueItem) => {
      items[parseInt(queueItem.id)] = queueItem.quantity;
    });
    this.queue = this.queue.filter((queueElement) => !queue.includes(queueElement));
    const quickBulkElement = this.closest('quick-order-list') || this.closest('quick-add-bulk');
    quickBulkElement.updateMultipleQty(items);
  }

  resetQuantityInput(id) {
    const input = this.querySelector(`#Quantity-${id}`);
    input.value = input.getAttribute('value');
    this.isEnterPressed = false;
  }

  setValidity(event, index, message) {
    event.target.setCustomValidity(message);
    event.target.reportValidity();
    this.resetQuantityInput(index);
    event.target.select();
  }

  validateQuantity(event) {
    const inputValue = parseInt(event.target.value);
    const index = event.target.dataset.index;

    if (inputValue < event.target.dataset.min) {
      this.setValidity(event, index, window.quickOrderListStrings.min_error.replace('[min]', event.target.dataset.min));
    } else if (inputValue > parseInt(event.target.max)) {
      this.setValidity(event, index, window.quickOrderListStrings.max_error.replace('[max]', event.target.max));
    } else if (inputValue % parseInt(event.target.step) != 0) {
      this.setValidity(event, index, window.quickOrderListStrings.step_error.replace('[step]', event.target.step));
    } else {
      event.target.setCustomValidity('');
      event.target.reportValidity();
      this.startQueue(index, inputValue);
    }
  }

  getSectionsUrl() {
    if (window.location.pathname == '/search') {
        const urlParams = new URLSearchParams(window.location.search);
        const queryString = urlParams.get('q');
        return `${window.location.pathname}?q=${queryString}`;
    } else {
      if (window.pageNumber) {
        return `${window.location.pathname}?page=${window.pageNumber}`;
      } else {
        return `${window.location.pathname}`;
      }
    }
  }

  getSectionInnerHTML(html, selector) {
    return new DOMParser().parseFromString(html, 'text/html').querySelector(selector).innerHTML;
  }
}

if (!customElements.get('bulk-add')) {
  customElements.define('bulk-add', BulkAdd);
}