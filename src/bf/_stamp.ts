import { buildStamp } from '@worldmaker/butterfloat'
import { JSDOM } from 'jsdom'
import { NEVER } from 'rxjs'
import Login from './login-button/login.tsx'
import User from './login-button/user.tsx'

const dom = new JSDOM()
const { window } = dom
const { document } = window

// *** Login Button stamps ***

const loginStamp = buildStamp(Login(), document)
loginStamp.id = 'login-button-login'
document.body.appendChild(loginStamp)

const userStamp = buildStamp(User({ email: NEVER }), document)
userStamp.id = 'login-button-user'
document.body.appendChild(userStamp)

await Deno.mkdir('../site/_includes/bf', { recursive: true })
await Deno.writeTextFile('../site/_includes/bf/login-button.html', document.body.innerHTML)
