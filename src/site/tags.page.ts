import genreTags from './_data/genre/tags.json' with { type: 'json' }

interface TagInfo {
  iconClass: string
  icon: string
  title: string
  name?: string
  description?: string
}

export default function* tagsPages({}: Lume.Data) {
  for (const [tag, info] of Object.entries(genreTags)) {
    yield {
      ...info as TagInfo,
      tag,
      tags: ['tag', tag],
      layout: 'tag.vto',
      url: `/tags/${tag}/`,
    }
  }
}
