import { PartialType } from '@nestjs/mapped-types';
import { CreateTrackingEventDto } from './create-tracking-event.dto';

export class UpdateTrackingEventDto extends PartialType(
  CreateTrackingEventDto,
) {}
