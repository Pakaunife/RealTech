import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LavoraConNoi } from './lavora-con-noi';

describe('LavoraConNoi', () => {
  let component: LavoraConNoi;
  let fixture: ComponentFixture<LavoraConNoi>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LavoraConNoi]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LavoraConNoi);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
