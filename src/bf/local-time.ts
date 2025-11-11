export class LocalTimeComponent extends HTMLTimeElement {
  connectedCallback() {
    const datetime = this.getAttribute('datetime')
    if (datetime) {
      if (globalThis.Temporal) {
        const temporalDate = Temporal.ZonedDateTime.from(datetime)
        const localTemporalDate = temporalDate.withTimeZone(Temporal.Now.zonedDateTimeISO())
        this.textContent = localTemporalDate.toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'long' })
        this.title = temporalDate.toLocaleString()
        this.classList.add('has-background-info-dark')
        return
      }
      const splitDatetime = datetime.split('[')
      const date = new Date(splitDatetime[0])
      if (date && !isNaN(date.getTime())) {
        this.textContent = date.toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'long' })
        this.title = datetime
        this.classList.add('has-background-info-dark')
      }
    }
  }
}

customElements.define('local-time', LocalTimeComponent, { extends: 'time' })
