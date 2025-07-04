import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TournamentEntryComponent } from './tournament-entry.component';

describe('TournamentEntryComponent', () => {
  let component: TournamentEntryComponent;
  let fixture: ComponentFixture<TournamentEntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TournamentEntryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TournamentEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
