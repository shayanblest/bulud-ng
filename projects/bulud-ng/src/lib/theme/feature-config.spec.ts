import {
  BULUD_ACCOUNT_CARD_CONFIG,
  BULUD_FILE_UPLOAD_CONFIG,
  BULUD_DROPDOWN_DATA_CONFIG,
  BULUD_CHART_ENGINE_CONFIG,
} from '../../public-api';
import { BULUD_ACCOUNT_CARD_CONFIG as account } from 'bulud-ng/account-card';
import { BULUD_FILE_UPLOAD_CONFIG as upload } from 'bulud-ng/file-upload';
import { BULUD_DROPDOWN_DATA_CONFIG as dropdown } from 'bulud-ng/dropdown';
import { BULUD_CHART_ENGINE_CONFIG as chart } from 'bulud-ng/chart-engine';
describe('configuration-only root exports', () => {
  it('shares token identity with every feature entry', () => {
    expect(account).toBe(BULUD_ACCOUNT_CARD_CONFIG);
    expect(upload).toBe(BULUD_FILE_UPLOAD_CONFIG);
    expect(dropdown).toBe(BULUD_DROPDOWN_DATA_CONFIG);
    expect(chart).toBe(BULUD_CHART_ENGINE_CONFIG);
  });
});
