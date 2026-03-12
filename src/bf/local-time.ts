export class LocalTimeComponent extends HTMLElement {
  connectedCallback() {
    const timeElements = this.querySelectorAll('time[datetime]')
    for (const timeElement of timeElements) {
      const datetime = timeElement.getAttribute('datetime')
      if (datetime) {
        if (globalThis.Temporal) {
          const temporalDate = Temporal.ZonedDateTime.from(datetime)
          const localTemporalDate = temporalDate.withTimeZone(
            Temporal.Now.timeZoneId(),
          )
          timeElement.textContent = localTemporalDate.toLocaleString(
            undefined,
            {
              dateStyle: 'full',
              timeStyle: 'long',
            },
          )
          ;(timeElement as HTMLTimeElement).title = temporalDate
            .toLocaleString()
          timeElement.classList.add('has-background-info-dark')
          continue
        }
        const splitDatetime = datetime.split('[')
        const date = new Date(splitDatetime[0])
        if (date && !isNaN(date.getTime())) {
          timeElement.textContent = date.toLocaleString(undefined, {
            dateStyle: 'full',
            timeStyle: 'long',
          })
          ;(timeElement as HTMLTimeElement).title = datetime
          timeElement.classList.add('has-background-info-dark')
        }
      }
    }
  }
}

customElements.define('local-time', LocalTimeComponent)
