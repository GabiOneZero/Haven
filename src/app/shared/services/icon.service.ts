import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Observable, of } from 'rxjs';
import { map, shareReplay, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class IconService {
  private http = inject(HttpClient);
  private sanitizer = inject(DomSanitizer);
  private cache = new Map<string, Observable<SafeHtml>>();

  getSvg(name: string): Observable<SafeHtml> {
    const sanitizedName = name.toLowerCase().trim();
    
    if (this.cache.has(sanitizedName)) {
      return this.cache.get(sanitizedName)!;
    }

    const url = `assets/icons/${sanitizedName}.svg`;
    const icon$ = this.http.get(url, { responseType: 'text' }).pipe(
      map((svgContent) => this.sanitizer.bypassSecurityTrustHtml(svgContent)),
      catchError(() => of('')),
      shareReplay(1)
    );

    this.cache.set(sanitizedName, icon$);
    return icon$;
  }
}
