import { Module } from '@nestjs/common';
import { TrackingEventService } from './tracking-event.service';
import { TrackingEventController } from './tracking-event.controller';

@Module({
  providers: [TrackingEventService],
  controllers: [TrackingEventController],
})
export class TrackingEventModule {}
