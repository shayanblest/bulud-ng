import { Directive, input } from '@angular/core';
@Directive({
  selector: '[buludTourTarget]',
  host: { '[attr.id]': 'prefix()+key()' },
})
export class BuludTourTarget {
  readonly key = input.required<string>({ alias: 'buludTourTarget' });
  readonly prefix = input('tour-');
}
