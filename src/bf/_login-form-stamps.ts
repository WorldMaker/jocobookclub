import {
  buildStamp,
  makeTestComponentContext,
  makeTestEvent,
} from '@worldmaker/butterfloat'
import { Error } from './login-form/error.tsx'
import { Form, type FormEvents } from './login-form/form.tsx'
import { NEVER } from 'rxjs'
import { LoginFormVm } from './login-form/vm.ts'
import { Skeleton } from './login-form/skeleton.tsx'
import { Success } from './login-form/success.tsx'

export async function buildLoginStamps(document: Document) {
  // paths are relative to the project root
  await Deno.mkdir('../site/_includes/bf', { recursive: true })
  await Deno.writeTextFile('../site/_includes/bf/login-form.html', '', {
    create: true,
  })

  // *** Error ***
  const error = Error()
  const errorStamp = buildStamp(error, document)
  errorStamp.id = 'login-form-error'
  await Deno.writeTextFile(
    '../site/_includes/bf/login-form.html',
    errorStamp.outerHTML,
    { append: true },
  )

  // *** Login Form ***
  const { context: loginContext } = makeTestComponentContext<FormEvents>({
    emailChanged: makeTestEvent(NEVER),
    login: makeTestEvent(NEVER),
  })
  const vm = new LoginFormVm()
  const form = Form({ vm }, loginContext)
  const formStamp = buildStamp(form, document)
  formStamp.id = 'login-form'
  await Deno.writeTextFile(
    '../site/_includes/bf/login-form.html',
    formStamp.outerHTML,
    { append: true },
  )

  // *** Login Form Skeleton ***
  const skeleton = Skeleton()
  const skeletonStamp = buildStamp(skeleton, document)
  skeletonStamp.id = 'login-form-skeleton'
  await Deno.writeTextFile(
    '../site/_includes/bf/login-form.html',
    skeletonStamp.outerHTML,
    { append: true },
  )

  // *** Success ***
  const success = Success()
  const successStamp = buildStamp(success, document)
  successStamp.id = 'login-form-success'
  await Deno.writeTextFile(
    '../site/_includes/bf/login-form.html',
    successStamp.outerHTML,
    { append: true },
  )
}
