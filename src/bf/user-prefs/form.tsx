import {
  ComponentContext,
  Empty,
  jsx,
  ObservableEvent,
} from '@worldmaker/butterfloat'
import { UserPrefsManager } from './vm.ts'
import { combineLatest, map, shareReplay } from 'rxjs'

export interface UserPrefsFormProps {
  vm: UserPrefsManager
}

export interface UserPrefsFormEvents {
  save: ObservableEvent<SubmitEvent>
  canEmailChanged: ObservableEvent<InputEvent>
  preferredNameChanged: ObservableEvent<InputEvent>
  canDiscordDmChanged: ObservableEvent<InputEvent>
  discordHandleChanged: ObservableEvent<InputEvent>
}

export function Form(
  { vm }: UserPrefsFormProps,
  { bindImmediateEffect, events }: ComponentContext<
    UserPrefsFormEvents
  >,
) {
  bindImmediateEffect(events.save, (event) => {
    event.preventDefault()
    vm.save()
  })
  bindImmediateEffect(events.canEmailChanged, (event) => {
    const canEmail = (event.target as HTMLInputElement).checked
    vm.canEmailChanged(canEmail)
  })
  bindImmediateEffect(events.preferredNameChanged, (event) => {
    const preferredName = (event.target as HTMLInputElement).value
    vm.preferredNameChanged(preferredName)
  })
  bindImmediateEffect(events.canDiscordDmChanged, (event) => {
    const canDiscordDm = (event.target as HTMLInputElement).checked
    vm.canDiscordDmChanged(canDiscordDm)
  })
  bindImmediateEffect(events.discordHandleChanged, (event) => {
    const discordHandle = (event.target as HTMLInputElement).value
    vm.discordHandleChanged(discordHandle)
  })

  const canEmail = vm.prefs.pipe(
    map((prefs) => prefs?.canEmail ?? false),
  )
  const canNotEmail = vm.prefs.pipe(
    map((prefs) => !prefs?.canEmail),
  )

  const preferredName = vm.prefs.pipe(
    map((prefs) => prefs?.preferredName ?? ''),
  )

  const canDiscordDm = vm.prefs.pipe(
    map((prefs) => prefs?.canDiscordDm ?? false),
  )
  const canNotDiscordDm = vm.prefs.pipe(
    map((prefs) => !prefs?.canDiscordDm),
  )

  const discordHandle = vm.prefs.pipe(
    map((prefs) => prefs?.discordHandle ?? ''),
  )

  const prefsInvalid = vm.valid.pipe(
    map((valid) => !valid.success),
    shareReplay(1),
  )

  const prefsSavedOrInvalid = combineLatest([
    vm.unsaved,
    prefsInvalid,
  ]).pipe(
    map(([unsaved, invalid]) => !unsaved || invalid),
    shareReplay(1),
  )

  return (
    <form class='user-prefs-form' events={{ submit: events.save }}>
      <div class='field'>
        <div class='control'>
          <label for='can-email' class='checkbox'>
            <input
              id='can-email'
              type='checkbox'
              class='checkbox'
              immediateBind={{ checked: canEmail }}
              events={{ change: events.canEmailChanged }}
            />{' '}
            <span>Can we email you?</span>
          </label>
          <p class='help'>
            We expect to only send a low volume of meeting invites and similar
            things, and you can change this preference at any time.
          </p>
        </div>
      </div>
      <div class='field' classBind={{ 'is-hidden': canNotEmail }}>
        <label for='preferred-name' class='label'>
          Preferred Name
        </label>
        <div class='control'>
          <input
            id='preferred-name'
            type='text'
            class='input'
            immediateBind={{ value: preferredName }}
            events={{ change: events.preferredNameChanged }}
          />
          <p class='help'>
            This name is entirely optional and will just be used with your email
            to provide very basic contact information.
          </p>
        </div>
      </div>
      <div
        class='field'
        classBind={{
          'is-hidden': vm.previewEmail.pipe(map((email) => !email)),
        }}
      >
        <label class='label'>Email Preview</label>
        <div class='field-body'>
          <code
            bind={{
              innerText: vm.previewEmail.pipe(map((email) => email ?? '')),
            }}
          >
          </code>
        </div>
      </div>
      <div class='field'>
        <div class='control'>
          <label for='can-discord-dm' class='checkbox'>
            <input
              id='can-discord-dm'
              type='checkbox'
              class='checkbox'
              immediateBind={{ checked: canDiscordDm }}
              events={{ change: events.canDiscordDmChanged }}
            />{' '}
            <span>Can we DM you on Discord?</span>
          </label>
          <p class='help'>
            We don't expect to use this just yet, but may be helpful for future
            (low volume) ideas, and you can change this preference at any time.
          </p>
        </div>
      </div>
      <div class='field' classBind={{ 'is-hidden': canNotDiscordDm }}>
        <label for='discord-handle' class='label'>
          Discord Handle
        </label>
      </div>
      <div
        class='field has-addons'
        classBind={{ 'is-hidden': canNotDiscordDm }}
      >
        <div class='control'>
          <a class='button is-static'>@</a>
        </div>
        <div class='control is-expanded'>
          <input
            id='discord-handle'
            type='text'
            class='input'
            immediateBind={{ value: discordHandle }}
            events={{ change: events.discordHandleChanged }}
          />
        </div>
      </div>
      <div class='field'>
        <button
          type='submit'
          class='button is-fullwidth'
          classBind={{
            'is-danger': prefsInvalid,
            'is-primary': prefsSavedOrInvalid.pipe(
              map((notReady) => !notReady),
            ),
          }}
          bind={{ disabled: prefsSavedOrInvalid }}
        >
          Save Preferences
        </button>
      </div>
    </form>
  )
}
