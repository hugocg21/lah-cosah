import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';

@Component({
  selector: 'app-image-modal',
  templateUrl: './media-modal.component.html',
})
export class MediaModalComponent {
  @Input() mediaUrl: string | null = null;
  @Output() close = new EventEmitter<void>();

  closeModal() {
    this.close.emit();
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapePress(event: KeyboardEvent) {
    this.closeModal();
  }

  ngOnInit() {
    document.body.style.overflow = 'hidden';
  }

  ngOnDestroy() {
    document.body.style.overflow = 'auto';
  }
}
