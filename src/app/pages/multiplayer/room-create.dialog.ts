import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';

import { ApiService } from '../../core/http/api.service';
import { MultiplayerRoomOut, StudentGroupOut } from '../../core/models/room.model';

@Component({
  selector: 'app-room-create-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
  ],
  template: `
    <div class="fd-wrap">
      <div class="fd-header" style="background:linear-gradient(135deg,#a855f7,#7c3aed)">
        <div class="fd-header-icon"><mat-icon>groups</mat-icon></div>
        <div class="fd-header-text">
          <h2 class="fd-title">Nouvelle salle multijoueur</h2>
          <span class="fd-sub">Choisissez un groupe d'élèves et les participants</span>
        </div>
        <button class="fd-close" mat-dialog-close type="button"><mat-icon>close</mat-icon></button>
      </div>

      <div class="fd-body">
        @if (loadingGroups()) {
          <div class="loading-box">
            <mat-spinner diameter="28"></mat-spinner>
            <span>Chargement des groupes…</span>
          </div>
        } @else if (groups().length === 0) {
          <div class="empty-box">
            <mat-icon>school</mat-icon>
            <p>Aucun élève inscrit dans votre établissement.</p>
          </div>
        } @else {
          <form [formGroup]="form" class="fd-form">
            <mat-form-field appearance="outline" class="fd-full">
              <mat-label>Nom de la salle (optionnel)</mat-label>
              <mat-icon matPrefix>label</mat-icon>
              <input matInput formControlName="label" placeholder="Ex: Quiz grammaire 5ème A" />
            </mat-form-field>

            <mat-form-field appearance="outline" class="fd-full">
              <mat-label>Groupe / niveau</mat-label>
              <mat-icon matPrefix>school</mat-icon>
              <mat-select formControlName="classLevel" (selectionChange)="onGroupChange()">
                @for (group of groups(); track group.classLevel) {
                  <mat-option [value]="group.classLevel">
                    {{ group.classLevel }} ({{ group.students.length }} élève(s))
                  </mat-option>
                }
              </mat-select>
            </mat-form-field>

            @if (selectedGroup()) {
              <div class="students-panel">
                <div class="students-panel__head">
                  <span>Élèves à inviter</span>
                  <button type="button" class="link-btn" (click)="toggleAllStudents()">
                    {{ allSelected() ? 'Tout désélectionner' : 'Tout sélectionner' }}
                  </button>
                </div>
                <div class="students-list">
                  @for (student of selectedGroup()!.students; track student.id) {
                    <label class="student-row">
                      <mat-checkbox
                        [checked]="isSelected(student.id)"
                        (change)="toggleStudent(student.id, $event.checked)"
                      ></mat-checkbox>
                      <div class="student-info">
                        <span class="student-name">{{ student.firstName }} {{ student.lastName }}</span>
                        <span class="student-email">{{ student.email }}</span>
                      </div>
                    </label>
                  }
                </div>
                <p class="students-hint">
                  Sélectionnez au moins 2 élèves qui joueront ensemble.
                  <strong>{{ selectedIds().size }} sélectionné(s)</strong>
                </p>
              </div>
            }

            @if (error) {
              <div class="fd-error"><mat-icon>error_outline</mat-icon>{{ error }}</div>
            }
          </form>
        }
      </div>

      <div class="fd-footer">
        <button class="fd-btn-cancel" mat-dialog-close type="button">Annuler</button>
        <button
          class="fd-btn-save"
          type="button"
          (click)="save()"
          [disabled]="form.invalid || selectedIds().size < 2 || saving || loadingGroups()"
        >
          @if (saving) {
            <mat-spinner diameter="18" class="fd-spinner"></mat-spinner>
          } @else {
            <mat-icon>add_circle</mat-icon>
          }
          Créer la salle
        </button>
      </div>
    </div>
  `,
  styles: [`
    @use '../../shared/form-dialog';

    .loading-box, .empty-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 32px 16px;
      color: var(--clr-text-muted);
      text-align: center;
    }
    .empty-box mat-icon {
      font-size: 40px;
      width: 40px;
      height: 40px;
      color: #c084fc;
    }
    .students-panel {
      border: 1px solid rgba(168,85,247,.18);
      border-radius: 14px;
      overflow: hidden;
      background: rgba(168,85,247,.04);
    }
    .students-panel__head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 14px;
      border-bottom: 1px solid rgba(168,85,247,.12);
      font-size: 13px;
      font-weight: 700;
      color: var(--clr-text);
    }
    .link-btn {
      border: none;
      background: none;
      color: #a855f7;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      padding: 0;
    }
    .students-list {
      max-height: 220px;
      overflow-y: auto;
    }
    .student-row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 14px;
      border-bottom: 1px solid rgba(168,85,247,.08);
      cursor: pointer;
    }
    .student-row:last-child { border-bottom: none; }
    .student-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }
    .student-name {
      font-size: 14px;
      font-weight: 700;
      color: var(--clr-text);
    }
    .student-email {
      font-size: 12px;
      color: var(--clr-text-muted);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .students-hint {
      margin: 0;
      padding: 10px 14px 12px;
      font-size: 12px;
      color: var(--clr-text-muted);
    }
  `],
})
export class RoomCreateDialogComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<RoomCreateDialogComponent, boolean>);

  readonly loadingGroups = signal(true);
  readonly groups = signal<StudentGroupOut[]>([]);
  readonly selectedIds = signal<Set<string>>(new Set());

  saving = false;
  error = '';

  readonly form = this.fb.nonNullable.group({
    label: [''],
    classLevel: ['', Validators.required],
  });

  async ngOnInit(): Promise<void> {
    try {
      const groups = await this.api.get<StudentGroupOut[]>('/prof/student-groups');
      this.groups.set(groups);
      if (groups.length > 0) {
        this.form.patchValue({ classLevel: groups[0].classLevel });
      }
    } catch {
      this.error = 'Impossible de charger les groupes d\'élèves.';
    } finally {
      this.loadingGroups.set(false);
    }
  }

  selectedGroup(): StudentGroupOut | null {
    const classLevel = this.form.controls.classLevel.value;
    return this.groups().find(g => g.classLevel === classLevel) ?? null;
  }

  onGroupChange(): void {
    this.selectedIds.set(new Set());
  }

  isSelected(studentId: string): boolean {
    return this.selectedIds().has(studentId);
  }

  toggleStudent(studentId: string, checked: boolean): void {
    const next = new Set(this.selectedIds());
    if (checked) next.add(studentId);
    else next.delete(studentId);
    this.selectedIds.set(next);
  }

  allSelected(): boolean {
    const group = this.selectedGroup();
    if (!group || group.students.length === 0) return false;
    return group.students.every(s => this.selectedIds().has(s.id));
  }

  toggleAllStudents(): void {
    const group = this.selectedGroup();
    if (!group) return;
    if (this.allSelected()) {
      this.selectedIds.set(new Set());
      return;
    }
    this.selectedIds.set(new Set(group.students.map(s => s.id)));
  }

  async save(): Promise<void> {
    if (this.form.invalid || this.selectedIds().size < 2) return;
    this.saving = true;
    this.error = '';
    try {
      const value = this.form.getRawValue();
      await this.api.post<MultiplayerRoomOut>('/prof/multiplayer-rooms', {
        label: value.label.trim() || null,
        classLevel: value.classLevel,
        participantIds: Array.from(this.selectedIds()),
      });
      this.dialogRef.close(true);
    } catch (e: unknown) {
      this.error = e instanceof Error ? e.message : 'Erreur lors de la création de la salle.';
    } finally {
      this.saving = false;
    }
  }
}
