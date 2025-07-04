import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SplatoonTournamentDetailComponent } from './splatoon-tournament-detail.component';

describe('SplatoonTournamentDetailComponent', () => {
  let component: SplatoonTournamentDetailComponent;
  let fixture: ComponentFixture<SplatoonTournamentDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SplatoonTournamentDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SplatoonTournamentDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
