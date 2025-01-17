import { buildStamp } from '@worldmaker/butterfloat'
import { JSDOM } from 'jsdom'
import { NEVER } from 'rxjs'
import Login from './login-button/login.tsx'
import User from './login-button/user.tsx'

await Deno.mkdir('../site/_includes/bf/stamps', { recursive: true })

const dom = new JSDOM()
const { window } = dom
const { document } = window

// *** Login Button stamps ***

const loginStamp = buildStamp(Login(), document)
const loginStampDiv = document.createElement('div')
loginStampDiv.append(loginStamp.content)
await Deno.writeTextFile(
  '../site/_includes/bf/stamps/login-button-login.html',
  loginStampDiv.innerHTML,
)

const userStamp = buildStamp(User({ email: NEVER }), document)
const userStampDiv = document.createElement('div')
userStampDiv.append(userStamp.content)
await Deno.writeTextFile(
  '../site/_includes/bf/stamps/login-button-user.html',
  userStampDiv.innerHTML,
)

await Deno.mkdir('../site/_includes/bf', { recursive: true })
await Deno.writeTextFile(
  '../site/_includes/bf/login-button.vto',
  `<template id="login-button-login">{{ include "bf/stamps/login-button-login.html" }}</template>
<template id="login-button-user">{{ include "bf/stamps/login-button-user.html" }}</template>`,
)
