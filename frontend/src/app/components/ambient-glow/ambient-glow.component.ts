import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-ambient-glow',
  standalone: true,
  template: `
    <div
      #glowElement
      class="pointer-events-none fixed z-0 w-[800px] h-[800px] rounded-full opacity-0 dark:opacity-[0.15] transition-opacity duration-700"
      [style.background]="'radial-gradient(circle, rgba(168,85,247, 1) 0%, rgba(168,85,247, 0) 60%)'"
      [style.filter]="'blur(80px)'"
      [style.transform]="'translateZ(0)'"
      [style.willChange]="'left, top'"
      [style.top.px]="-400"
      [style.left.px]="-400"
    ></div>
  `
})
export class AmbientGlowComponent implements AfterViewInit, OnDestroy {
  @ViewChild('glowElement') glowRef!: ElementRef<HTMLDivElement>;

  private mouseMoveHandler = (e: MouseEvent) => {
    if (!this.glowRef || !this.glowRef.nativeElement) return;
    const { clientX, clientY } = e;
    
    // Offset by half the width/height to center the glow on the cursor
    this.glowRef.nativeElement.animate(
      {
        left: `${clientX - 400}px`,
        top: `${clientY - 400}px`
      },
      { duration: 2500, fill: "forwards", easing: "ease-out" }
    );
  };

  ngAfterViewInit() {
    window.addEventListener('mousemove', this.mouseMoveHandler);
  }

  ngOnDestroy() {
    window.removeEventListener('mousemove', this.mouseMoveHandler);
  }
}
