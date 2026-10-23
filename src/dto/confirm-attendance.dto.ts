export class ConfirmAttendanceDto {
  readonly name?: string;
  readonly surname?: string;
  readonly guess?: string;
  readonly details?: { events: string; guests: number; dietary?: string; song?: string; attending: boolean };
}
