import {
  buildStamp,
  makeTestComponentContext,
  makeTestEvent,
} from '@worldmaker/butterfloat'
import InviteRegistrationForm, {
  type InviteRegistrationFormEvents,
} from './invite-register/form.tsx'
import { NEVER } from 'rxjs'
import { RegistrationVm } from './invite-register/vm.ts'
import AlreadyLoggedIn from './invite-register/logged-in.tsx'
import InvalidInvite from './invite-register/invalid-invite.tsx'
import InviteRegistrationFormSkeleton from './invite-register/skeleton.tsx'
import { SessionError } from './add-passkey/session-error.tsx'
import { Success } from './add-passkey/success.tsx'
import { VerificationError } from './add-passkey/verification-error.tsx'

export async function buildInviteStamps(document: Document) {
  // paths are relative to the project root
  await Deno.mkdir('../site/_includes/bf', { recursive: true })
  await Deno.writeTextFile('../site/_includes/bf/invite-register.html', '', {
    create: true,
  })

  // *** Invite Registration Form ***

  const { context: registrationContext } = makeTestComponentContext<
    InviteRegistrationFormEvents
  >({
    emailChanged: makeTestEvent<InputEvent>(NEVER),
    submit: makeTestEvent<SubmitEvent>(NEVER),
  })
  const vm = new RegistrationVm()
  const form = InviteRegistrationForm({
    invite: { id: 'FAKE', type: 'open-enrollment' },
    vm,
  }, registrationContext)
  const formStamp = buildStamp(form, document)
  formStamp.id = 'invite-register-form'
  await Deno.writeTextFile(
    '../site/_includes/bf/invite-register.html',
    formStamp.outerHTML,
    { append: true },
  )

  // *** Invalid Invite ***

  const invalid = InvalidInvite()
  const invalidStamp = buildStamp(invalid, document)
  invalidStamp.id = 'invite-register-invalid'
  await Deno.writeTextFile(
    '../site/_includes/bf/invite-register.html',
    invalidStamp.outerHTML,
    { append: true },
  )

  // *** Logged In ***

  const loggedIn = AlreadyLoggedIn()
  const loggedInStamp = buildStamp(loggedIn, document)
  loggedInStamp.id = 'invite-register-logged-in'
  await Deno.writeTextFile(
    '../site/_includes/bf/invite-register.html',
    loggedInStamp.outerHTML,
    { append: true },
  )

  // *** Invite Registration Form Skeleton ***

  const skeleton = InviteRegistrationFormSkeleton()
  const skeletonStamp = buildStamp(skeleton, document)
  skeletonStamp.id = 'invite-register-skeleton'
  await Deno.writeTextFile(
    '../site/_includes/bf/invite-register.html',
    skeletonStamp.outerHTML,
    { append: true },
  )

  // *** Shared with Add Passkey ***

  const sessionError = SessionError()
  const sessionErrorStamp = buildStamp(sessionError, document)
  sessionErrorStamp.id = 'session-error'
  await Deno.writeTextFile(
    '../site/_includes/bf/invite-register.html',
    sessionErrorStamp.outerHTML,
    { append: true },
  )

  const success = Success()
  const successStamp = buildStamp(success, document)
  successStamp.id = 'passkey-success'
  await Deno.writeTextFile(
    '../site/_includes/bf/invite-register.html',
    successStamp.outerHTML,
    { append: true },
  )

  const verifyError = VerificationError()
  const verifyErrorStamp = buildStamp(verifyError, document)
  verifyErrorStamp.id = 'verification-error'
  await Deno.writeTextFile(
    '../site/_includes/bf/invite-register.html',
    verifyErrorStamp.outerHTML,
    { append: true },
  )
}
