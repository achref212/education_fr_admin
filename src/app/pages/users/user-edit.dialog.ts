import { Component, Inject, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import { AdminUserOut } from '../../core/models/user.model';
import { ApiService } from '../../core/http/api.service';

export interface UserEditData {
  user: AdminUserOut;
}

@Component({
  selector: 'app-user-edit-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatSlideToggleModule,
  ],
  template: `
    <h2 mat-dialog-title>Modifier {{ data.user.email }}</h2>
    <mat-dialog-content>
    <form [formGroup]="form" (ngSubmit)="save()">
      <mat-form-field appearance="outline" class="w100">
        <mat-label>Rôle</mat-label>
        <mat-select formControlName="role">
          <mat-option value="user">user</mat-option>
          <mat-option value="admin">admin</mat-option>
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="outline" class="w100">
        <mat-label>Niveau</mat-label>
        <input matInput formControlName="level" />
      </mat-form-field>
      <div class="row">
        <mat-slide-toggle formControlName="isActive">Compte actif</mat-slide-toggle>
      </div>
    </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" mat-dialog-close>Annuler</button>
      <button
        mat-raised-button
        color="primary"
        type="button"
        (click)="save()"
        [disabled]="form.invalid"
      >
        Enregistrer
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .w100 {
        width: 100%;
        display: block;
        margin-top: 0.5rem;
      }
      .row {
        margin: 0.5rem 0 0;
      }
    `,
  ],
})
export class UserEditDialogComponent {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  form: FormGroup;

  constructor(
    private readonly dialogRef: MatDialogRef<UserEditDialogComponent, boolean>,
    @Inject(MAT_DIALOG_DATA) public data: UserEditData,
  ) {
    this.form = this.fb.nonNullable.group({
      role: [data.user.role, Validators.required],
      level: [data.user.level, Validators.required],
      isActive: [data.user.isActive],
    });
  }

  async save(): Promise<void> {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    await this.api.put<AdminUserOut>(`/admin/users/${this.data.user.id}`, {
      role: v.role,
      level: v.level,
      isActive: v.isActive,
    });
    this.dialogRef.close(true);
  }
}
