if (!customElements.get('show-more-button')) {
  customElements.define(
    'show-more-button',
    class ShowMoreButton extends HTMLElement {
      constructor() {
        super();
        const button = this.querySelector('button');
        button.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
          
          this.expandShowMore(event);

          // Force the parent details to stay open on mobile
          const parentDetails = this.closest('details');
          if (parentDetails) {
            parentDetails.setAttribute('open', '');
          }

          const parentDisplay = event.target.closest('.parent-display');
          if (!parentDisplay) return;
          const nextElementToFocus = parentDisplay.querySelector('.show-more-item');
          if (nextElementToFocus && !nextElementToFocus.classList.contains('hidden') && nextElementToFocus.querySelector('input')) {
            nextElementToFocus.querySelector('input').focus();
          }
        });
      }
      expandShowMore(event) {
        const parentDisplay = event.target.closest('[id^="Show-More-"]').closest('.parent-display');
        if (!parentDisplay) return;
        const parentWrap = parentDisplay.querySelector('.parent-wrap');
        this.querySelectorAll('.label-text').forEach((element) => element.classList.toggle('hidden'));
        parentDisplay.querySelectorAll('.show-more-item').forEach((item) => item.classList.toggle('hidden'));
        if (!this.querySelector('.label-show-less')) {
          this.classList.add('hidden');
        }
      }
    }
  );
}
