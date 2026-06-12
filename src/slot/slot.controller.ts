import {
  BadRequestException,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { SlotService } from './slot.service';
import { GetSlotsQueryDto } from './dto/get-slots-query.dto';

@Controller('doctor')
export class SlotController {
  constructor(private readonly slotService: SlotService) {}

  /**
   * GET /doctor/:doctorId/slots?date=2026-06-20&slotDuration=15
   *
   * Public endpoint — no auth required.
   * Patients can browse available slots for any doctor on a given date.
   */
  @Get(':doctorId/slots')
  getSlots(
    @Param(
      'doctorId',
      new ParseIntPipe({
        exceptionFactory: () =>
          new BadRequestException('Doctor ID must be a valid integer'),
      }),
    )
    doctorId: number,
    @Query() query: GetSlotsQueryDto,
  ) {
    const slotDuration = query.slotDuration ?? 30;
    return this.slotService.getAvailableSlots(doctorId, query.date, slotDuration, query.timezone);
  }
}
