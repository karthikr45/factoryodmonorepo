import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { AttendanceService } from './attendance.service';

@ApiTags('attendance')
@Controller('attendance')
export class AttendanceController {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(private readonly attendanceService: AttendanceService) {}
}
