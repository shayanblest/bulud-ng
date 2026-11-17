import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { BuludRuntime } from 'bulud-ng/runtime';
import {
  BULUD_SHARED_UI_CONFIG,
  buludSharedUiStyles,
  BuludSharedUiTheme,
} from 'bulud-ng';

export interface BuludAccountCardState {
  readonly disabled_at?: unknown;
}
import { BULUD_ACCOUNT_CARD_CONFIG } from 'bulud-ng';
export { BULUD_ACCOUNT_CARD_CONFIG } from 'bulud-ng';
export type { BuludAccountCardConfig } from 'bulud-ng';
@Component({
  selector: 'bulud-account-card',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: '../account-card.css',
  host: {
    '[style]': 'styles()',
    '[class.bulud-standalone]': 'true',
  },
  template:
    '<div (click)="changeRoute(accountId())" (keydown.enter)="changeRoute(accountId())" (keydown.space)="$event.preventDefault();changeRoute(accountId())" [attr.tabindex]="showDetails()?0:null" [attr.role]="showDetails()?\'button\':null" [id]="parentSection() + \'_\' + (accountType()?.toLowerCase() ?? null) + \'_details_card_link\'"\n     class="platform-card"   [class.wallet-card]="!accountType()">\n  <div [class.bulud-padding-t-4]="!account()?.disabled_at" [class.bulud-padding-t-8]="account()?.disabled_at"\n       [class.head]="accountType()"\n       class="flex flex-col justify-between items-center font-normal bulud-color-on-accent  grow text-center relative">\n    @if (account()?.disabled_at){\n      <div class="top-0 bulud-background-negative text-center bulud-padding-y-2 bulud-color-on-accent border-2 bulud-round-start start-0 end-0 bulud-margin-0 absolute">{{ text(\'Disabled\') }}</div>\n    }\n    @if (accountType()){\n        <div class="font-light">\n          @if (accountType()){\n            <span  class="bulud-type-5">{{ accountType() }} {{ accountName() }}</span>\n          }\n          <div class="bulud-margin-y-4">\n            <p class="bulud-type-2 bulud-margin-t-1" dir="ltr">\n              $ {{ balance() | number:\'1.0-2\' }}\n            </p>\n          </div>\n        </div>\n    }\n    @if(!accountType()){\n        <span class="bulud-type-5">{{text(\'WalletITBFX\')}}</span>\n        <span class="bulud-type-7 bulud-margin-t-4">{{text(\'ACCOUNTS.Balance\')}} :</span>\n        <span class="bulud-margin-t-2 bulud-type-2" dir="ltr">\n                $ {{ balance() | number:\'1.0-2\' }}\n          </span>\n        <div class="flex bulud-margin-b-4 gap-2 bulud-margin-t-2">\n          <span class="bulud-type-7 my-auto">{{text(\'WalletNumber\')}}</span>\n          <span class="bulud-type-5">{{ accountId() }}</span>\n        </div>\n    }\n  </div>\n  @if (accountType()){\n    <div  [ngClass]="accountType() | lowercase"\n         class="card-platform {{ cardType() | lowercase }} bulud-padding-x-5 bulud-padding-y-5 bulud-color-on-accent">\n      <div class="bulud-padding-x-5 bulud-card-account-number">\n        <p>{{ text(\'AccountNumber\') }}</p>\n        <p class="font-bold bulud-type-5">{{ accountId() }}</p>\n      </div>\n      <div class="bulud-padding-x-5">\n        <p>\n          {{ text(\'Credit\') }}\n        </p>\n        <p class="bulud-type-5" dir="ltr">\n          $ {{ (credit() || 0) | number:\'1.0-2\' }}\n        </p>\n      </div>\n    </div>\n  }\n</div>\n',
})
export class BuludAccountCard {
  readonly legacyIcons = input(
    inject(BULUD_SHARED_UI_CONFIG).legacyIcons ?? false,
  );
  private readonly config = inject(BULUD_ACCOUNT_CARD_CONFIG);
  private readonly runtime = inject(BuludRuntime);
  protected readonly text = (key: string) =>
    this.runtime.text(
      key,
      (
        {
          Disabled: 'Disabled',
          WalletITBFX: 'Wallet',
          'ACCOUNTS.Balance': 'Balance',
          WalletNumber: 'Wallet number',
          Credit: 'Credit',
          AccountNumber: 'Account number',
        } as Readonly<Record<string, string>>
      )[key] ?? key,
    );
  readonly loading = input(true);
  readonly cardType = input('');
  readonly account = input<BuludAccountCardState>();
  readonly accountType = input<string>();
  readonly accountName = input<string>();
  readonly accountId = input<string>();
  readonly balance = input<number>();
  readonly credit = input<number>();
  readonly showDetails = input(false);
  readonly parentSection = input<string>();
  readonly accountClick = output<string | undefined>();
  private readonly sharedConfig = inject(BULUD_SHARED_UI_CONFIG);
  readonly theme = input<Partial<BuludSharedUiTheme>>();
  protected readonly styles = computed(() =>
    buludSharedUiStyles('account-card', this.sharedConfig, this.theme()),
  );
  protected changeRoute(id: string | undefined): void {
    if (this.showDetails()) {
      this.accountClick.emit(id);
      this.config.navigate?.(this.cardType(), id);
    }
  }
}
