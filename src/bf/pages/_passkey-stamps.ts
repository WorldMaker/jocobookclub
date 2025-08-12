import {
  buildStamp,
  makeTestComponentContext,
  makeTestEvent,
} from '@worldmaker/butterfloat'
import { AddPasskey, AddPasskeyEvents } from '../add-passkey/add-button.tsx'
import { NEVER } from 'rxjs'
import { RegistrationVm } from '../add-passkey/vm.ts'
import { SessionError } from '../add-passkey/session-error.tsx'
import { Skeleton } from '../add-passkey/skeleton.tsx'
import { Success } from '../add-passkey/success.tsx'
import { VerificationError } from '../add-passkey/verification-error.tsx'
import { Logout, LogoutEvents } from '../logout-button/logout.tsx'
import { Login } from '../logout-button/login.tsx'
import { Form } from '../user-prefs/form.tsx'
import { UserPrefsManager } from '../user-prefs/vm.ts'

export async function buildPasskeyStamps(document: Document) {
  // paths are relative to the project root
  await Deno.mkdir('../site/_includes/bf', { recursive: true })
  await Deno.writeTextFile('../site/_includes/bf/passkey-page.html', '', {
    create: true,
  })

  // *** Add Passkey ***
  const { context: addPasskeyContext } = makeTestComponentContext<
    AddPasskeyEvents
  >({
    click: makeTestEvent(NEVER),
  })
  const vm = new RegistrationVm()
  const addPasskey = AddPasskey({
    vm,
    session: { token: 'FAKE', userId: 'FAKE', expiresAt: new Date() },
  }, addPasskeyContext)
  const addPasskeyStamp = buildStamp(addPasskey, document)
  addPasskeyStamp.id = 'add-passkey'
  await Deno.writeTextFile(
    '../site/_includes/bf/passkey-page.html',
    addPasskeyStamp.outerHTML,
    { append: true },
  )

  const sessionError = SessionError()
  const sessionErrorStamp = buildStamp(sessionError, document)
  sessionErrorStamp.id = 'session-error'
  await Deno.writeTextFile(
    '../site/_includes/bf/passkey-page.html',
    sessionErrorStamp.outerHTML,
    { append: true },
  )

  const skeleton = Skeleton()
  const skeletonStamp = buildStamp(skeleton, document)
  skeletonStamp.id = 'passkey-skeleton'
  await Deno.writeTextFile(
    '../site/_includes/bf/passkey-page.html',
    skeletonStamp.outerHTML,
    { append: true },
  )

  const success = Success()
  const successStamp = buildStamp(success, document)
  successStamp.id = 'passkey-success'
  await Deno.writeTextFile(
    '../site/_includes/bf/passkey-page.html',
    successStamp.outerHTML,
    { append: true },
  )

  const verifyError = VerificationError()
  const verifyErrorStamp = buildStamp(verifyError, document)
  verifyErrorStamp.id = 'verification-error'
  await Deno.writeTextFile(
    '../site/_includes/bf/passkey-page.html',
    verifyErrorStamp.outerHTML,
    { append: true },
  )

  // *** Logout Button ***
  const { context: logoutContext } = makeTestComponentContext<LogoutEvents>({
    click: makeTestEvent(NEVER),
  })
  const logoutButton = Logout({
    session: { token: 'FAKE', userId: 'FAKE', expiresAt: new Date() },
  }, logoutContext)
  const logoutButtonStamp = buildStamp(logoutButton, document)
  logoutButtonStamp.id = 'logout-button'
  await Deno.writeTextFile(
    '../site/_includes/bf/passkey-page.html',
    logoutButtonStamp.outerHTML,
    { append: true },
  )

  const loginNotice = Login()
  const loginNoticeStamp = buildStamp(loginNotice, document)
  loginNoticeStamp.id = 'login-notice'
  await Deno.writeTextFile(
    '../site/_includes/bf/passkey-page.html',
    loginNoticeStamp.outerHTML,
    { append: true },
  )

  // *** User Prefs Form ***
  const { context: userPrefsContext } = makeTestComponentContext({
    save: makeTestEvent(NEVER),
    canEmailChanged: makeTestEvent(NEVER),
    preferredNameChanged: makeTestEvent(NEVER),
    canDiscordDmChanged: makeTestEvent(NEVER),
    discordHandleChanged: makeTestEvent(NEVER),
  })
  const prefsVm = new UserPrefsManager({
    expiresAt: new Date(),
    token: 'FAKE',
    userId: 'FAKE',
  })
  const userPrefsForm = Form({ vm: prefsVm }, userPrefsContext)
  const userPrefsStamp = buildStamp(userPrefsForm, document)
  userPrefsStamp.id = 'user-prefs-form'
  await Deno.writeTextFile(
    '../site/_includes/bf/passkey-page.html',
    userPrefsStamp.outerHTML,
    { append: true },
  )
}
