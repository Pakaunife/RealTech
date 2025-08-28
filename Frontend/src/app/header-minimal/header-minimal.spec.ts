import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeaderMinimal } from './header-minimal';

describe('HeaderMinimal', () => {
  let component: HeaderMinimal;
  let fixture: ComponentFixture<HeaderMinimal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderMinimal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HeaderMinimal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
