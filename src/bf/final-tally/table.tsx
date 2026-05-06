import { Empty, Fragment, jsx, NodeDescription } from '@worldmaker/butterfloat'
import { Ranking } from './vm.ts'
import { GenreTags } from '../genre-tags/index.tsx'
import { GenreMark, GenreMarks } from '../genre-tags/mark.tsx'

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
        <span class='icon-text' title={`More Interest than ${otherTitle}`}>
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
        <span class='icon-text' title={`Less Interest than ${otherTitle}`}>
          <span class='icon has-text-danger'>
            <i class='fa-duotone fa-solid fa-chevrons-down'></i>
          </span>
          <span>{otherTitle}</span>
        </span>,
      )
    }
  }
  const support = finalTally.supports?.[idx]
  const supportPercent = support ? (support / finalTally.count) * 100 : 0
  const supportTag = support || support === 0
    ? (
      <span
        class='icon-text'
        title={`${
          supportPercent.toFixed(0)
        }% of ballots preferred this book over at least one other`}
      >
        <span class='icon has-text-info'>
          <i class='fa-duotone fa-solid fa-hand-holding-star'></i>
        </span>
        <span>
          <progress class='progress is-info' value={supportPercent} max={100}>
            {supportPercent.toFixed(0)}%
          </progress>
        </span>
      </span>
    )
    : Empty()
  return (
    <details>
      <summary>
        Interest in {ranking.books[ltid]?.title ?? 'Missing Information'}
      </summary>
      <div class='ranking-interest'>
        {supportTag}
        {wins}
      </div>
    </details>
  )
}

interface RowProps {
  idx: number
  ltid: string
  ranking: Ranking
}

function Row({ idx, ltid, ranking }: RowProps) {
  const { books, finalTally } = ranking
  const book = books[ltid]
  const bookIdx = finalTally.books.indexOf(ltid)
  const marks = finalTally.marks?.[bookIdx]
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
        <div class='tags'>
          <GenreTags tags={book.tags} condense />
          <GenreMarks marks={marks ?? {}} condense />
        </div>
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
  const preferred = (finalTally.preferredMultiplier ?? 1) > 1 &&
    (finalTally.preferred?.length ?? 0) > 0
  const preferredBlock = preferred
    ? (
      <p class='block'>
        <i class='fa-duotone fa-solid fa-user-astronaut'></i>{' '}
        {finalTally.preferred?.length ?? 0} JoCoNauts had their ballots counted
        {' '}
        {finalTally.preferredMultiplier}:1.
      </p>
    )
    : Empty()
  const oldestBlock = finalTally.oldest
    ? (
      <p class='block'>
        The oldest ballot counted was cast on{' '}
        {finalTally.oldest.toLocaleDateString()} at{' '}
        {finalTally.oldest.toLocaleTimeString()}.
      </p>
    )
    : Empty()
  return (
    <>
      <p class='block'>
        <i class='fa-duotone fa-solid fa-user-astronaut'></i> {finalTally.count}
        {' '}
        JoCoNauts participated in these rankings calculated on{' '}
        {updated.toLocaleDateString()} at {updated.toLocaleTimeString()}.
      </p>
      {preferredBlock}
      {oldestBlock}
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
