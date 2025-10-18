import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrackingOrdine } from './tracking-ordine';

describe('TrackingOrdine', () => {
  let component: TrackingOrdine;
  let fixture: ComponentFixture<TrackingOrdine>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrackingOrdine]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TrackingOrdine);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
