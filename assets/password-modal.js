class PasswordModal extends DetailsModal {
  constructor() {
    super();
    if (this.querySelector('input[aria-invalid="true"]')) this.open({ target: this.querySelector('details') });

    this.querySelector('.modal__content').addEventListener('click', this.closeOpenModel.bind(this));
  }

  closeOpenModel(event){
    if(!this.querySelector('.password-modal__content').contains(event.target)){
      this.close({ target: this.querySelector('details') });
    }
  }
}

customElements.define('password-modal', PasswordModal);
