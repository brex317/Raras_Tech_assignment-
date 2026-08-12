import { Component, Input, OnInit, forwardRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { OrganizationUnitService } from '../../../core/services/organization-unit.service';
import { OrganizationUnitTreeDto } from '../../../core/models/models';

@Component({
  selector: 'app-org-unit-selector',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatSelectModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => OrgUnitSelectorComponent),
      multi: true
    }
  ],
  template: `
    <mat-form-field appearance="outline" class="w-full">
      <mat-label>{{ label || 'Organization Unit' }}</mat-label>
      <mat-select [formControl]="selectControl" (selectionChange)="onSelectionChange($event.value)" [required]="required">
        <mat-option *ngIf="showNone" [value]="null">None</mat-option>
        <mat-option *ngFor="let option of flattenedOptions" [value]="option.id" [disabled]="!option.isActive && disableInactive">
          <span [style.padding-left.px]="option.level * 16">
            {{ option.level > 0 ? '↳ ' : '' }}{{ option.name }}
          </span>
        </mat-option>
      </mat-select>
      <mat-error *ngIf="selectControl.invalid && selectControl.touched">
        Organization unit is required.
      </mat-error>
    </mat-form-field>
  `
})
export class OrgUnitSelectorComponent implements OnInit, ControlValueAccessor {
  private readonly orgUnitService = inject(OrganizationUnitService);

  @Input() label?: string;
  @Input() required = false;
  @Input() showNone = false;
  @Input() disableInactive = true;

  selectControl = new FormControl<string | null>(null);
  flattenedOptions: Array<{ id: string; name: string; level: number; isActive: boolean }> = [];

  onChange: any = () => {};
  onTouch: any = () => {};

  ngOnInit(): void {
    this.orgUnitService.getTree().subscribe(tree => {
      this.flattenedOptions = [];
      this.flattenTree(tree);
    });
  }

  private flattenTree(nodes: OrganizationUnitTreeDto[]): void {
    nodes.forEach(node => {
      this.flattenedOptions.push({
        id: node.id,
        name: node.name,
        level: node.level,
        isActive: node.isActive
      });
      if (node.children && node.children.length > 0) {
        this.flattenTree(node.children);
      }
    });
  }

  // ControlValueAccessor methods
  writeValue(value: string | null): void {
    this.selectControl.setValue(value, { emitEvent: false });
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouch = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    if (isDisabled) {
      this.selectControl.disable();
    } else {
      this.selectControl.enable();
    }
  }

  onSelectionChange(value: string | null): void {
    this.onChange(value);
    this.onTouch();
  }
}
