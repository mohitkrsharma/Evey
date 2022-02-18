import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'stringFilterBy'
})
export class StringFilterByPipe implements PipeTransform {
 constructor(private _sanitizer: DomSanitizer) { }
  transform(arr: any[], searchText: string,fieldName?:string):SafeHtml[] {
    let fieldName1;
    const fieldNames = fieldName.split('?')
    if(fieldNames.length && fieldNames.length >1) {
      fieldName = fieldNames[0];
      fieldName1 = fieldNames[1];
    } else {
      fieldName = fieldName;
    }
    if (!arr) return [];
    if (!searchText) return arr;
    searchText = searchText.toLowerCase();
    return arr.filter((it:any) => {
      if(typeof it == 'string'){
        return it.toLowerCase().includes(searchText);
      }else if(typeof it == 'number'){
        return it.toString().toLowerCase().includes(searchText);
      }else if(!fieldName1){
        return it[fieldName].toString().toLowerCase().includes(searchText);
      } else {
        if(it[fieldName].toString().toLowerCase().includes(searchText)) {
          return it[fieldName].toString().toLowerCase().includes(searchText);
        } else {
          return it[fieldName1].toString().toLowerCase().includes(searchText);
        }
      }
      
    });
  }
  
}
