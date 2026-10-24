import { Component, ChangeDetectionStrategy } from '@angular/core';
import {
  BuludNumberPipe,
  BuludRelativeTimePipe,
  BuludDurationPipe,
  BuludTruncatePipe,
  BuludFallbackPipe,
  BuludDateTimePipe,
  BuludMaskEmailPipe,
  BuludFileExtensionPipe,
  BuludPascalCasePipe,
  BuludCardNumberPipe,
  BuludIsImagePipe,
  BuludTimestampPipe,
  BuludUnixTimeConverterPipe,
} from 'bulud-ng/utilities';

import { FeatureFrame } from './frame';
@Component({
  imports: [
    FeatureFrame,
    BuludNumberPipe,
    BuludRelativeTimePipe,
    BuludDurationPipe,
    BuludTruncatePipe,
    BuludFallbackPipe,
    BuludDateTimePipe,
    BuludMaskEmailPipe,
    BuludFileExtensionPipe,
    BuludPascalCasePipe,
    BuludCardNumberPipe,
    BuludIsImagePipe,
    BuludTimestampPipe,
    BuludUnixTimeConverterPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<feature-frame
    title="utilities · پایپ‌ها و ابزارهای عمومی"
    [code]="source"
    description="پایپ‌ها و ابزارهای عمومی · Standalone, Angour light/dark, RTL/LTR"
    api="Pure standalone pipes; buludNumber(value,locale,immutable Intl options); buludRelativeTime(valueSeconds,nowSeconds,locale,numeric) has no hidden timer; duration uses integer seconds; truncate counts Unicode code points; fallback preserves 0/false. Existing date/file/string helpers remain public. Use Angular Async/Date/Json/Slice pipes directly for their standard contracts."
    entry="bulud-ng/utilities"
    ><p>Number: {{ 1234567.89 | buludNumber: 'fa-IR' }}</p>
    <p>Currency: {{ 1234.5 | buludNumber: 'en-US' : currency }}</p>
    <p>Percent: {{ 0.42 | buludNumber: 'fa-IR' : percent }}</p>
    <p>Relative: {{ now - 3600 | buludRelativeTime: now : 'fa' }}</p>
    <p>Duration: {{ 3661 | buludDuration }}</p>
    <p>Truncate: {{ 'A long example sentence' | buludTruncate: 10 }}</p>
    <p>Fallback: {{ '' | buludFallback }}</p>
    <p>Date: {{ now | buludDateTime: true : 'fa' : 'UTC' }}</p>
    <p>Masked: {{ 'example@domain.com' | buludMaskEmail }}</p>
    <p>
      Extension: {{ 'image.png' | buludFileExtension }} · Image:
      {{ 'image.png' | buludIsImage }}
    </p>
    <p>
      Case: {{ 'example_name' | buludPascalCase }} · Card:
      {{ '1234567812345678' | buludCardNumber }}
    </p>
    <p>Timestamp: {{ '2026-01-01' | buludTimestamp }}</p>
    <p>
      Period: {{ now | buludUnixTimeConverter: 'monthly' : 'en' : 'UTC' }}
    </p></feature-frame
  >`,
})
export class PageUtilities {
  readonly source =
    "import {Component,ChangeDetectionStrategy,signal,computed,inject} from '@angular/core';\nimport {BuludNumberPipe,BuludRelativeTimePipe,BuludDurationPipe,BuludTruncatePipe,BuludFallbackPipe,BuludDateTimePipe,BuludMaskEmailPipe,BuludFileExtensionPipe,BuludPascalCasePipe,BuludCardNumberPipe,BuludIsImagePipe,BuludTimestampPipe,BuludUnixTimeConverterPipe} from 'bulud-ng/utilities';\n\n@Component({selector:'example-utilities',imports:[BuludNumberPipe,BuludRelativeTimePipe,BuludDurationPipe,BuludTruncatePipe,BuludFallbackPipe,BuludDateTimePipe,BuludMaskEmailPipe,BuludFileExtensionPipe,BuludPascalCasePipe,BuludCardNumberPipe,BuludIsImagePipe,BuludTimestampPipe,BuludUnixTimeConverterPipe],changeDetection:ChangeDetectionStrategy.OnPush,template:`<p>Number: {{1234567.89|buludNumber:'fa-IR'}}</p><p>Currency: {{1234.5|buludNumber:'en-US':currency}}</p><p>Percent: {{0.42|buludNumber:'fa-IR':percent}}</p><p>Relative: {{now-3600|buludRelativeTime:now:'fa'}}</p><p>Duration: {{3661|buludDuration}}</p><p>Truncate: {{'A long example sentence'|buludTruncate:10}}</p><p>Fallback: {{''|buludFallback}}</p><p>Date: {{now|buludDateTime:true:'fa':'UTC'}}</p><p>Masked: {{'example@domain.com'|buludMaskEmail}}</p><p>Extension: {{'image.png'|buludFileExtension}} · Image: {{'image.png'|buludIsImage}}</p><p>Case: {{'example_name'|buludPascalCase}} · Card: {{'1234567812345678'|buludCardNumber}}</p><p>Timestamp: {{'2026-01-01'|buludTimestamp}}</p><p>Period: {{now|buludUnixTimeConverter:'monthly':'en':'UTC'}}</p>`})\nexport class Example {readonly now=Math.floor(Date.now()/1000);readonly currency:Intl.NumberFormatOptions={style:'currency',currency:'USD'};readonly percent:Intl.NumberFormatOptions={style:'percent'};}";
  readonly now = Math.floor(Date.now() / 1000);
  readonly currency: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: 'USD',
  };
  readonly percent: Intl.NumberFormatOptions = { style: 'percent' };
}
