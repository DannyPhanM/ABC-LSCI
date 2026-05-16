if (!customElements.get('price-checkboxes')) {
  class PriceCheckboxes extends HTMLElement {
    constructor() {
      super();
      this.checkboxes = this.querySelectorAll('.price-range-checkbox');
      this.gteInput = this.querySelector('[id$="-GTE-Hidden"]');
      this.lteInput = this.querySelector('[id$="-LTE-Hidden"]');
      this.multiplier = parseInt(this.dataset.multiplier) || 100;

      this.checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', this.onCheckboxChange.bind(this));
      });
      
      this.init();
    }

    init() {
      // Restore checked state from URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const selectedOptions = urlParams.getAll('price-range-option');
      
      if (selectedOptions.length > 0) {
        this.checkboxes.forEach(checkbox => {
          checkbox.checked = selectedOptions.includes(checkbox.value);
        });
      }
      
      // Initial render of chips
      setTimeout(() => this.renderActiveChips(), 100);
    }

    onCheckboxChange(event) {
      const checkedBoxes = Array.from(this.checkboxes).filter(cb => cb.checked);
      
      if (checkedBoxes.length > 0) {
        let min = Infinity;
        let max = 0;
        let hasNoUpperLimit = false;

        checkedBoxes.forEach(cb => {
          const cbMin = parseInt(cb.dataset.min);
          const cbMax = parseInt(cb.dataset.max);

          if (cbMin < min) min = cbMin;
          if (cbMax === 0) {
            hasNoUpperLimit = true;
          } else {
            if (cbMax > max) max = cbMax;
          }
        });

        // Update Shopify hidden inputs
        this.gteInput.value = min !== Infinity ? (min / this.multiplier).toString() : '';
        this.lteInput.value = hasNoUpperLimit ? '' : (max / this.multiplier).toString();
      } else {
        this.gteInput.value = '';
        this.lteInput.value = '';
      }

      // Trigger form submission
      const form = this.closest('facet-filters-form') || document.querySelector('facet-filters-form');
      if (form && typeof form.onSubmitHandler === 'function') {
        form.onSubmitHandler(new Event('submit'));
      } else {
        const formEl = this.closest('form') || document.querySelector('facet-filters-form form');
        if (formEl) formEl.dispatchEvent(new Event('input', { bubbles: true }));
      }
      
      this.renderActiveChips();
    }

    renderActiveChips() {
      const containers = document.querySelectorAll('.active-facets-mobile, .active-facets-desktop');
      if (containers.length === 0) return;

      containers.forEach(container => {
        // Clear previous custom chips
        container.querySelectorAll('.active-facets__button--custom-price').forEach(el => el.remove());

        // Hide the default single price range chip
        container.querySelectorAll('.active-facets__button--price').forEach(el => {
          el.style.display = 'none';
        });

        // Create new chips for each checked checkbox
        this.checkboxes.forEach(checkbox => {
          if (checkbox.checked) {
            const labelText = checkbox.closest('.facet-checkbox').querySelector('.facet-checkbox__text').textContent.trim();
            const chip = document.createElement('facet-remove');
            chip.className = 'active-facets__button--custom-price';
            
            const isDesktop = container.classList.contains('active-facets-desktop');
            const innerClass = isDesktop ? 'active-facets__button-inner button button--tertiary' : 'active-facets__button-inner';

            chip.innerHTML = `
              <a href="#" class="active-facets__button active-facets__button--light">
                <span class="${innerClass}">
                  ${labelText}
                  <svg width="1.2rem" height="1.2rem" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                    <path d="M1.5 1.5L14.5 14.5M14.5 1.5L1.5 14.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path>
                  </svg>
                  <span class="visually-hidden">Remove filter</span>
                </span>
              </a>
            `;

            chip.querySelector('a').addEventListener('click', (e) => {
              e.preventDefault();
              checkbox.checked = false;
              this.onCheckboxChange();
            });

            const clearAll = container.querySelector('.active-facets__button-wrapper');
            if (clearAll) {
              container.insertBefore(chip, clearAll);
            } else {
              container.appendChild(chip);
            }
          }
        });
      });
    }
  }

  customElements.define('price-checkboxes', PriceCheckboxes);
}
