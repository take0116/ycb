import { Component, OnInit, OnChanges, Input, Output, EventEmitter, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

interface Availability {
  id: number;
  dateTime: Date | null;
  time: string | null;
  userId: string;
  userName: string;
}

interface StructuredAvailability {
  date: Date;
  slots: {
    time: string;
    participants: { [userId: string]: boolean };
  }[];
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
  @Output() close = new EventEmitter<boolean>();

  availabilities: Availability[] = [];
  timeSlots = ['20:00', '21:00', '22:00', '23:00'];
  currentUserId: string | null = null;

  // This section for "Time-only" selection is kept as per request.
  selectedTimes: Set<string> = new Set(); 
  
  // This will now be the primary data source for the new calendar table.
  structuredAvailabilities: StructuredAvailability[] = [];

  detailsOpen = false;

  constructor(private http: HttpClient, private authService: AuthService, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.currentUserId = this.authService.getUserId();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['roundInfo'] && this.roundInfo) {
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

  generateStructuredData(): void {
    const structuredData: StructuredAvailability[] = [];
    if (!this.schedulingStartDate) return;

    for (let i = 0; i < 14; i++) {
      const date = new Date(this.schedulingStartDate);
      date.setDate(date.getDate() + i);
      
      const daySlots = this.timeSlots.map(time => {
        const participants: { [userId: string]: boolean } = {};
        this.players.forEach(p => participants[p.id] = false);
        return { time, participants };
      });

      structuredData.push({ date, slots: daySlots });
    }

    this.availabilities.forEach(avail => {
      if (avail.dateTime) {
        const availDate = new Date(avail.dateTime);
        const dateStr = availDate.toISOString().split('T')[0];
        const timeStr = ('0' + availDate.getUTCHours()).slice(-2) + ':' + ('0' + availDate.getUTCMinutes()).slice(-2);

        const dayData = structuredData.find(d => d.date.toISOString().split('T')[0] === dateStr);
        const slotData = dayData?.slots.find(s => s.time === timeStr);

        if (slotData) {
          slotData.participants[avail.userId] = true;
        }
      }
    });
    
    this.structuredAvailabilities = structuredData;
  }

  fetchAvailabilities(): void {
    if (!this.roundInfo) return;
    this.http.get<Availability[]>(`${this.apiUrl}/${this.roundInfo.matchId}/availabilities`)
      .subscribe(data => {
        this.availabilities = data;
        this.updateTimeOnlySelection();
        this.generateStructuredData();
        this.cdr.detectChanges();
      });
  }

  updateTimeOnlySelection(): void {
    const newSelectedTimes = new Set<string>();
    if (!this.currentUserId) return;
    this.availabilities
      .filter(a => a.userId === this.currentUserId && a.time)
      .forEach(a => {
        if (a.time) {
          const timeParts = a.time.split(':');
          const formattedTime = `${timeParts[0]}:${timeParts[1]}`;
          newSelectedTimes.add(formattedTime);
        }
      });
    this.selectedTimes = newSelectedTimes;
  }

  isAvailable(date: Date, time: string, userId: string): boolean {
    const dayData = this.structuredAvailabilities.find(d => d.date.toDateString() === date.toDateString());
    const slotData = dayData?.slots.find(s => s.time === time);
    return slotData?.participants[userId] || false;
  }

  toggleAvailability(date: Date, time: string): void {
    if (!this.currentUserId) return;
    const dayData = this.structuredAvailabilities.find(d => d.date.toDateString() === date.toDateString());
    const slotData = dayData?.slots.find(s => s.time === time);
    if (slotData) {
      slotData.participants[this.currentUserId] = !slotData.participants[this.currentUserId];
    }
  }

  getAvailabilityCount(date: Date, time: string): number {
    const dayData = this.structuredAvailabilities.find(d => d.date.toDateString() === date.toDateString());
    const slotData = dayData?.slots.find(s => s.time === time);
    if (!slotData) return 0;
    return Object.values(slotData.participants).filter(isSet => isSet).length;
  }

  saveAvailabilities(): void {
    if (!this.roundInfo || !this.currentUserId) return;

    const dateTimesToSave: string[] = [];
    this.structuredAvailabilities.forEach(day => {
      day.slots.forEach(slot => {
        if (slot.participants[this.currentUserId!]) {
          const [hours, minutes] = slot.time.split(':').map(Number);
          // Create date in UTC to avoid timezone issues.
          const dateTime = new Date(Date.UTC(day.date.getFullYear(), day.date.getMonth(), day.date.getDate(), hours, minutes));
          dateTimesToSave.push(dateTime.toISOString());
        }
      });
    });

    const payload = {
      // Send the state of the time-only checkboxes
      times: Array.from(this.selectedTimes),
      // Send the final state of the calendar grid
      dateTimes: dateTimesToSave
    };

    this.http.post(`${this.apiUrl}/${this.roundInfo.matchId}/availabilities/batch`, payload)
      .subscribe(() => {
        this.closeDialog(true); // Emit true on successful save
      });
  }

  closeDialog(saved: boolean = false): void {
    this.close.emit(saved);
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

  private japaneseDays = ['日', '月', '火', '水', '木', '金', '土'];
  formatDateWithJapaneseDay(date: Date): string {
    if (!date) return '';
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dayOfWeek = this.japaneseDays[date.getDay()];
    return `${month}/${day}(${dayOfWeek})`;
  }

  // Methods for "Time-only" section
  isTimeSlotSelected(time: string): boolean {
    return this.selectedTimes.has(time);
  }

  toggleTimeSlot(time: string): void {
    if (!this.currentUserId) return;

    const newSelectedTimes = new Set(this.selectedTimes);
    const isAdding = !newSelectedTimes.has(time);

    if (isAdding) {
      newSelectedTimes.add(time);
    } else {
      newSelectedTimes.delete(time);
    }
    this.selectedTimes = newSelectedTimes;

    // Update the calendar grid based on the time-only selection
    this.structuredAvailabilities.forEach(day => {
      const slot = day.slots.find(s => s.time === time);
      if (slot) {
        slot.participants[this.currentUserId!] = isAdding;
      }
    });
    
    this.cdr.detectChanges();
  }
}
