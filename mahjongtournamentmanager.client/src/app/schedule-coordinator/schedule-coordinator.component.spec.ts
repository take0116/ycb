import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScheduleCoordinatorComponent } from './schedule-coordinator.component';

describe('ScheduleCoordinatorComponent', () => {
  let component: ScheduleCoordinatorComponent;
  let fixture: ComponentFixture<ScheduleCoordinatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScheduleCoordinatorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ScheduleCoordinatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
