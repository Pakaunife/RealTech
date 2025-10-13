import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DettagliOrdine } from './dettagli-ordine';

describe('DettagliOrdine', () => {
  let component: DettagliOrdine;
  let fixture: ComponentFixture<DettagliOrdine>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DettagliOrdine]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DettagliOrdine);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
