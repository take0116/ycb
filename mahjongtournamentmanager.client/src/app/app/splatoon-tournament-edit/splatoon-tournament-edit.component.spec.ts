import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SplatoonTournamentEditComponent } from './splatoon-tournament-edit.component';

describe('SplatoonTournamentEditComponent', () => {
  let component: SplatoonTournamentEditComponent;
  let fixture: ComponentFixture<SplatoonTournamentEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SplatoonTournamentEditComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SplatoonTournamentEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
