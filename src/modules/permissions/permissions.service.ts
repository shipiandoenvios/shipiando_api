import { Injectable } from '@nestjs/common';
import {
  Policy,
  loadPolicies,
  savePolicies,
} from '../../common/permissions/abac.util';

@Injectable()
export class PermissionsService {
  list(): Policy[] {
    return loadPolicies();
  }
  save(policies: Policy[]) {
    savePolicies(policies);
    return policies;
  }
}
