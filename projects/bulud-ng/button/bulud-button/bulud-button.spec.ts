import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BuludButton } from './bulud-button';

describe('BuludButton', () => {
  let component: BuludButton;
  let fixture: ComponentFixture<BuludButton>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BuludButton]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BuludButton);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
