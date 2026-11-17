import {TestBed} from '@angular/core/testing';
import {computed,signal} from '@angular/core';
import {BULUD_RUNTIME_CONFIG,BuludRuntime} from './runtime';
describe('BuludRuntime consuming-project translator compatibility',()=>{
 it('tracks language revisions without passing an empty key to a strict translator',()=>{
  const language=signal('en'), revision=signal(0),translate=jasmine.createSpy('translate').and.callFake((key:string)=>{if(!key)throw new Error('Parameter key required');return key;});
  TestBed.configureTestingModule({providers:[{provide:BULUD_RUNTIME_CONFIG,useValue:{language,translationRevision:revision,translate}}]});
  const runtime=TestBed.inject(BuludRuntime),text=computed(()=>runtime.text('','Fallback '+language()));
  expect(text()).toBe('Fallback en');expect(translate).not.toHaveBeenCalled();
  language.set('fa');revision.set(1);expect(text()).toBe('Fallback fa');expect(translate).not.toHaveBeenCalled();
  expect(runtime.text('unknown','Project fallback')).toBe('Project fallback');expect(translate).toHaveBeenCalledOnceWith('unknown',undefined);
 });
});
