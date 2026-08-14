import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BuludBadge } from './bulud-badge';

@Component({
  standalone: true,
  imports: [BuludBadge],
  template: `
    <bulud-badge
      variant="success"
      dot
      dismissible
      (dismissed)="dismissed = true"
    >
      Published
    </bulud-badge>
  `,
})
class HostComponent {
  dismissed = false;
}

describe('BuludBadge', () => {
  let fixture: ComponentFixture<HostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  it('renders projected content and a status dot', () => {
    expect(fixture.nativeElement.textContent).toContain('Published');
    expect(fixture.nativeElement.querySelector('.bulud-badge__dot')).not.toBeNull();
  });

  it('emits when dismissed', () => {
    fixture.nativeElement.querySelector('.bulud-badge__dismiss').click();
    expect(fixture.componentInstance.dismissed).toBeTrue();
  });
});
