import {
  Component,
  DestroyRef,
  inject,
  provideZonelessChangeDetection,
  signal,
  viewChild,
  ChangeDetectionStrategy,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BuludAccess } from './access';
let destroyed = 0;
@Component({
  selector: 'test-content',
  // eslint-disable-next-line @angular-eslint/prefer-on-push-component-change-detection -- Mutable consumer fixture retained by the official Angular 22 migration.
  changeDetection: ChangeDetectionStrategy.Eager,
  template: '<button>Action</button>',
})
class Content {
  constructor() {
    inject(DestroyRef).onDestroy(() => destroyed++);
  }
}
@Component({
  imports: [BuludAccess, Content],
  // eslint-disable-next-line @angular-eslint/prefer-on-push-component-change-detection -- Mutable consumer fixture retained by the official Angular 22 migration.
  changeDetection: ChangeDetectionStrategy.Eager,
  template: '<test-content *buludAccess="allowed()" />',
})
class Host {
  readonly allowed = signal(false);
  readonly access = viewChild.required(BuludAccess);
}
describe('BuludAccess application-owned policy rendering', () => {
  beforeEach(() => {
    destroyed = 0;
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
  });
  it('starts denied, mounts only allowed content and destroys it on revocation', async () => {
    const f = TestBed.createComponent(Host);
    await f.whenStable();
    expect(f.nativeElement.querySelector('button')).toBeNull();
    f.componentInstance.allowed.set(true);
    await f.whenStable();
    expect(f.nativeElement.querySelector('button').textContent).toBe('Action');
    f.componentInstance.allowed.set(false);
    await f.whenStable();
    expect(f.nativeElement.querySelector('button')).toBeNull();
    expect(destroyed).toBe(1);
  });
  it('recreates allowed content when policy explicitly requests a refresh and cleans up on destruction', async () => {
    const f = TestBed.createComponent(Host);
    f.componentInstance.allowed.set(true);
    await f.whenStable();
    const original = f.nativeElement.querySelector('button');
    f.componentInstance.access().render(true);
    await f.whenStable();
    expect(f.nativeElement.querySelector('button')).not.toBe(original);
    expect(destroyed).toBe(1);
    f.destroy();
    expect(destroyed).toBe(2);
  });
});
