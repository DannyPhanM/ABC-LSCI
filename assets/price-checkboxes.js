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
      // Restore checked state from URL parameters to support disjoint ranges visually
      const urlParams = new URLSearchParams(window.location.search);
      const selectedOptions = urlParams.getAll('price-range-option');
      
      if (selectedOptions.length > 0) {
        this.checkboxes.forEach(checkbox => {
          if (selectedOptions.includes(checkbox.value)) {
            checkbox.checked = true;
          } else {
            checkbox.checked = false;
          }
        });
      }
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

        this.gteInput.value = min !== 0 && min !== Infinity ? (min / this.multiplier).toString() : '';
        this.lteInput.value = hasNoUpperLimit ? '' : (max / this.multiplier).toString();
      } else {
        this.gteInput.value = '';
        this.lteInput.value = '';
      }

      // Trigger the form submission (FacetFiltersForm handles this)
      const form = this.closest('form') || document.querySelector('facet-filters-form form');
      if (form) {
        form.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
  }

  customElements.define('price-checkboxes', PriceCheckboxes);
}
