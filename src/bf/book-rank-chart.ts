import { Chart, LinearScale, LineController, LineElement, PointElement, TimeScale, Tooltip } from 'chart.js'
import 'chartjs-adapter-date-fns' // silly side effect to register the date adapter // TODO: Temporal adapter when it exists
import { StaticApiBase } from './final-tally/vm.ts'

Chart.register([
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  TimeScale,
  Tooltip,
]);

class BookRankChart extends HTMLElement {
  #chart?: Chart<'line', unknown, unknown>

  async connectedCallback() {
    const ltid = this.getAttribute('ltid')
    if (!ltid) {
      console.error('No ltid attribute found on book-rank-chart element')
      return
    }
    const rankResponse = await fetch(`${StaticApiBase}/book-ranks/${ltid}.json`)
    if (!rankResponse.ok) {
      console.error(`Failed to fetch rank data for ltid ${ltid}: ${rankResponse.statusText}`)
      return
    }
    const rank = await rankResponse.json()

    this.style.display = 'block'
    this.style.position = 'relative'
    this.style.height = '30vh'
    this.style.width = '100%'

    const canvas = document.createElement('canvas')
    this.appendChild(canvas)

    const data = Object.entries(rank)
      .map(([date, rank]) => ({ x: date, y: rank }))
      .sort((a, b) => new Date(a.x).getTime() - new Date(b.x).getTime())
    console.log('Rank data for book', ltid, data)

    this.#chart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: rank.labels,
        datasets: [{
          label: 'Book Rank',
          data,
          borderColor: 'rgba(75, 192, 192, 1)',
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            suggestedMin: 0,
            suggestedMax: 20,
          },
          x: {
            type: 'time',
          }
        }
      }
    })
  }

  disconnectedCallback() {
    if (this.#chart) {
      this.#chart.destroy()
    }
    this.innerHTML = ''
  }
}

customElements.define('book-rank-chart', BookRankChart)
export default BookRankChart
