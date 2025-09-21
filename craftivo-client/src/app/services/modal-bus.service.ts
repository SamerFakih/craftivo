import { Injectable, signal } from '@angular/core';

export type ModalBusEvent =
  | { type: 'open-project-create' }
  | { type: 'open-invoice-create' }
  | { type: 'open-task-create' }
  | { type: 'open-time-manual' }
  | { type: 'open-team-invite' };

@Injectable({ providedIn: 'root' })
export class ModalBusService {
  // simple broadcast using a signal updated with a new object reference each emit
  private _event = signal<ModalBusEvent | null>(null);
  readonly event = this._event.asReadonly();

  emit(e: ModalBusEvent) {
    this._event.set(e); // consumers can switch on e.type
    // immediately clear (microtask) to avoid stale equality checks
    queueMicrotask(() => this._event.set(null));
  }
}
