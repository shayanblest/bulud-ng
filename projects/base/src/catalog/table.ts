import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BuludTable } from 'bulud-ng/table';
import { RouterLink } from '@angular/router';
import { FeatureFrame } from './frame';
@Component({
  imports: [FeatureFrame, BuludTable, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<feature-frame
    title="table · جدول و فیلترها"
    [code]="source"
    description="جدول و فیلترها · Standalone, Angour light/dark, RTL/LTR"
    api="rows, columns, rowKey, pageSize, pagination/filter/sort inputs and queryChange. Project buludTableCell/buludTableDetail; use immutable rows. See linked workflow for full filter/URL integration."
    entry="bulud-ng/table"
    ><bulud-table
      caption="Projects"
      [rows]="rows"
      [columns]="columns"
      [rowKey]="rowKey"
      [pageSize]="2"
    />
    <p>
      For filters, projected details, URL state and server paging:
      <a routerLink="/shared">full table workflow</a>
    </p></feature-frame
  >`,
})
export class PageTable {
  readonly source =
    "import {Component,ChangeDetectionStrategy,signal,computed,inject} from '@angular/core';\nimport {BuludTable} from 'bulud-ng/table';\nimport {RouterLink} from '@angular/router';\n@Component({selector:'example-table',imports:[BuludTable,RouterLink],changeDetection:ChangeDetectionStrategy.OnPush,template:`<bulud-table caption=\"Projects\" [rows]=\"rows\" [columns]=\"columns\" [rowKey]=\"rowKey\" [pageSize]=\"2\"/><p>For filters, projected details, URL state and server paging: <a routerLink=\"/shared\">full table workflow</a></p>`})\nexport class Example {readonly rows=[{id:1,name:'One'},{id:2,name:'Two'},{id:3,name:'Three'}];readonly columns=[{key:'id',heading:'ID',value:(row:{id:number;name:string})=>row.id,sortable:true},{key:'name',heading:'Name',value:(row:{id:number;name:string})=>row.name,sortable:true}];readonly rowKey=(row:{id:number})=>row.id;}";
  readonly rows = [
    { id: 1, name: 'One' },
    { id: 2, name: 'Two' },
    { id: 3, name: 'Three' },
  ];
  readonly columns = [
    {
      key: 'id',
      heading: 'ID',
      value: (row: { id: number; name: string }) => row.id,
      sortable: true,
    },
    {
      key: 'name',
      heading: 'Name',
      value: (row: { id: number; name: string }) => row.name,
      sortable: true,
    },
  ];
  readonly rowKey = (row: { id: number }) => row.id;
}
