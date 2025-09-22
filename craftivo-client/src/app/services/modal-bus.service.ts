import { Injectable, signal } from '@angular/core';

export type ModalBusEvent =
  | { type: 'open-project-create' }
  | { type: 'open-invoice-create' }
  | { type: 'open-task-create' }
  | { type: 'open-time-manual' }
  | { type: 'open-team-invite' };

@Injectable({ providedIn: 'root' })
export class ModalBusService {
  private _event = signal<ModalBusEvent | null>(null);
  readonly event = this._event.asReadonly();

  emit(e: ModalBusEvent) {
    this._event.set(e);
    queueMicrotask(() => this._event.set(null));
  }
}
