import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeaderSemplificato } from './header-semplificato';

describe('HeaderSemplificato', () => {
  let component: HeaderSemplificato;
  let fixture: ComponentFixture<HeaderSemplificato>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderSemplificato]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HeaderSemplificato);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
