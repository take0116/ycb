import { Component, OnInit, OnChanges, Input, Output, EventEmitter, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../auth.service';
import { environment } from '../../environments/environment';

interface Availability {
  id: number;
  dateTime: Date | null;
  time: string | null;
  userId: string;
  userName: string;
}

@Component({
  selector: 'app-schedule-coordinator',
  templateUrl: './schedule-coordinator.component.html',
  styleUrls: ['./schedule-coordinator.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class ScheduleCoordinatorComponent implements OnInit, OnChanges {
  private apiUrl = `${environment.apiUrl}/api/TournamentSettings`;
  @Input() roundInfo: { matchId: number, round: string, schedulingStartDate: string } | null = null;
  @Input() players: { id: string, name: string }[] = [];
  @Output() close = new EventEmitter<void>();

  availabilities: Availability[] = [];
  timeSlots = ['20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00'];
  currentUserId: string | null = null;

  selectedTimes: Set<string> = new Set();
  selectedDateTimes: Set<string> = new Set();
  detailsOpen = false;

  week1Dates: Date[] = [];
  week2Dates: Date[] = [];

  constructor(private http: HttpClient, private authService: AuthService, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.currentUserId = this.authService.getUserId();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['roundInfo'] && this.roundInfo) {
      this.generateDates();
      this.fetchAvailabilities();
    }
  }

  get schedulingStartDate(): Date | null {
    return this.roundInfo ? new Date(this.roundInfo.schedulingStartDate) : null;
  }

  get schedulingEndDate(): Date | null {
    if (!this.schedulingStartDate) return null;
    const endDate = new Date(this.schedulingStartDate);
    endDate.setDate(endDate.getDate() + 13); // 2 weeks
    return endDate;
  }

  generateDates(): void {
    if (!this.schedulingStartDate) return;
    this.week1Dates = [];
    this.week2Dates = [];
    for (let i = 0; i < 14; i++) {
      const date = new Date(this.schedulingStartDate);
      date.setDate(date.getDate() + i);
      if (i < 7) {
        this.week1Dates.push(date);
      } else {
        this.week2Dates.push(date);
      }
    }
  }

  fetchAvailabilities(): void {
    if (!this.roundInfo) return;
    this.http.get<Availability[]>(`${this.apiUrl}/${this.roundInfo.matchId}/availabilities`)
      .subscribe(data => {
        this.availabilities = data;
        this.updateSelectionSets();
        this.cdr.detectChanges();
      });
  }

  updateSelectionSets(): void {
    const newSelectedTimes = new Set<string>();
    const newSelectedDateTimes = new Set<string>();
    if (!this.currentUserId) return;

    this.availabilities
      .filter(a => a.userId === this.currentUserId)
      .forEach(a => {
        if (a.time) {
          // Format time to HH:mm
          const timeParts = a.time.split(':');
          const formattedTime = `${timeParts[0]}:${timeParts[1]}`;
          newSelectedTimes.add(formattedTime);
        }
        if (a.dateTime) {
          newSelectedDateTimes.add(new Date(a.dateTime).toISOString());
        }
      });
    this.selectedTimes = newSelectedTimes;
    this.selectedDateTimes = newSelectedDateTimes;
  }

  isTimeSlotSelected(time: string): boolean {
    return this.selectedTimes.has(time);
  }

  toggleTimeSlot(time: string): void {
    const newSelectedTimes = new Set(this.selectedTimes);
    if (newSelectedTimes.has(time)) {
      newSelectedTimes.delete(time);
    } else {
      newSelectedTimes.add(time);
    }
    this.selectedTimes = newSelectedTimes;
    this.cdr.detectChanges();
  }

  isDateTimeSelected(date: Date, time: string): boolean {
    const dateTime = new Date(date);
    const [hours, minutes] = time.split(':');
    dateTime.setHours(parseInt(hours), parseInt(minutes));
    return this.selectedDateTimes.has(dateTime.toISOString());
  }

  toggleDateTime(date: Date, time: string): void {
    const dateTime = new Date(date);
    const [hours, minutes] = time.split(':');
    dateTime.setHours(parseInt(hours), parseInt(minutes));
    const isoString = dateTime.toISOString();

    const newSelectedDateTimes = new Set(this.selectedDateTimes);
    if (newSelectedDateTimes.has(isoString)) {
      newSelectedDateTimes.delete(isoString);
    } else {
      newSelectedDateTimes.add(isoString);
    }
    this.selectedDateTimes = newSelectedDateTimes;
    this.cdr.detectChanges();
  }

  getAvailabilityCount(date: Date, time: string): number {
    const dateTime = new Date(date);
    const [hours, minutes] = time.split(':');
    dateTime.setHours(parseInt(hours), parseInt(minutes));
    const isoString = dateTime.toISOString();

    return this.availabilities.filter(a => (a.dateTime && new Date(a.dateTime).toISOString() === isoString) || (a.time && a.time.startsWith(time))).length;
  }

  saveAvailabilities(): void {
    if (!this.roundInfo) return;

    const payload = {
      times: Array.from(this.selectedTimes),
      dateTimes: Array.from(this.selectedDateTimes)
    };

    this.http.post(`${this.apiUrl}/${this.roundInfo.matchId}/availabilities/batch`, payload)
      .subscribe(() => {
        this.fetchAvailabilities();
        this.closeDialog();
      });
  }

  closeDialog(): void {
    this.close.emit();
  }

  toggleDetails(): void {
    this.detailsOpen = !this.detailsOpen;
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  }
}
