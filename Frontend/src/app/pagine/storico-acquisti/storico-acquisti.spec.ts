import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StoricoAcquisti } from './storico-acquisti';

describe('StoricoAcquisti', () => {
  let component: StoricoAcquisti;
  let fixture: ComponentFixture<StoricoAcquisti>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StoricoAcquisti]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StoricoAcquisti);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
