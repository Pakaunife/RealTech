import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SicurezzaPagamenti } from './sicurezza-pagamenti';

describe('SicurezzaPagamenti', () => {
  let component: SicurezzaPagamenti;
  let fixture: ComponentFixture<SicurezzaPagamenti>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SicurezzaPagamenti]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SicurezzaPagamenti);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
