import lume from 'lume/mod.ts'
import basePath from 'lume/plugins/base_path.ts'

const site = lume({
  dest: '../../dist/site/',
  location: new URL('https://worldmaker.net/jocobookclub/'),
})

site.use(basePath())

export default site
