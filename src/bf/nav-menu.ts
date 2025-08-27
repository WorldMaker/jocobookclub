export * from './login-button/main.tsx'

export class NavMenu extends HTMLElement {
  #burger: HTMLElement | null = null
  #menu: HTMLElement | null = null

  onBurgerClick = () => {
    this.#burger?.classList.toggle('is-active')
    this.#menu?.classList.toggle('is-active')
  }

  connectedCallback() {
    this.#burger = this.querySelector('.navbar-burger')
    this.#menu = this.querySelector('.navbar-menu')
    if (this.#burger) {
      this.#burger.addEventListener('click', this.onBurgerClick)
    }
  }

  disconnectedCallback() {
    this.#burger?.removeEventListener('click', this.onBurgerClick)
  }
}
customElements.define('nav-menu', NavMenu)
