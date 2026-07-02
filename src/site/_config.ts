import lume from 'lume/mod.ts'
import basePath from 'lume/plugins/base_path.ts'
import { getHistory } from './history.data.ts'

const site = lume({
  dest: '../../dist/site/',
  location: new URL('https://worldmaker.net/jocobookclub/'),
})

site.use(basePath())

site.copy('assets')
site.copy('bf')

site.data('history', async () => await getHistory(site))

site.addEventListener('beforeBuild', async () => {
  const command = new Deno.Command(Deno.execPath(), {
    args: ['task', 'build'],
    cwd: new URL('../bf/', import.meta.url),
  })
  const process = command.spawn()
  await process.status
})

export default site
