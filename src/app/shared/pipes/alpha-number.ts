import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';


@Pipe({ name: 'alphaNumber' })
export class AlphaNumberPipe implements PipeTransform {
    constructor(private _sanitizer: DomSanitizer) { }
    transform(value: number): SafeHtml {
        const aphabets = {
            1: 'first',
            2: 'second',
            3: 'third',
            4: 'fourth',
        };
        return aphabets[value];
    }
}