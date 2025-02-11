import {
  AuthenticatorTransportFuture,
  CredentialDeviceType,
} from '@simplewebauthn/browser'
import {
  ComponentContext,
  Fragment,
  jsx,
  ObservableEvent,
} from '@worldmaker/butterfloat'
import { PasskeyVm } from './vm.ts'
import { map, NEVER } from 'rxjs'
import { takeUntil } from 'rxjs'
import { filter } from 'rxjs'

export interface KeyProps {
  vm: PasskeyVm
}

export interface KeyEvents {
  nickNameChanged: ObservableEvent<InputEvent>
  delete: ObservableEvent<MouseEvent>
  save: ObservableEvent<MouseEvent>
}

function BackedUp({ backedUp }: { backedUp: boolean }) {
  return (
    <span class={`tag ${backedUp ? 'is-success' : 'is-danger'}`}>
      {backedUp ? 'Backed Up' : 'Not Backed Up'}
    </span>
  )
}

function DeviceType({ deviceType }: { deviceType: CredentialDeviceType }) {
  switch (deviceType) {
    case 'multiDevice':
      return <span class='tag is-success'>Multi-Device</span>
    case 'singleDevice':
      return <span class='tag is-warning'>Single Device</span>
    default:
      return <span class='tag is-info'>{deviceType}</span>
  }
}

function Transport({ transport }: { transport: AuthenticatorTransportFuture }) {
  switch (transport) {
    case 'ble':
      return <span class='tag is-info'>Bluetooth</span>
    case 'cable':
      return <span class='tag is-info'>Cable</span>
    case 'nfc':
      return <span class='tag is-info'>NFC</span>
    case 'usb':
      return <span class='tag is-info'>USB</span>
    case 'internal':
      return <span class='tag is-info'>Internal</span>
    case 'hybrid':
      return <span class='tag is-info'>Hybrid</span>
    case 'smart-card':
      return <span class='tag is-info'>Smart Card</span>
    default:
      return <span class='tag is-info'>{transport}</span>
  }
}

interface AdminButtonProps {
  vm: PasskeyVm
}

interface AdminButtonEvents {
  adminToggled: ObservableEvent<MouseEvent>
}

function AdminButton(
  { vm }: AdminButtonProps,
  { bindEffect, events }: ComponentContext<AdminButtonEvents>,
) {
  if (vm.admin) {
    bindEffect(events.adminToggled, () => vm.toggleAdmin())
    return (
      <button
        class='button is-small'
        classBind={{
          'is-danger': vm.passkey.pipe(
            map((passkey) => passkey.admin ?? false),
          ),
          'is-warning': vm.passkey.pipe(map((passkey) => !passkey.admin)),
        }}
        bind={{
          disabled: vm.lastAdminKey,
          innerText: vm.passkey.pipe(
            map((passkey) => passkey.admin ? 'Remove Admin' : 'Enable Admin'),
          ),
        }}
        events={{ click: events.adminToggled }}
      />
    )
  }
  return <></>
}

export function Key(
  { vm }: KeyProps,
  { bindImmediateEffect, events }: ComponentContext<KeyEvents>,
) {
  // most passkey fields are static for now in the lifetime of a VM
  const passkey = vm.basePasskey

  bindImmediateEffect(
    events.nickNameChanged,
    (event) => vm.updateNickname((event.target as HTMLInputElement).value),
  )
  // the takeUntil here is a simple dumb way to remove this entire component from display via completion
  bindImmediateEffect(events.delete.pipe(takeUntil(vm.deleted.pipe(filter(deleted => deleted)))), (_) => vm.delete())
  bindImmediateEffect(events.save, (_) => vm.save())

  return (
    <div class='media'>
      <div class='media-left'>
        <span class='icon is-large has-text-link'>
          <i class='fa-duotone fa-solid fa-key'></i>
        </span>
      </div>
      <div class='media-content'>
      <div><strong>{passkey.id}</strong></div>
      <span class='tags'>
          {vm.session.passkeyId === passkey.id
            ? <span class='tag is-primary'>Current Login</span>
            : ''}
          <BackedUp backedUp={passkey.backedUp} />
          <DeviceType deviceType={passkey.deviceType} />
          {passkey.transports?.map((transport) => (
            <Transport transport={transport} />
          ))}
        </span>
      <label class='label'>Nickname/Comments</label>
      <input
        class='input'
        type='text'
        value={passkey.nickname ?? ''}
        events={{ change: events.nickNameChanged }}
      />
      <div class='level'>
        <AdminButton vm={vm} />
        <button
          class='button is-small'
          classBind={{ 'is-primary': vm.unsaved }}
          bind={{ disabled: vm.unsaved.pipe(map((unsaved) => !unsaved)) }}
          events={{ click: events.save }}
        >
          Save
        </button>
      </div>
    </div>
    <div class='media-right'>
      <button
          class='button is-small'
          classBind={{
            'is-danger': vm.deleted,
            'is-warning': vm.deleted.pipe(map((deleted) => !deleted)),
          }}
          bind={{ disabled: vm.lastKey }}
          events={{ click: events.delete }}
        >
          Delete
        </button>
    </div>
  </div>
  )
}
