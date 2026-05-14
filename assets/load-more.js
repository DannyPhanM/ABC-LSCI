class LoadMore extends HTMLElement {
  constructor() {
    super();
    this.button = this.querySelector('button');
    this.spinner = this.querySelector('.loading__spinner');
    this.nextUrl = this.dataset.nextUrl;
    this.sectionId = this.dataset.sectionId;
    this.grid = document.getElementById('product-grid');
    this.productCount = document.getElementById('ProductCount');
    this.productCountDesktop = document.getElementById('ProductCountDesktop');

    if (this.button) {
      this.button.addEventListener('click', this.onButtonClick.bind(this));
    }
  }

  async onButtonClick() {
    if (!this.nextUrl) return;

    this.toggleLoading(true);

    try {
      const response = await fetch(`${this.nextUrl}&section_id=${this.sectionId}`);
      if (!response.ok) throw new Error('Network response was not ok');
      
      const responseText = await response.text();
      const html = new DOMParser().parseFromString(responseText, 'text/html');
      
      const newProducts = html.querySelectorAll('#product-grid > li');
      const nextLoadMore = html.querySelector('load-more');
      const nextProductCount = html.getElementById('ProductCount');

      if (newProducts.length > 0) {
        newProducts.forEach(product => {
            this.grid.appendChild(product);
            // Re-initialize animations for the specific product
            if (window.initializeScrollAnimationTrigger) {
                window.initializeScrollAnimationTrigger(product);
            }
        });
      }

      if (nextLoadMore) {
        this.nextUrl = nextLoadMore.dataset.nextUrl;
        this.dataset.nextUrl = this.nextUrl;
      } else {
        this.nextUrl = null;
        this.classList.add('hidden');
      }

      if (nextProductCount && this.productCount) {
          this.productCount.innerHTML = nextProductCount.innerHTML;
          if (this.productCountDesktop) this.productCountDesktop.innerHTML = nextProductCount.innerHTML;
      }

      // Re-initialize any theme-specific scripts for new elements
      if (window.initializeScrollAnimationTrigger) {
          window.initializeScrollAnimationTrigger();
      }

    } catch (error) {
      console.error('Error loading more products:', error);
    } finally {
      this.toggleLoading(false);
    }
  }

  toggleLoading(isLoading) {
    if (this.button) {
      this.button.disabled = isLoading;
      const text = this.button.querySelector('span');
      if (text) text.classList.toggle('hidden', isLoading);
    }
    if (this.spinner) {
      this.spinner.classList.toggle('hidden', !isLoading);
    }
  }
}

customElements.define('load-more', LoadMore);
