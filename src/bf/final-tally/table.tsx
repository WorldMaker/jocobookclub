import { Fragment, jsx, NodeDescription } from '@worldmaker/butterfloat'
import { Ranking } from './vm.ts'
import { GenreTags } from '../genre-tags/index.tsx'

interface InterestProps {
  ltid: string
  ranking: Ranking
}

function Interest({ ltid, ranking }: InterestProps) {
  const { finalTally } = ranking
  const idx = finalTally.books.indexOf(ltid)
  if (idx === -1) {
    return <span>Missing information</span>
  }
  const wins: NodeDescription[] = []
  for (let i = 0; i < finalTally.books.length; i++) {
    if (i === idx) {
      continue
    }
    if (finalTally.matrix[idx][i] > finalTally.matrix[i][idx]) {
      const otherTitle = ranking.books[finalTally.books[i]]?.title ??
        'Missing information'
      wins.push(
        <span class='icon-text'>
          <span class='icon has-text-success'>
            <i class='fa-duotone fa-solid fa-chevrons-up'></i>
          </span>
          <span>{otherTitle}</span>
        </span>,
      )
    } else {
      const otherTitle = ranking.books[finalTally.books[i]]?.title ??
        'Missing information'
      wins.push(
        <span class='icon-text'>
          <span class='icon has-text-danger'>
            <i class='fa-duotone fa-solid fa-chevrons-down'></i>
          </span>
          <span>{otherTitle}</span>
        </span>,
      )
    }
  }
  return (
    <details>
      <summary>
        Interest in {ranking.books[ltid]?.title ?? 'Missing Information'}
      </summary>
      {wins}
    </details>
  )
}

interface RowProps {
  idx: number
  ltid: string
  ranking: Ranking
}

function Row({ idx, ltid, ranking }: RowProps) {
  const { books } = ranking
  const book = books[ltid]
  if (!book) {
    return (
      <tr>
        <th>{idx}</th>
        <td colSpan={3}>Missing information</td>
      </tr>
    )
  }
  return (
    <tr>
      <th>{idx}</th>
      <td>
        <a href={book.url}>{book.title}</a>{' '}
        [<a href={`https://www.librarything.com/work/${ltid}`}>LT</a>]
      </td>
      <td>{book.author}</td>
      <td>
        <GenreTags tags={book.tags} condense />
      </td>
    </tr>
  )
}

interface TableProps {
  ranking: Ranking
}

export function Table({ ranking }: TableProps) {
  const { finalTally } = ranking
  const updated = new Date(finalTally.updated)
  return (
    <>
      <p class='block'>
        <i class='fa-duotone fa-solid fa-user-astronaut'></i> {finalTally.count}
        {' '}
        JoCoNauts participated in these rankings calculated on{' '}
        {updated.toLocaleDateString()} at {updated.toLocaleTimeString()}.
      </p>
      <table class='table'>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Title</th>
            <th>Author</th>
            <th>Tags</th>
          </tr>
        </thead>
        {/* The list is reversed because sorted in ascending order */}
        <tbody>
          {finalTally.ranking.toReversed().map((ltid, idx) => (
            <>
              <Row idx={idx + 1} ltid={ltid} ranking={ranking} />
              <tr>
                <td></td>
                <td colSpan={4}>
                  <Interest ltid={ltid} ranking={ranking} />
                </td>
              </tr>
            </>
          ))}
        </tbody>
      </table>
    </>
  )
}
